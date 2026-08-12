from datetime import timedelta
import re

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from listings.models import Business, BusinessClaimRequest, Category, City, Country

from .serializers import BusinessSerializer, CitySerializer


EDITABLE_FIELDS = {
    "name", "business_type", "phone", "description", "owner_name", "email",
    "website", "logo_url", "image_url", "region", "address", "address_line1", "postal_code",
}
VISIBILITY_FIELDS = {"owner_name", "city", "region", "phone", "email", "website"}
WEBSITE_PALETTES = [
    ("#2563eb", "#0f172a"), ("#0f766e", "#102a2a"), ("#b45309", "#2a1a0f"),
    ("#be123c", "#2a1018"), ("#7c3aed", "#1e1633"), ("#15803d", "#102719"),
    ("#c2410c", "#29150d"), ("#334155", "#111827"),
]


def _verified_business(request, business_id):
    business = get_object_or_404(owned_businesses(request.user), pk=business_id)
    if not BusinessClaimRequest.objects.filter(
        listing=business, email__iexact=request.user.email, status="verified"
    ).exists():
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Ownership verification is required.")
    return business


def _website_draft(business):
    stored = (business.premium_sidebar or {}).get("_website")
    if stored:
        return stored
    primary, dark = WEBSITE_PALETTES[business.id % len(WEBSITE_PALETTES)]
    dashboard = (business.premium_sidebar or {}).get("_dashboard", {})
    services = dashboard.get("services", [])
    if not isinstance(services, list):
        services = []
    gallery = business.premium_images if isinstance(business.premium_images, list) else []
    draft = {
        "version": 1,
        "status": "draft",
        "layout_mode": "one_page",
        "theme": {"primary": primary, "dark": dark},
        "trial": {"status": "not_started", "started_at": None, "ends_at": None},
        "sections": {
            "hero": {"enabled": True, "title": business.name, "tagline": business.description, "image": business.image_url or ""},
            "services": {"enabled": bool(services), "items": services},
            "about": {"enabled": bool(business.description or business.category_id), "title": "About", "text": business.description},
            "gallery": {"enabled": bool(gallery), "items": gallery},
            "contact": {
                "enabled": True,
                "phone": business.phone,
                "email": dashboard.get("email", ""),
                "website": business.website,
                "address": business.address_line1 or business.address,
                "city": business.city.name if business.city else "",
                "region": dashboard.get("region", ""),
                "country": business.country.name if business.country else "",
            },
        },
    }
    return draft


def _save_website(business, draft):
    business.premium_sidebar = {**(business.premium_sidebar or {}), "_website": draft}
    business.save(update_fields=["premium_sidebar"])


def _website_response(business, created=False):
    draft = _website_draft(business)
    if created:
        _save_website(business, draft)
    return {"business_id": business.id, "business_slug": business.slug, "business_name": business.name, "website": draft}


@method_decorator(ensure_csrf_cookie, name="dispatch")
class DashboardAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "authenticated": request.user.is_authenticated,
            "csrfToken": get_token(request),
            "user": {"username": request.user.username, "email": request.user.email} if request.user.is_authenticated else None,
        })

    def post(self, request):
        identifier = request.data.get("email") or request.data.get("username")
        password = request.data.get("password")
        if not identifier or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=identifier, password=password)
        if user is None and "@" in identifier:
            from django.contrib.auth import get_user_model
            candidate = get_user_model().objects.filter(email__iexact=identifier).first()
            user = authenticate(request, username=candidate.username, password=password) if candidate else None
        if user is None:
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        login(request, user)
        return Response({"authenticated": True, "csrfToken": get_token(request), "user": {"username": user.username, "email": user.email}})

    def put(self, request):
        from django.contrib.auth import get_user_model
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if get_user_model().objects.filter(email__iexact=email).exists():
            return Response({"detail": "An account with this email already exists."}, status=status.HTTP_409_CONFLICT)
        username = email
        user = get_user_model().objects.create_user(username=username, email=email, password=password)
        login(request, user)
        return Response({"authenticated": True, "csrfToken": get_token(request), "user": {"username": user.username, "email": user.email}}, status=status.HTTP_201_CREATED)


class CreateBusinessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        required = ("name", "category_id", "city_id", "country_id", "description")
        if any(not str(data.get(field, "")).strip() for field in required):
            return Response({"detail": "Business name, category, city, country and description are required."}, status=status.HTTP_400_BAD_REQUEST)
        category = get_object_or_404(Category, pk=data["category_id"])
        city = get_object_or_404(City, pk=data["city_id"])
        country = get_object_or_404(Country, pk=data["country_id"])
        if city.country_id != country.id:
            return Response({"detail": "Choose a city from the selected country."}, status=status.HTTP_400_BAD_REQUEST)

        duplicates = Business.objects.filter(name__iexact=str(data["name"]).strip(), city=city, country=country).select_related("city", "country")
        if duplicates.exists():
            return Response({"detail": "A likely matching business already exists.", "duplicates": [{"id": item.id, "name": item.name, "canonical_path": item.get_canonical_path("en")} for item in duplicates[:5]]}, status=status.HTTP_409_CONFLICT)

        business = Business.objects.create(
            name=str(data["name"]).strip(), category=category, city=city, country=country,
            tier="claimed", source="owner_created", is_micro=True,
            description=str(data["description"]).strip(),
            phone=str(data.get("phone", "")).strip(), website=str(data.get("website", "")).strip(),
            logo_url=str(data.get("logo_url", "")).strip(), address_line1=str(data.get("address", "")).strip(),
        )
        dashboard = {"region": str(data.get("region", "")).strip(), "business_type": str(data.get("business_type", "")).strip(), "owner_name": str(data.get("owner_name", "")).strip(), "email": request.user.email, "visibility": {"phone": True, "email": False, "website": True, "city": True, "region": True}}
        business.premium_sidebar = {"_dashboard": dashboard}
        business.save(update_fields=["premium_sidebar"])
        BusinessClaimRequest.objects.create(
            listing=business, name=str(data.get("owner_name") or request.user.username), email=request.user.email,
            business_name=business.name, business_address=business.address_line1, business_post_code=str(data.get("postal_code", "")).strip(),
            status="verified", verified_at=timezone.now(),
        )
        return Response({"id": business.id, "name": business.name, "slug": business.slug, "canonical_path": business.get_canonical_path("en"), "claim_status": "verified", "tier": business.tier}, status=status.HTTP_201_CREATED)


def owned_businesses(user):
    return Business.objects.filter(
        businessclaimrequest__email__iexact=user.email,
        businessclaimrequest__status__in=["pending", "verified"],
    ).select_related("country", "city", "town", "category").distinct()


def dashboard_payload(business, request):
    claims = BusinessClaimRequest.objects.filter(
        listing=business,
        email__iexact=request.user.email,
    )
    # A verified ownership claim is authoritative. A later duplicate/pending
    # request must not make an already verified owner look unverified.
    claim = claims.filter(status="verified").order_by("-created_at").first()
    if claim is None:
        claim = claims.order_by("-created_at").first()
    data = BusinessSerializer(business, context={"request": request}).data
    # Dashboard users must see stored values even when those values are hidden publicly.
    dashboard = (business.premium_sidebar or {}).get("_dashboard", {})
    data.update({
        "category_id": business.category_id,
        "city_id": business.city_id,
        "region": dashboard.get("region", ""),
        "business_type": dashboard.get("business_type", ""),
        "owner_name": dashboard.get("owner_name", ""),
        "email": dashboard.get("email", ""),
        "visibility": dashboard.get("visibility", {}),
        "claim_status": claim.status if claim else "pending",
    })
    visibility = dashboard.get("visibility", {})
    if visibility.get("phone", True) is False:
        data["phone"] = business.phone
    if visibility.get("website", True) is False:
        data["website"] = business.website
    if visibility.get("city", True) is False:
        data["city"] = CitySerializer(business.city).data if business.city else None
    return data


class DashboardBusinessesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        businesses = owned_businesses(request.user)
        return Response({"results": [dashboard_payload(item, request) for item in businesses]})


class DashboardBusinessDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_owned(self, request, business_id):
        return get_object_or_404(owned_businesses(request.user), pk=business_id)

    def get(self, request, business_id):
        return Response(dashboard_payload(self.get_owned(request, business_id), request))

    @transaction.atomic
    def patch(self, request, business_id):
        business = self.get_owned(request, business_id)
        # Only verified claims can persist changes; pending claims remain readable.
        if not BusinessClaimRequest.objects.filter(listing=business, email__iexact=request.user.email, status="verified").exists():
            return Response({"detail": "Ownership verification is required before saving changes."}, status=status.HTTP_403_FORBIDDEN)

        dashboard = dict((business.premium_sidebar or {}).get("_dashboard", {}))
        for field in EDITABLE_FIELDS:
            if field in request.data:
                if field in {"name", "phone", "description", "website", "logo_url", "image_url", "address", "address_line1", "postal_code"}:
                    setattr(business, field, request.data[field] or "")
                else:
                    dashboard[field] = request.data[field] or ""

        if "category_id" in request.data:
            business.category = Category.objects.filter(pk=request.data["category_id"]).first()
        if "city_id" in request.data:
            business.city = City.objects.filter(pk=request.data["city_id"]).first()
        if "country_id" in request.data:
            business.country = Country.objects.filter(pk=request.data["country_id"]).first()

        visibility = request.data.get("visibility")
        if visibility is not None:
            if not isinstance(visibility, dict) or not set(visibility).issubset(VISIBILITY_FIELDS):
                return Response({"detail": "Invalid visibility settings."}, status=status.HTTP_400_BAD_REQUEST)
            dashboard["visibility"] = {
                key: bool(value) for key, value in visibility.items()
            }
        business.premium_sidebar = {**(business.premium_sidebar or {}), "_dashboard": dashboard}
        business.save()
        return Response(dashboard_payload(business, request))


class DashboardPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")
        if not request.user.check_password(current):
            return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(new_password, request.user)
        except Exception as error:
            return Response({"detail": " ".join(error.messages)}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        return Response({"success": True})


class DashboardLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"success": True})


class DashboardTrialView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        return Response(_website_response(business, created=not bool((business.premium_sidebar or {}).get("_website"))), status=status.HTTP_200_OK)


class DashboardWebsiteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id):
        return Response(_website_response(_verified_business(request, business_id)))

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        exists = bool((business.premium_sidebar or {}).get("_website"))
        return Response(_website_response(business, created=not exists), status=status.HTTP_200_OK if exists else status.HTTP_201_CREATED)

    @transaction.atomic
    def patch(self, request, business_id):
        business = _verified_business(request, business_id)
        draft = _website_draft(business)
        if "layout_mode" in request.data and request.data["layout_mode"] in {"one_page", "multi_page"}:
            draft["layout_mode"] = request.data["layout_mode"]
        if isinstance(request.data.get("theme"), dict):
            theme = dict(draft.get("theme", {}))
            for key in ("primary", "dark"):
                value = request.data["theme"].get(key)
                if isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?", value):
                    theme[key] = value.lower()
            draft["theme"] = theme
        if isinstance(request.data.get("sections"), dict):
            sections = dict(draft.get("sections", {}))
            for key in ("hero", "services", "about", "gallery", "contact"):
                if isinstance(request.data["sections"].get(key), dict):
                    sections[key] = request.data["sections"][key]
            draft["sections"] = sections
        _save_website(business, draft)
        return Response(_website_response(business))


class DashboardWebsiteTrialView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        draft = _website_draft(business)
        trial = dict(draft.get("trial", {}))
        if trial.get("status") == "trial":
            return Response(_website_response(business))
        started = timezone.now()
        ends = started + timedelta(days=30)
        trial.update({"status": "trial", "started_at": started.isoformat(), "ends_at": ends.isoformat()})
        draft["trial"] = trial
        draft["status"] = "trial"
        _save_website(business, draft)
        return Response(_website_response(business))


class DashboardDescriptionAssistView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"detail": "AI description assistance is not configured yet."}, status=status.HTTP_501_NOT_IMPLEMENTED)
