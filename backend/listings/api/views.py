import logging
import uuid

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Case, Count, IntegerField, Q, When
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from listings.models import Business, Country, City, Town, Category, BusinessClaimRequest
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


class BusinessList(generics.ListAPIView):
    queryset = Business.objects.all().select_related("country", "city", "category")
    serializer_class = BusinessSerializer


class BusinessDetail(generics.RetrieveAPIView):
    lookup_field = "slug"
    queryset = Business.objects.all().select_related("country", "city", "category")
    serializer_class = BusinessSerializer


class CountryList(generics.ListAPIView):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer


class CountryStatsListView(generics.ListAPIView):
    """Countries with business and city counts for Country Explorer"""
    serializer_class = CountryWithStatsSerializer
    
    def get_queryset(self):
        return Country.objects.annotate(
            business_count=Count('businesses'),
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


class CategoryList(generics.ListAPIView):
    queryset = Category.objects.all()
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
    business = Business.objects.filter(id=business_id).first() if business_id else None

    claim = BusinessClaimRequest.objects.create(
        listing=business,
        name=data.get("name"),
        email=data.get("email"),
        business_name=data.get("business_name"),
        business_address=data.get("business_address"),
        business_post_code=data.get("business_post_code"),
    )

    verification_base_url = settings.FRONTEND_SITE_URL or settings.PUBLIC_SITE_URL or ""
    verification_url = f"{verification_base_url.rstrip('/')}/verify?token={claim.verification_token}" if verification_base_url else f"/verify?token={claim.verification_token}"
    logger.info("Attempting to send verification email for claim_id=%s", claim.id)

    try:
        send_mail(
            subject="Verify your business claim on ListAcross.eu",
            message=f"Click here to verify: {verification_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[claim.email],
            fail_silently=False,
        )
        logger.info("Verification email sent for claim_id=%s", claim.id)
    except Exception as e:
        logger.exception("Verification email failed for claim_id=%s", claim.id)
        raise

    return Response(
        {"message": "Verification email sent", "claim_id": claim.id},
        status=status.HTTP_201_CREATED,
    )


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
        claim = BusinessClaimRequest.objects.get(verification_token=token)

        if claim.status == "verified":
            return Response({"message": "Already verified"})

        claim.status = "verified"
        claim.verified_at = timezone.now()
        claim.save()

        return Response(
            {"message": "Claim verified successfully", "business_name": claim.business_name}
        )
    except BusinessClaimRequest.DoesNotExist:
        return Response({"error": "Invalid token"}, status=status.HTTP_404_NOT_FOUND)


class BusinessSearchView(APIView):
    """
    Search and filter businesses.

    Supports query parameters:
    - q: free text search
    - country: country slug or name (case-insensitive)
    - city: city slug or name (case-insensitive)
    - category: category slug or name (case-insensitive)
    - is_micro: true/false
    - limit: page size (default 20, max 100)
    - offset: pagination offset (default 0)
    """



    def get(self, request, *args, **kwargs):
        qs = Business.objects.all().select_related("country", "city", "category")

        q = (request.query_params.get("q") or "").strip()
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

        # Free-text search (simple OR across key fields)
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(description__icontains=q)
                | Q(address__icontains=q)
                | Q(website__icontains=q)
            )

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
            qs = qs.filter(
                Q(category__slug__iexact=category)
                | Q(category__name__iexact=category)
            )

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
        qs = qs.order_by(tier_priority, "created_at", "name")[offset : offset + limit]

        serializer = BusinessSerializer(qs, many=True)
        data = {
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": serializer.data,
        }
        return Response(data, status=status.HTTP_200_OK)


class DebugListingsSampleView(APIView):
    """Debug endpoint - returns first 20 listings with all fields."""

    permission_classes = [IsAdminUser]
    
    def get(self, request):
        listings = Business.objects.select_related('country', 'city', 'category')[:20]
        serializer = BusinessSerializer(listings, many=True)
        
        return Response({
            'count': listings.count(),
            'sample_data': serializer.data,
            'debug_info': {
                'total_listings': Business.objects.count(),
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
            businesses__isnull=False
        ).annotate(
            business_count=Count('businesses')
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
        
        qs = City.objects.filter(businesses__isnull=False).select_related('country')
        
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
        qs = Business.objects.filter(
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
            top_categories = Category.objects.filter(
                business__isnull=False
            ).annotate(
                global_business_count=Count('business', distinct=True)
            ).distinct().order_by('-global_business_count', 'name')[:5]
            
            # Get the category IDs in the order they should be returned
            category_ids = [cat.id for cat in top_categories]
            
            # Now get business counts for these categories in the specific country
            if country_param:
                categories_dict = {}
                for cat in Category.objects.filter(id__in=category_ids).annotate(
                    business_count=Count(
                        'business',
                        filter=Q(business__country__name__iexact=country_param) |
                               Q(business__country__slug__iexact=country_param),
                        distinct=True
                    )
                ):
                    categories_dict[cat.id] = cat
            else:
                categories_dict = {}
                for cat in Category.objects.filter(id__in=category_ids).annotate(
                    business_count=Count('business', distinct=True)
                ):
                    categories_dict[cat.id] = cat
                
            # Preserve original order by manually ordering
            categories_list = []
            for cat_id in category_ids:
                if cat_id in categories_dict:
                    categories_list.append(categories_dict[cat_id])
                
        else:
            # Original behavior - filter categories by country
            qs = Category.objects.filter(business__isnull=False)
            
            if country_param:
                # Filter categories by country using various country identifiers
                qs = qs.filter(
                    Q(business__country__name__iexact=country_param) |
                    Q(business__country__slug__iexact=country_param)
                )
            
            categories_list = qs.annotate(
                business_count=Count('business', distinct=True)
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
            businesses__isnull=False
        ).annotate(
            business_count=Count('businesses', distinct=True)
        ).order_by('-business_count')[:max_countries]
        
        result = []
        
        for country in top_countries:
            # Get top cities for this country
            top_cities = City.objects.filter(
                country=country,
                businesses__isnull=False
            ).annotate(
                business_count=Count('businesses', distinct=True)
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
            business_count=Count('businesses')
        ).filter(business_count__gt=0).order_by('-business_count')
        
        max_countries = int(request.GET.get('max_countries', 50))
        countries_with_businesses = countries_with_businesses[:max_countries]
        
        result = []
        
        for country in countries_with_businesses:
            # Get top 4 categories for this country
            top_categories = (
                Business.objects
                .filter(country=country, category__isnull=False)
                .values('category__name', 'category__slug')
                .annotate(business_count=Count('id'))
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
            
        qs = Business.objects.select_related('country', 'city', 'town', 'category')
        
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





