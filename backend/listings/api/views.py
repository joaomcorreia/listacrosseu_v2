import logging
import re
import uuid

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Case, Count, IntegerField, Q, Value, When
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework.views import APIView
from listings.models import Business, Country, City, Town, Category, BusinessClaimRequest
from listings.directory_indexability import is_country_category_indexable
from listings.public_querysets import public_businesses, public_categories
from listings.claim_flow import normalize_claimed_draft, save_claimed_draft
from listings.category_suggestions import ensure_category_suggestion, resolve_pending_category_suggestions
from .serializers import (
    BusinessSerializer,
    CountrySerializer,
    CountryWithStatsSerializer,
    CitySerializer,
    TownSerializer,
    CategorySerializer,
    BusinessClaimRequestSerializer,
)

logger = logging.getLogger(__name__)


def _search_terms(value):
    """Return simple, punctuation-tolerant terms and singular variants."""
    normalized = re.sub(r"[^\w\s-]", " ", (value or "").lower(), flags=re.UNICODE)
    terms = []
    for token in normalized.split():
        if len(token) > 4 and token.endswith("s") and not token.endswith("ss"):
            token = token[:-1]
        if token and token not in terms:
            terms.append(token)
    return terms


class BusinessList(generics.ListAPIView):
    queryset = public_businesses().select_related("country", "city", "category")
    serializer_class = BusinessSerializer


class BusinessDetail(generics.RetrieveAPIView):
    lookup_field = "slug"
    queryset = public_businesses().select_related("country", "city", "category")
    serializer_class = BusinessSerializer


class CountryList(generics.ListAPIView):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer


class CountryStatsListView(generics.ListAPIView):
    """Countries with business and city counts for Country Explorer"""
    serializer_class = CountryWithStatsSerializer
    
    def get_queryset(self):
        return Country.objects.annotate(
            business_count=Count('businesses', filter=Q(businesses__is_published=True)),
            city_count=Count('cities')
        ).filter(
            business_count__gt=0  # Only countries with businesses
        ).order_by('name')


class CityList(generics.ListAPIView):
    queryset = City.objects.all().select_related("country")
    serializer_class = CitySerializer


class TownList(generics.ListAPIView):
    queryset = Town.objects.all().select_related("city__country")
    serializer_class = TownSerializer

    def get_queryset(self):
        queryset = self.queryset
        city_slug = self.request.query_params.get('city', None)
        if city_slug:
            queryset = queryset.filter(city__slug=city_slug)
        return queryset


@method_decorator(never_cache, name="dispatch")
class CategoryList(generics.ListAPIView):
    queryset = public_categories()
    serializer_class = CategorySerializer


class BusinessClaimRequestCreate(generics.CreateAPIView):
    queryset = BusinessClaimRequest.objects.all()
    serializer_class = BusinessClaimRequestSerializer

@api_view(["POST"])
@permission_classes([AllowAny])
def create_claim(request):
    """
    POST /api/claims
    Create new business claim and send verification email
    """
    data = request.data

    business_id = data.get("business_id") or data.get("listing_id")
    business = Business.objects.filter(id=business_id, is_published=True).first() if business_id else None
    if business is None:
        return Response({"detail": "Choose an existing published business listing."}, status=status.HTTP_400_BAD_REQUEST)

    email = (request.user.email if request.user.is_authenticated else str(data.get("email") or "").strip().lower())
    required = (data.get("name"), email, data.get("business_name"), data.get("business_address"), data.get("business_post_code"))
    if any(not str(value or "").strip() for value in required):
        return Response({"detail": "Name, email, business name, address and post code are required."}, status=status.HTTP_400_BAD_REQUEST)
    draft_payload = data.get("draft") if isinstance(data.get("draft"), dict) else {}
    if len(str(draft_payload.get("website") or "").strip()) > Business.WEBSITE_MAX_LENGTH:
        return Response({"detail": f"Website URLs must be {Business.WEBSITE_MAX_LENGTH} characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
    category_suggestion = str(draft_payload.get("category_suggestion") or "").strip()

    verified_claim = BusinessClaimRequest.objects.filter(listing=business, status="verified").order_by("-created_at").first()
    if verified_claim:
        if verified_claim.email.lower() == email.lower():
            return Response({"message": "This business is already linked to your verified account.", "claim_id": verified_claim.id, "business_id": business.id, "claim_status": "verified"})
        return Response({"detail": "This business has already been claimed by another verified owner."}, status=status.HTTP_409_CONFLICT)

    pending = BusinessClaimRequest.objects.filter(listing=business, email__iexact=email, status="pending").order_by("-created_at").first()
    draft = normalize_claimed_draft(business, data.get("draft"))
    if pending:
        claim = pending
    else:
        claim = BusinessClaimRequest.objects.create(
            listing=business,
            name=str(data.get("name")).strip(),
            email=email,
            business_name=str(data.get("business_name")).strip(),
            business_address=str(data.get("business_address")).strip(),
            business_post_code=str(data.get("business_post_code")).strip(),
        )
    save_claimed_draft(business, draft)
    selected_category = Category.objects.filter(
        pk=draft.get("category_id"), is_public=True,
    ).exclude(slug="uncategorized").first() if draft.get("category_id") else None
    if selected_category and not category_suggestion:
        business.category = selected_category
        business.save(update_fields=["category"])
        resolve_pending_category_suggestions(listing=business, category=selected_category)
    if category_suggestion:
        ensure_category_suggestion(proposed_name=category_suggestion, listing=business, user=request.user, email=email)

    if request.user.is_authenticated:
        claim.status = "verified"
        claim.verified_at = timezone.now()
        claim.save(update_fields=["status", "verified_at"])
        return Response({"message": "Claim verified. Your Claimed Listing draft is ready.", "claim_id": claim.id, "business_id": business.id, "claim_status": "verified", "claimed_listing_status": "draft"}, status=status.HTTP_201_CREATED)

    from django.contrib.auth import get_user_model
    user = get_user_model().objects.filter(email__iexact=email).first()
    if user is None:
        password = str(data.get("password") or "")
        if len(password) < 8:
            return Response({"detail": "Choose a password of at least 8 characters to continue."}, status=status.HTTP_400_BAD_REQUEST)
        user = get_user_model().objects.create_user(username=email, email=email, password=password, is_active=False)
        from .dashboard import _send_account_verification
        try:
            _send_account_verification(user, claim)
        except Exception:
            user.delete()
            return Response({"detail": "We could not send the verification email. Please try again."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"message": "Account created. Check your email to verify your claim.", "claim_id": claim.id, "business_id": business.id, "claim_status": claim.status, "claimed_listing_status": "draft", "account_created": True, "claim_token": str(claim.verification_token), "email": email}, status=status.HTTP_201_CREATED)

    if not user.is_active:
        from .dashboard import _send_account_verification
        try:
            _send_account_verification(user, claim)
        except Exception:
            return Response({"detail": "We could not send the verification email. Please try again."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"message": "Your account needs email verification before this claim can continue.", "claim_id": claim.id, "business_id": business.id, "claim_status": claim.status, "claimed_listing_status": "draft", "account_created": False, "claim_token": str(claim.verification_token), "email": email}, status=status.HTTP_201_CREATED)

    return Response({"message": "Sign in to continue this claim for your account.", "claim_id": claim.id, "business_id": business.id, "claim_status": claim.status, "claimed_listing_status": "draft", "account_exists": True, "claim_token": str(claim.verification_token), "email": email}, status=status.HTTP_201_CREATED)

    return Response({
        "message": "Claim started. Create an account or sign in with this email to receive the verification email.",
        "claim_id": claim.id,
        "business_id": business.id,
        "claim_status": claim.status,
        "claim_token": str(claim.verification_token),
        "email": claim.email,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_claim(request):
    """
    GET /api/verify?token=xxx
    Verify business claim token
    """
    token = request.GET.get("token")

    if not token:
        return Response({"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token_uuid = uuid.UUID(str(token))
    except (TypeError, ValueError, AttributeError):
        return Response({"error": "Invalid verification token"}, status=status.HTTP_400_BAD_REQUEST)

    if not BusinessClaimRequest.objects.filter(verification_token=token_uuid).exists():
        return Response({"error": "Invalid token"}, status=status.HTTP_404_NOT_FOUND)
    return Response({"error": "Account verification is required. Use the verification link sent after account creation."}, status=status.HTTP_410_GONE)


class BusinessSearchView(APIView):
    """
    Search and filter businesses.

    Supports query parameters:
    - q: free text search
    - location: free text city, region, or country search
    - country: country slug or name (case-insensitive)
    - city: city slug or name (case-insensitive)
    - category: category slug or name (case-insensitive)
    - is_micro: true/false
    - limit: page size (default 20, max 100)
    - offset: pagination offset (default 0)
    """



    def get(self, request, *args, **kwargs):
        qs = public_businesses().select_related("country", "city", "category")

        q = (request.query_params.get("q") or "").strip()
        location = (request.query_params.get("location") or "").strip()
        country = (request.query_params.get("country") or "").strip()
        city = (request.query_params.get("city") or "").strip()
        town = (request.query_params.get("town") or "").strip()
        category = (request.query_params.get("category") or "").strip()
        tier_filter = (request.query_params.get("tier") or "").strip()
        is_micro = (request.query_params.get("is_micro") or "").strip()
        try:
            limit = int(request.query_params.get("limit", 20))
        except ValueError:
            limit = 20
        try:
            offset = int(request.query_params.get("offset", 0))
        except ValueError:
            offset = 0

        if limit <= 0:
            limit = 20
        if limit > 100:
            limit = 100
        if offset < 0:
            offset = 0

        # Support a natural phrase such as "restaurants in Antwerp" when the
        # dedicated location field is empty, but only extract a real known
        # city/country so ordinary uses of the word "in" are untouched.
        detected_location = ""
        if not location:
            phrase_match = re.match(r"^(.*?)\s+in\s+([^,]+)$", q, flags=re.IGNORECASE)
            if phrase_match:
                candidate = phrase_match.group(2).strip()
                if (
                    City.objects.filter(Q(name__iexact=candidate) | Q(slug__iexact=candidate)).exists()
                    or Country.objects.filter(
                        Q(name__iexact=candidate)
                        | Q(slug__iexact=candidate)
                        | Q(code__iexact=candidate)
                    ).exists()
                ):
                    q = phrase_match.group(1).strip()
                    location = candidate
                    detected_location = candidate

        # Location is deliberately applied independently from keyword terms.
        # This lets one keyword match a category while another matches content.
        if location:
            for term in _search_terms(location):
                qs = qs.filter(
                    Q(city__name__icontains=term)
                    | Q(city__slug__icontains=term)
                    | Q(country__name__icontains=term)
                    | Q(country__slug__icontains=term)
                    | Q(country__code__icontains=term)
                    | Q(town__name__icontains=term)
                    | Q(town__slug__icontains=term)
                )

        def term_query(term):
            return (
                Q(name__icontains=term)
                | Q(description__icontains=term)
                | Q(address__icontains=term)
                | Q(website__icontains=term)
                | Q(category__name__icontains=term)
                | Q(keywords__icontains=term)
                | Q(premium_sidebar__icontains=term)
            )

        def strong_term_query(term):
            return Q(name__icontains=term) | Q(category__name__icontains=term)

        query_terms = _search_terms(q)
        fallback_used = False
        fallback_term = ""
        ranking_terms = query_terms
        if query_terms:
            exact_qs = qs
            for term in query_terms:
                exact_qs = exact_qs.filter(term_query(term))

            if exact_qs.exists():
                qs = exact_qs
            elif len(query_terms) > 1:
                # If the full intersection is empty, prefer the strongest
                # business-type/category term for a transparent related result.
                candidates = []
                for index, term in enumerate(query_terms):
                    candidate_qs = qs.filter(term_query(term))
                    candidate_count = candidate_qs.count()
                    strong_count = qs.filter(strong_term_query(term)).count()
                    if candidate_count and strong_count:
                        candidates.append((strong_count, candidate_count, -index, term, candidate_qs))
                if candidates:
                    _, _, _, fallback_term, qs = max(candidates, key=lambda item: item[:3])
                    fallback_used = True
                    ranking_terms = [fallback_term]
                else:
                    qs = exact_qs
            else:
                qs = exact_qs

        # Lightweight relevance: name, then category, then keywords/services,
        # then descriptive content. The fallback uses the same ordering.
        if ranking_terms:
            score = Value(0, output_field=IntegerField())
            for term in ranking_terms:
                score = score + Case(
                    When(name__iexact=term, then=Value(100)),
                    When(name__icontains=term, then=Value(80)),
                    When(category__name__icontains=term, then=Value(60)),
                    When(keywords__icontains=term, then=Value(45)),
                    When(premium_sidebar__icontains=term, then=Value(40)),
                    When(description__icontains=term, then=Value(20)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            qs = qs.annotate(search_score=score)

        country_obj = None

        # Country filter (slug, name, or code)
        if country:
            try:
                country_obj = Country.objects.get(
                    Q(slug__iexact=country)
                    | Q(code__iexact=country)
                    | Q(name__iexact=country)
                )
            except Country.DoesNotExist:
                return Response({"detail": "Country not found"}, status=status.HTTP_404_NOT_FOUND)
            qs = qs.filter(country=country_obj)

        # City filter (slug or name)
        if city:
            qs = qs.filter(
                Q(city__slug__iexact=city)
                | Q(city__name__iexact=city)
            )

        # Town filter (slug or name)
        if town:
            qs = qs.filter(
                Q(town__slug__iexact=town)
                | Q(town__name__iexact=town)
            )

        # Category filter (slug or name)
        if category:
            category_obj = Category.objects.filter(
                Q(slug__iexact=category) | Q(name__iexact=category)
            ).first()
            if category_obj is None or not category_obj.is_public:
                qs = qs.none()
            else:
                qs = qs.filter(category=category_obj)

        if tier_filter in {"free", "claimed", "premium"}:
            qs = qs.filter(tier=tier_filter)

        # Micro business filter
        if is_micro:
            flag = is_micro.strip().lower() in {"1", "true", "yes", "y"}
            qs = qs.filter(is_micro=flag)

        total = qs.count()
        tier_priority = Case(
            When(tier="premium", then=0),
            When(tier="claimed", then=1),
            When(tier="free", then=2),
            default=3,
            output_field=IntegerField(),
        )
        ordering = (["-search_score"] if ranking_terms else []) + [tier_priority, "created_at", "name"]
        qs = qs.order_by(*ordering)[offset : offset + limit]

        serializer = BusinessSerializer(qs, many=True)
        data = {
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": serializer.data,
            "fallback": fallback_used,
            "fallback_term": fallback_term,
            "detected_location": detected_location,
            "normalized_query": q,
        }
        if country and category:
            data["country_category_indexable"] = is_country_category_indexable(total)
        if fallback_used:
            data["fallback_message"] = (
                f"No exact matches found. Showing related results for {fallback_term}"
                + (f" in {location}." if location else ".")
            )
        return Response(data, status=status.HTTP_200_OK)


class DebugListingsSampleView(APIView):
    """Debug endpoint - returns first 20 listings with all fields."""

    permission_classes = [IsAdminUser]
    
    def get(self, request):
        listings = public_businesses().select_related('country', 'city', 'category')[:20]
        serializer = BusinessSerializer(listings, many=True)
        
        return Response({
            'count': listings.count(),
            'sample_data': serializer.data,
            'debug_info': {
                'total_listings': public_businesses().count(),
                'total_countries': Country.objects.count(), 
                'total_cities': City.objects.count(),
                'total_categories': Category.objects.count()
            }
        })


class FilteredCountryListView(APIView):
    """Get countries that have listings with business counts"""
    
    def get(self, request):
        from django.db.models import Count
        
        countries = Country.objects.filter(
            businesses__is_published=True
        ).annotate(
            business_count=Count('businesses', filter=Q(businesses__is_published=True), distinct=True)
        ).distinct().order_by('name')
        
        # Create response with business counts
        data = []
        for country in countries:
            data.append({
                'id': country.id,
                'name': country.name,
                'slug': country.slug,
                'business_count': country.business_count
            })
        
        return Response(data)


class FilteredCityListView(APIView):
    """Get cities that have listings, optionally filtered by country"""
    
    def get(self, request):
        country_param = request.GET.get('country', '').strip()
        
        qs = City.objects.filter(businesses__is_published=True).select_related('country')
        
        if country_param:
            qs = qs.filter(
                Q(country__code__iexact=country_param) |
                Q(country__name__iexact=country_param) |
                Q(country__slug__iexact=country_param)
            )
        
        cities = qs.distinct().order_by('name')
        serializer = CitySerializer(cities, many=True)
        return Response(serializer.data)


class FilteredTownListView(APIView):
    """Get towns that have listings, filtered by country and optionally city"""
    
    def get(self, request):
        country_param = request.GET.get('country', '').strip()
        city_param = request.GET.get('city', '').strip()
        
        if not country_param:
            return Response(
                {'error': 'country parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get distinct towns from businesses
        qs = public_businesses().filter(
            town__isnull=False,
            town__gt=''
        ).select_related('country', 'city')
        
        # Filter by country
        qs = qs.filter(
            Q(country__code__iexact=country_param) |
            Q(country__name__iexact=country_param) |
            Q(country__slug__iexact=country_param)
        )
        
        # Filter by city if provided
        if city_param:
            qs = qs.filter(
                Q(city__name__iexact=city_param) |
                Q(city__slug__iexact=city_param)
            )
        
        # Get distinct towns
        towns = qs.values('town').distinct().order_by('town')
        
        town_list = [{'name': town['town'], 'slug': town['town'].lower().replace(' ', '-')} for town in towns]
        
        return Response(town_list)


class FilteredCategoryListView(APIView):
    """Get categories that have listings, optionally filtered by country"""
    
    def get(self, request):
        from django.db.models import Count
        
        country_param = request.GET.get('country', '').strip()
        global_top = request.GET.get('global_top', '').strip().lower() in {'1', 'true', 'yes'}
        
        if global_top:
            # Return top 5 global categories but show business count for specific country
            top_categories = public_categories().filter(
                business__is_published=True
            ).annotate(
                global_business_count=Count('business', filter=Q(business__is_published=True), distinct=True)
            ).distinct().order_by('-global_business_count', 'name')[:5]
            
            # Get the category IDs in the order they should be returned
            category_ids = [cat.id for cat in top_categories]
            
            # Now get business counts for these categories in the specific country
            if country_param:
                categories_dict = {}
                for cat in public_categories().filter(id__in=category_ids).annotate(
                    business_count=Count(
                        'business',
                        filter=(Q(business__is_published=True) & (Q(business__country__name__iexact=country_param) |
                               Q(business__country__slug__iexact=country_param))),
                        distinct=True
                    )
                ):
                    categories_dict[cat.id] = cat
            else:
                categories_dict = {}
                for cat in public_categories().filter(id__in=category_ids).annotate(
                    business_count=Count('business', filter=Q(business__is_published=True), distinct=True)
                ):
                    categories_dict[cat.id] = cat
                
            # Preserve original order by manually ordering
            categories_list = []
            for cat_id in category_ids:
                if cat_id in categories_dict:
                    categories_list.append(categories_dict[cat_id])
                
        else:
            # Original behavior - filter categories by country
            qs = public_categories().filter(business__is_published=True)
            
            if country_param:
                # Filter categories by country using various country identifiers
                qs = qs.filter(
                    Q(business__is_published=True) & (Q(business__country__name__iexact=country_param) |
                    Q(business__country__slug__iexact=country_param))
                )
            
            categories_list = qs.annotate(
                business_count=Count('business', filter=Q(business__is_published=True), distinct=True)
            ).distinct().order_by('-business_count', 'name')  # Order by business count desc, then name
        
        serializer = CategorySerializer(categories_list, many=True)
        return Response(serializer.data)


class TopCitiesView(APIView):
    """Get top cities with most businesses, grouped by country"""
    
    def get(self, request):
        from django.db.models import Count
        
        limit_per_country = int(request.GET.get('limit_per_country', 3))
        max_countries = int(request.GET.get('max_countries', 50))  # Show all countries
        
        # Get top countries by business count
        top_countries = Country.objects.filter(
            businesses__is_published=True
        ).annotate(
            business_count=Count('businesses', filter=Q(businesses__is_published=True), distinct=True)
        ).order_by('-business_count')[:max_countries]
        
        result = []
        
        for country in top_countries:
            # Get top cities for this country
            top_cities = City.objects.filter(
                country=country,
                businesses__is_published=True
            ).annotate(
                business_count=Count('businesses', filter=Q(businesses__is_published=True), distinct=True)
            ).order_by('-business_count')[:limit_per_country]
            
            if top_cities.exists():
                country_data = {
                    'country': {
                        'id': country.id,
                        'name': country.name,
                        'slug': country.slug,
                        'business_count': country.business_count
                    },
                    'cities': []
                }
                
                for city in top_cities:
                    country_data['cities'].append({
                        'id': city.id,
                        'name': city.name,
                        'slug': city.slug,
                        'business_count': city.business_count
                    })
                
                result.append(country_data)
        
        return Response(result)


class TopCountriesWithCategoriesView(APIView):
    """
    Returns countries with their top categories (by business count)
    """
    def get(self, request):
        from django.db.models import Count
        
        # Get countries that have businesses
        countries_with_businesses = Country.objects.annotate(
            business_count=Count('businesses', filter=Q(businesses__is_published=True), distinct=True)
        ).filter(business_count__gt=0).order_by('-business_count')
        
        max_countries = int(request.GET.get('max_countries', 50))
        countries_with_businesses = countries_with_businesses[:max_countries]
        
        result = []
        
        for country in countries_with_businesses:
            # Get top 4 categories for this country
            top_categories = (
                public_businesses()
                .filter(country=country, category__isnull=False, category__is_public=True)
                .values('category__name', 'category__slug')
                .annotate(business_count=Count('id', filter=Q(is_published=True)))
                .order_by('-business_count')[:4]
            )
            
            if top_categories:
                country_data = {
                    'country': {
                        'id': country.id,
                        'name': country.name,
                        'slug': country.slug,
                        'business_count': country.business_count
                    },
                    'categories': []
                }
                
                for category in top_categories:
                    country_data['categories'].append({
                        'name': category['category__name'],
                        'slug': category['category__slug'],
                        'business_count': category['business_count']
                    })
                
                result.append(country_data)
        
        return Response(result)


class FeaturedBusinessListView(APIView):
    """
    Return businesses based on tier visibility rules.
    
    Premium businesses get EU-wide visibility.
    Claimed businesses get regional visibility.
    Free businesses get local visibility only.
    
    Query parameters:
    - scope: 'eu', 'country', 'city', 'local' (default: 'local')
    - country: country slug for country/city scopes
    - city: city slug for city scope
    - tier: filter by tier ('free', 'claimed', 'premium')
    - limit: max results (default 10, max 50)
    """
    
    def get(self, request, *args, **kwargs):
        scope = request.query_params.get('scope', 'local')
        country_slug = request.query_params.get('country', '')
        city_slug = request.query_params.get('city', '')
        tier_filter = request.query_params.get('tier', '')
        
        try:
            limit = min(int(request.query_params.get('limit', 10)), 50)
        except ValueError:
            limit = 10
            
        qs = public_businesses().select_related('country', 'city', 'town', 'category')
        
        if scope == 'eu':
            # EU-wide: premium listings with EU-wide visibility only
            qs = qs.filter(tier="premium", visibility_scope="eu")
        elif scope == 'country':
            # Country-wide: expose every tier, with premium/claimed ranking below.
            country_param = (country_slug or "").strip()
            if not country_param:
                return Response({'error': 'country parameter is required'}, status=400)
            try:
                country = Country.objects.get(
                    Q(slug__iexact=country_param)
                    | Q(code__iexact=country_param)
                    | Q(name__iexact=country_param)
                )
                # Location scopes expose every listing tier. Premium and claimed
                # listings are ranked first below, but free listings remain discoverable.
                qs = qs.filter(country=country)
            except Country.DoesNotExist:
                return Response({'error': 'Country not found'}, status=404)
        elif scope == 'city' and city_slug:
            # City-wide: expose every tier, with premium/claimed ranking below.
            try:
                city = City.objects.get(slug=city_slug)
                qs = qs.filter(city=city)
            except City.DoesNotExist:
                return Response({'error': 'City not found'}, status=404)
        else:
            # Local/default: All tiers
            pass
            
        # Apply tier filter if specified
        if tier_filter in ['free', 'claimed', 'premium']:
            qs = qs.filter(tier=tier_filter)
            
        # Order by tier priority (premium first, then claimed, then free)
        # Then by created_at for consistency
        tier_priority = Case(
            When(tier="premium", then=0),
            When(tier="claimed", then=1),
            When(tier="free", then=2),
            default=3,
            output_field=IntegerField(),
        )
        businesses = qs.order_by(tier_priority, "created_at", "name")[:limit]
        
        serializer = BusinessSerializer(businesses, many=True, context={'request': request})
        
        return Response({
            'scope': scope,
            'count': len(businesses),
            'results': serializer.data
        })





