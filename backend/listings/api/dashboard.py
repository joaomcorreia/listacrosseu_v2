from datetime import timedelta
from copy import deepcopy
import json
import re
import uuid
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.text import slugify
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from listings.models import AccountVerificationToken, Business, BusinessClaimRequest, Category, CategorySuggestion, City, Country
from listings.claim_flow import claimed_listing_container, normalize_claimed_draft, public_claimed_presentation, save_claimed_draft
from listings.category_suggestions import ensure_category_suggestion, resolve_pending_category_suggestions

from .serializers import BusinessSerializer, CitySerializer


EDITABLE_FIELDS = {
    "name", "business_type", "phone", "description", "owner_name", "email",
    "website", "logo_url", "image_url", "region", "address", "address_line1", "postal_code",
}
VISIBILITY_FIELDS = {"owner_name", "city", "region", "phone", "email", "website", "address", "whatsapp", "languages", "description", "business_type"}
ACCENT_COLORS = {"#2563EB", "#16A34A", "#0F766E", "#7C3AED", "#EA580C", "#DC2626", "#0F172A", "#64748B"}
WEBSITE_PALETTES = [
    ("#2563eb", "#0f172a"), ("#0f766e", "#102a2a"), ("#b45309", "#2a1a0f"),
    ("#be123c", "#2a1018"), ("#7c3aed", "#1e1633"), ("#15803d", "#102719"),
    ("#c2410c", "#29150d"), ("#334155", "#111827"),
]
DEFAULT_WEBSITE_TEMPLATE = "editorial-v1"
WEBSITE_CONTACT_FIELDS = ("phone", "whatsapp", "email", "website")
WEBSITE_CONTACT_VISIBILITY_FIELDS = (*WEBSITE_CONTACT_FIELDS, "address")


def _safe_accent(value):
    value = str(value or "").upper()
    return value if value in ACCENT_COLORS else None


def _verification_url(token):
    base = (settings.FRONTEND_SITE_URL or settings.PUBLIC_SITE_URL or "").rstrip("/")
    if not settings.DEBUG and urlparse(base).hostname in {"localhost", "127.0.0.1", "::1"}:
        production_host = next(
            (
                host.strip()
                for host in settings.ALLOWED_HOSTS
                if host.strip()
                and host.strip() != "*"
                and not host.strip().startswith(".")
                and host.strip() not in {"localhost", "127.0.0.1", "::1"}
            ),
            "",
        )
        base = f"https://{production_host}" if production_host else ""
    return f"{base}/en/verify-account?token={token}" if base else f"/en/verify-account?token={token}"


def _send_account_verification(user, claim=None):
    pending_tokens = AccountVerificationToken.objects.filter(user=user, used_at__isnull=True)
    if claim is not None:
        pending_tokens = pending_tokens.filter(claim=claim)
    pending_tokens.update(used_at=timezone.now())
    token = AccountVerificationToken.objects.create(user=user, claim=claim, expires_at=timezone.now() + timedelta(hours=24))
    send_mail(
        "Confirm your List Across EU account",
        f"Confirm your account by opening this link:\n\n{_verification_url(token.token)}\n\nThis link expires in 24 hours.",
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )
    return token


def _verify_claim_for_user(claim, user):
    if claim and claim.email.lower() == user.email.lower():
        claim.status = "verified"
        claim.verified_at = timezone.now()
        claim.save(update_fields=["status", "verified_at"])


def _verified_business(request, business_id):
    business = get_object_or_404(owned_businesses(request.user), pk=business_id)
    if not BusinessClaimRequest.objects.filter(
        listing=business, email__iexact=request.user.email, status="verified"
    ).exists():
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Ownership verification is required.")
    return business


def _website_slug_is_used(slug, exclude_business_id=None):
    businesses = Business.objects.exclude(pk=exclude_business_id) if exclude_business_id else Business.objects.all()
    for sidebar in businesses.values_list("premium_sidebar", flat=True).iterator():
        website = sidebar.get("_website") if isinstance(sidebar, dict) else None
        if isinstance(website, dict) and website.get("website_slug") == slug:
            return True
    return False


def _ensure_website_slug(business, draft):
    current = str(draft.get("website_slug") or "").strip()
    if current and not _website_slug_is_used(current, business.id):
        draft["website_slug"] = current
        return draft
    title_slug = slugify(str(draft.get("page_title") or business.name).strip())
    target_slug = slugify(str(draft.get("target_location") or draft.get("target_city") or "").strip())
    base = title_slug or target_slug or f"business-{business.id}-website"
    if target_slug and target_slug not in base.split("-"):
        base = f"{base}-{target_slug}"
    candidate = base
    suffix = 2
    while _website_slug_is_used(candidate, business.id):
        candidate = f"{base}-{suffix}"
        suffix += 1
    draft["website_slug"] = candidate
    return draft


def _website_content_from_draft(business, draft):
    sections = draft.get("sections", {}) if isinstance(draft.get("sections"), dict) else {}
    hero = sections.get("hero", {}) if isinstance(sections.get("hero"), dict) else {}
    about = sections.get("about", {}) if isinstance(sections.get("about"), dict) else {}
    services = sections.get("services", {}) if isinstance(sections.get("services"), dict) else {}
    gallery = sections.get("gallery", {}) if isinstance(sections.get("gallery"), dict) else {}
    location = sections.get("contact", {}) if isinstance(sections.get("contact"), dict) else {}
    contact = draft.get("contact", {}) if isinstance(draft.get("contact"), dict) else {}
    visibility = contact.get("visibility", {}) if isinstance(contact.get("visibility"), dict) else {}
    return {
        "tagline": str(hero.get("tagline") or ""),
        "description": str(about.get("text") or ""),
        "logo": _website_logo_from_business(business),
        "hero_image": str(hero.get("image") or ""),
        "category": business.category.name if business.category_id else "",
        "services": services.get("items") if isinstance(services.get("items"), list) else [],
        "contact": {
            key: str((contact.get(key) if visibility.get(key, True) else "") or (location.get(key) if visibility.get("address", True) else "") or "")
            for key in (*WEBSITE_CONTACT_FIELDS, "address", "city", "region", "country", "eyebrow", "title", "message", "location_label", "location_title", "location_intro")
        },
        "gallery": gallery.get("items") if isinstance(gallery.get("items"), list) else [],
    }


def _normalize_website_contact(draft):
    """Move legacy section contact values into one reusable website contact object."""
    sections = dict(draft.get("sections", {})) if isinstance(draft.get("sections"), dict) else {}
    legacy = sections.get("contact", {}) if isinstance(sections.get("contact"), dict) else {}
    contact = dict(draft.get("contact", {})) if isinstance(draft.get("contact"), dict) else {}
    for field in (*WEBSITE_CONTACT_FIELDS, "eyebrow", "title", "message"):
        if not str(contact.get(field) or "").strip() and legacy.get(field) is not None:
            contact[field] = legacy.get(field)
    visibility = dict(contact.get("visibility", {})) if isinstance(contact.get("visibility"), dict) else {}
    legacy_visibility = legacy.get("visibility", {}) if isinstance(legacy.get("visibility"), dict) else {}
    for field in WEBSITE_CONTACT_VISIBILITY_FIELDS:
        if field not in visibility:
            visibility[field] = bool(legacy_visibility.get(field, True))
    contact["visibility"] = visibility
    draft["contact"] = contact
    sections["contact"] = {
        key: value for key, value in legacy.items()
        if key not in (*WEBSITE_CONTACT_FIELDS, "eyebrow", "title", "message", "visibility")
    }
    draft["sections"] = sections
    return draft


def _normalize_website_trial(draft):
    trial = draft.get("trial") if isinstance(draft.get("trial"), dict) else {}
    started_at = parse_datetime(str(trial.get("started_at"))) if trial.get("started_at") else None
    ends_at = parse_datetime(str(trial.get("ends_at"))) if trial.get("ends_at") else None
    if started_at and timezone.is_naive(started_at):
        started_at = timezone.make_aware(started_at)
    if ends_at and timezone.is_naive(ends_at):
        ends_at = timezone.make_aware(ends_at)
    if started_at and ends_at and timezone.now() >= ends_at and trial.get("status") in {"trial", "active"}:
        draft["trial"] = {**trial, "status": "expired"}
    return draft


def _website_attribution_eligible(_business):
    """Return the server-controlled entitlement for hiding site attribution.

    The billing model does not yet expose a first successful paid-month signal.
    Keep the test hook explicit and backend-only until that signal exists.
    """
    return bool(getattr(settings, "GENERATED_WEBSITE_ATTRIBUTION_TEST_ELIGIBLE", False))


def _website_logo_from_business(business):
    """Resolve the inherited identity logo without overwriting website edits."""
    claimed = claimed_listing_container(business)
    for presentation_key in ("draft", "published"):
        presentation = claimed.get(presentation_key)
        if isinstance(presentation, dict) and str(presentation.get("logo_url") or "").strip():
            return _browser_asset_url(presentation["logo_url"])
    if business.logo_file:
        return _browser_asset_url(business.logo_file.url)
    return _browser_asset_url(business.logo_url)


def _postcard_identity(business):
    claimed = claimed_listing_container(business)
    presentations = [item for item in (claimed.get("draft"), claimed.get("published")) if isinstance(item, dict)]
    accent = next((str(item.get("accent_color") or "").strip().lower() for item in presentations if item.get("accent_color")), str(business.accent_color or "").strip().lower())
    overlay = next((str(item.get("overlay_color") or "").strip().lower() for item in presentations if item.get("overlay_color")), "")
    background = next((_browser_asset_url(item.get("background_image")) for item in presentations if item.get("background_image")), "")
    image = next((_browser_asset_url(item.get("image_url")) for item in presentations if item.get("image_url")), "")
    return {
        "logo": _website_logo_from_business(business),
        "accent": accent if re.fullmatch(r"#[0-9a-f]{6}", accent) else "",
        "overlay": overlay if re.fullmatch(r"#[0-9a-f]{6}", overlay) else "",
        "background": background or image or _browser_asset_url(business.image_url),
    }


def _browser_asset_url(value):
    value = str(value or "").strip()
    if not value:
        return ""
    parsed = urlparse(value)
    if parsed.scheme and parsed.path.startswith("/media/"):
        return f"{parsed.path}{('?'+parsed.query) if parsed.query else ''}"
    return value


def _website_draft(business):
    stored = (business.premium_sidebar or {}).get("_website")
    if stored:
        original = dict(stored)
        draft = dict(stored)
        # Migrate the earlier local implementation, which used the editable
        # draft itself as the published record, into the snapshot shape.
        if draft.get("status") == "published" and not isinstance(draft.get("published_snapshot"), dict):
            legacy_snapshot = deepcopy(draft)
            draft["published_snapshot"] = legacy_snapshot
            draft["status"] = "trial"
            draft["published_at"] = legacy_snapshot.get("published_at")
        draft = _normalize_website_trial(draft)
        draft = _normalize_website_contact(draft)
        sections = dict(draft.get("sections", {}))
        services_section = dict(sections.get("services", {}))
        service_items = services_section.get("items", [])
        if not isinstance(service_items, list):
            service_items = []
        private_slots = [item for item in service_items if isinstance(item, dict) and item.get("private_placeholder")]
        if len(private_slots) < 3:
            services_section["enabled"] = True
            services_section["items"] = service_items + [{"private_placeholder": True} for _ in range(3 - len(private_slots))]
            sections["services"] = services_section
            draft["sections"] = sections
        hero = dict(sections.get("hero", {}))
        identity = _postcard_identity(business)
        theme = dict(draft.get("theme", {})) if isinstance(draft.get("theme"), dict) else {}
        default_primary, default_dark = WEBSITE_PALETTES[business.id % len(WEBSITE_PALETTES)]
        if (not str(theme.get("primary") or "").strip() or str(theme.get("primary")).lower() == default_primary) and identity["accent"]:
            theme["primary"] = identity["accent"]
        if (not str(theme.get("dark") or "").strip() or str(theme.get("dark")).lower() == default_dark) and identity["overlay"]:
            theme["dark"] = identity["overlay"]
        if theme != draft.get("theme"):
            draft["theme"] = theme
        if (not str(hero.get("image") or "").strip() or str(hero.get("image")) == business.image_url) and identity["background"]:
            hero["image"] = identity["background"]
            sections["hero"] = hero
            draft["sections"] = sections
        draft.setdefault("page_title", hero.get("title") or business.name)
        draft.setdefault("template_id", DEFAULT_WEBSITE_TEMPLATE)
        draft.setdefault("effects", {"reveal": False, "background_parallax": False})
        content = draft.get("content") if isinstance(draft.get("content"), dict) else _website_content_from_draft(business, draft)
        if not str(content.get("logo") or "").strip():
            content["logo"] = _website_logo_from_business(business)
        draft["content"] = content
        draft = _ensure_website_slug(business, draft)
        draft.setdefault("target_location", "")
        draft.setdefault("target_city", "")
        draft.setdefault("target_region", "")
        draft.setdefault("target_country", "")
        draft.setdefault("service_area", "")
        settings_section = draft.get("settings") if isinstance(draft.get("settings"), dict) else {}
        settings_section.setdefault("attribution_visible", True)
        draft["settings"] = settings_section
        if draft != original:
            _save_website(business, draft)
        return draft
    identity = _postcard_identity(business)
    default_primary, default_dark = WEBSITE_PALETTES[business.id % len(WEBSITE_PALETTES)]
    primary = identity["accent"] or default_primary
    dark = identity["overlay"] or default_dark
    dashboard = (business.premium_sidebar or {}).get("_dashboard", {})
    services = dashboard.get("services", [])
    if not isinstance(services, list):
        services = []
    gallery = business.premium_images if isinstance(business.premium_images, list) else []
    draft = {
        "version": 1,
        "template_id": DEFAULT_WEBSITE_TEMPLATE,
        "status": "draft",
        "layout_mode": "one_page",
        "page_title": business.name,
        "website_slug": "",
        "target_location": "",
        "target_city": "",
        "target_region": "",
        "target_country": "",
        "service_area": "",
        "theme": {"primary": primary, "dark": dark},
        "effects": {"reveal": False, "background_parallax": False},
        "trial": {"status": "not_started", "started_at": None, "ends_at": None},
        "settings": {"attribution_visible": True},
        "contact": {
            "eyebrow": "Contact",
            "title": "Get in touch",
            "message": "Use the published contact details to reach the business directly.",
            "phone": business.phone,
            "whatsapp": business.whatsapp_number,
            "email": business.business_contact_email or "",
            "website": business.website,
            "visibility": {field: True for field in WEBSITE_CONTACT_VISIBILITY_FIELDS},
        },
        "sections": {
            "hero": {"enabled": True, "title": business.name, "tagline": business.description, "cta_label": "Get in touch", "image": identity["background"] or business.image_url or ""},
            # Keep empty service slots private to the dashboard preview until the
            # owner supplies real service content.
            "services": {"enabled": True, "eyebrow": "What we offer", "title": "Services / Products", "items": services + [{"private_placeholder": True} for _ in range(3)]},
            "about": {"enabled": bool(business.description), "eyebrow": "Why choose us", "title": "Why choose us", "text": business.description},
            "gallery": {"enabled": bool(gallery), "items": gallery},
            "contact": {
                "enabled": True,
                "location_label": "Location",
                "location_title": "Find the business",
                "location_intro": "",
                "address": business.address_line1 or business.address,
                "city": business.city.name if business.city else "",
                "region": dashboard.get("region", ""),
                "country": business.country.name if business.country else "",
            },
        },
    }
    draft = _normalize_website_contact(draft)
    draft["content"] = _website_content_from_draft(business, draft)
    return draft


def _save_website(business, draft):
    business.premium_sidebar = {**(business.premium_sidebar or {}), "_website": draft}
    business.save(update_fields=["premium_sidebar"])


def _website_response(business, created=False):
    draft = _website_draft(business)
    if created:
        _save_website(business, draft)
    published_snapshot = draft.get("published_snapshot") if isinstance(draft.get("published_snapshot"), dict) else None
    response_draft = {
        **draft,
        "published_snapshot": None,
        "published": bool(published_snapshot and draft.get("published", True)),
        "published_at": draft.get("published_at"),
        "entitlement": {"attribution_visibility_unlocked": _website_attribution_eligible(business)},
    }
    public_url = f"/en/generated/{draft['website_slug']}" if published_snapshot and draft.get("published", True) else ""
    return {"business_id": business.id, "business_slug": business.slug, "business_name": business.name, "public_url": public_url, "website": response_draft}


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
        identifier = str(request.data.get("email") or request.data.get("username") or "").strip()
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
        if not user.is_active:
            return Response({"detail": "Please verify your email before signing in.", "email_verification_required": True}, status=status.HTTP_403_FORBIDDEN)
        claim = None
        pending_token = request.data.get("pending_token")
        if pending_token:
            claim = BusinessClaimRequest.objects.filter(
                verification_token=pending_token, email__iexact=user.email,
                status__in=["pending", "verified"],
            ).select_related("listing").first()
            if claim is None:
                return Response({"detail": "The listing continuation is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
            if BusinessClaimRequest.objects.filter(listing=claim.listing, status="verified").exclude(email__iexact=user.email).exists():
                return Response({"detail": "This business has already been claimed by another verified owner."}, status=status.HTTP_409_CONFLICT)
            if claim.status == "pending":
                _verify_claim_for_user(claim, user)
        login(request, user)
        return Response({"authenticated": True, "csrfToken": get_token(request), "business_id": claim.listing_id if claim else None, "user": {"username": user.username, "email": user.email}})

    def put(self, request):
        from django.contrib.auth import get_user_model
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if get_user_model().objects.filter(email__iexact=email).exists():
            return Response({"detail": "An account with this email already exists."}, status=status.HTTP_409_CONFLICT)
        pending_token = request.data.get("pending_token")
        claim = None
        if pending_token:
            claim = BusinessClaimRequest.objects.filter(verification_token=pending_token, status="pending", email__iexact=email).select_related("listing").first()
            if claim is None:
                return Response({"detail": "The listing continuation is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
        user = get_user_model().objects.create_user(username=email, email=email, password=password, is_active=False)
        try:
            token = _send_account_verification(user, claim)
        except Exception:
            user.delete()
            return Response({"detail": "We could not send the verification email. Please try again."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"authenticated": False, "email": email, "verification_token": str(token.token), "business_id": claim.listing_id if claim else None}, status=status.HTTP_201_CREATED)


class AccountVerificationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.GET.get("token")
        try:
            token_uuid = uuid.UUID(str(token))
        except (TypeError, ValueError, AttributeError):
            return Response({"detail": "This verification link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
        record = AccountVerificationToken.objects.select_related("user", "claim", "claim__listing").filter(token=token_uuid).first()
        if not record or record.used_at or record.expires_at <= timezone.now():
            return Response({"detail": "This verification link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)
        if record.claim and BusinessClaimRequest.objects.filter(listing=record.claim.listing, status="verified").exclude(pk=record.claim.pk).exists():
            return Response({"detail": "This business has already been claimed by another verified owner."}, status=status.HTTP_409_CONFLICT)
        user = record.user
        user.is_active = True
        user.save(update_fields=["is_active"])
        _verify_claim_for_user(record.claim, user)
        record.used_at = timezone.now()
        record.save(update_fields=["used_at"])
        authenticated = not user.has_usable_password()
        if authenticated:
            login(request, user)
        return Response({"verified": True, "authenticated": authenticated, "email": user.email, "business_id": record.claim.listing_id if record.claim and record.claim.listing_id else None})


class AccountVerificationResendView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        user = get_user_model().objects.filter(email__iexact=email, is_active=False).first()
        if user:
            claim = BusinessClaimRequest.objects.filter(email__iexact=email, status="pending").order_by("-created_at").first()
            try:
                _send_account_verification(user, claim)
            except Exception:
                pass
        return Response({"detail": "If an unverified account exists, a new verification email has been sent."})


class CreateBusinessView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @staticmethod
    def _decode_json_field(data, field, default):
        value = data.get(field)
        if isinstance(value, str):
            try:
                decoded = json.loads(value)
                return decoded
            except (TypeError, ValueError):
                return default
        return value if value is not None else default

    @transaction.atomic
    def post(self, request):
        data = {key: request.data.get(key) for key in request.data.keys()}
        data["languages"] = self._decode_json_field(data, "languages", [])
        data["visibility"] = self._decode_json_field(data, "visibility", {})
        required = ("name", "city_id", "country_id", "description")
        if any(not str(data.get(field, "")).strip() for field in required):
            return Response({"detail": "Business name, city, country and description are required."}, status=status.HTTP_400_BAD_REQUEST)
        category_suggestion = str(data.get("category_suggestion") or "").strip()
        if not data.get("category_id") and not category_suggestion:
            return Response({"detail": "Choose a category or suggest a missing category."}, status=status.HTTP_400_BAD_REQUEST)
        category = get_object_or_404(Category, pk=data["category_id"]) if data.get("category_id") else None
        city = get_object_or_404(City, pk=data["city_id"])
        country = get_object_or_404(Country, pk=data["country_id"])
        if city.country_id != country.id:
            return Response({"detail": "Choose a city from the selected country."}, status=status.HTTP_400_BAD_REQUEST)

        duplicates = Business.objects.filter(name__iexact=str(data["name"]).strip(), city=city, country=country).select_related("city", "country")
        if duplicates.exists():
            return Response({"detail": "A likely matching business already exists.", "duplicates": [{"id": item.id, "name": item.name, "canonical_path": item.get_canonical_path("en")} for item in duplicates[:5]]}, status=status.HTTP_409_CONFLICT)

        owner_email = (request.user.email if request.user.is_authenticated else str(data.get("email") or data.get("contact_email") or "").strip().lower())
        if not owner_email:
            return Response({"detail": "An email address is required so you can manage the listing."}, status=status.HTTP_400_BAD_REQUEST)
        website = str(data.get("website", "")).strip()
        if len(website) > Business.WEBSITE_MAX_LENGTH:
            return Response({"detail": f"Website URLs must be {Business.WEBSITE_MAX_LENGTH} characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
        logo_upload = request.FILES.get("logo")
        background_upload = request.FILES.get("background")
        for upload, label, max_bytes in ((logo_upload, "Logo", 5 * 1024 * 1024), (background_upload, "Background", 10 * 1024 * 1024)):
            if upload and upload.size > max_bytes:
                return Response({"detail": f"{label} files must be {max_bytes // (1024 * 1024)} MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
            if upload and upload.content_type not in {"image/png", "image/jpeg", "image/webp"}:
                return Response({"detail": f"Upload a PNG, JPEG, or WebP image for the {label.lower()}."}, status=status.HTTP_400_BAD_REQUEST)
        business = Business.objects.create(
            name=str(data["name"]).strip(), category=category, city=city, country=country,
            tier="claimed" if request.user.is_authenticated else "free", source="owner_created", is_micro=True,
            is_published=False,
            description=str(data["description"]).strip(),
            phone=str(data.get("phone", "")).strip(), business_contact_email=str(data.get("contact_email") or data.get("email") or "").strip().lower(), website=website,
            logo_url="" if logo_upload else str(data.get("logo_url", "")).strip(), address_line1=str(data.get("address", "")).strip(),
        )
        if logo_upload:
            business.logo_file = logo_upload
        if background_upload:
            business.claimed_background_file = background_upload
        if logo_upload or background_upload:
            business.save(update_fields=[field for field, present in (("logo_file", bool(logo_upload)), ("claimed_background_file", bool(background_upload))) if present])
        draft_data = data.copy()
        if business.logo_file:
            draft_data["logo_url"] = request.build_absolute_uri(business.logo_file.url)
        if business.claimed_background_file:
            draft_data["background_image"] = request.build_absolute_uri(business.claimed_background_file.url)
        dashboard = {"region": str(data.get("region", "")).strip(), "business_type": str(data.get("business_type", "")).strip(), "owner_name": str(data.get("owner_name", "")).strip(), "email": owner_email, "visibility": {"phone": True, "email": False, "website": True, "city": True, "region": True}}
        business.premium_sidebar = {"_dashboard": dashboard}
        business.save(update_fields=["premium_sidebar"])
        save_claimed_draft(business, normalize_claimed_draft(business, draft_data))
        if category_suggestion:
            ensure_category_suggestion(proposed_name=category_suggestion, listing=business, user=request.user, email=owner_email)
        claim = BusinessClaimRequest.objects.create(
            listing=business, name=str(data.get("owner_name") or (request.user.username if request.user.is_authenticated else owner_email)), email=owner_email,
            business_name=business.name, business_address=business.address_line1, business_post_code=str(data.get("postal_code", "")).strip(),
            status="verified" if request.user.is_authenticated else "pending", verified_at=timezone.now() if request.user.is_authenticated else None,
        )
        account_created = False
        verification_token = None
        if request.user.is_authenticated:
            user = request.user
        else:
            user = get_user_model().objects.filter(email__iexact=owner_email).first()
            if user is None:
                user = get_user_model().objects.create_user(username=owner_email, email=owner_email, password=None, is_active=False)
                account_created = True
            verification_token = _send_account_verification(user, claim)
        return Response({"id": business.id, "name": business.name, "slug": business.slug, "canonical_path": business.get_canonical_path("en"), "claim_status": claim.status, "pending_token": str(claim.verification_token), "verification_token": str(verification_token.token) if verification_token else "", "account_created": account_created, "email": owner_email, "tier": business.tier}, status=status.HTTP_201_CREATED)


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
    claimed = claimed_listing_container(business)
    draft = claimed.get("draft") if isinstance(claimed.get("draft"), dict) else None
    if draft:
        for field in ("name", "description", "address", "address_line1", "postal_code", "phone", "contact_email", "whatsapp_number", "website", "logo_url", "image_url", "background_image", "overlay_color", "overlay_opacity", "accent_color", "languages", "visibility"):
            if field in draft:
                data[field] = draft[field]
        data["region"] = draft.get("region", "")
        data["business_type"] = draft.get("business_type", "")
        data["owner_name"] = draft.get("owner_name", "")
        data["email"] = draft.get("email", "")
    data["claimed_listing_status"] = claimed.get("status", "draft") if claimed else "draft"
    data["claimed_listing_draft"] = draft or {}
    pending_suggestion = CategorySuggestion.objects.filter(listing=business, status="pending").order_by("-created_at").first()
    data["pending_category_suggestion"] = pending_suggestion.proposed_name if pending_suggestion else ""
    data["category_is_public"] = bool(business.category_id and business.category and business.category.is_public)
    # Dashboard users must see stored values even when those values are hidden publicly.
    dashboard = (business.premium_sidebar or {}).get("_dashboard", {})
    data.update({
        "category_id": business.category_id,
        "city_id": business.city_id,
        "region": data.get("region", dashboard.get("region", "")),
        "business_type": data.get("business_type", dashboard.get("business_type", "")),
        "owner_name": dashboard.get("owner_name", ""),
        "email": dashboard.get("email", ""),
        "visibility": data.get("visibility", dashboard.get("visibility", {})),
        "claim_status": claim.status if claim else "pending",
        "accent_color": business.accent_color or "#2563EB",
        "contact_email": data.get("contact_email", business.business_contact_email),
        "whatsapp_number": data.get("whatsapp_number", business.whatsapp_number),
        "languages": data.get("languages", business.spoken_languages or []),
        "background_image": data.get("background_image", ""),
        "overlay_color": data.get("overlay_color", "#0F172A"),
        "overlay_opacity": data.get("overlay_opacity", 0.72),
    })
    website = (business.premium_sidebar or {}).get("_website")
    if isinstance(website, dict):
        # Hydrate older drafts so the private preview receives the current
        # structure without resetting any owner-authored website content.
        website = _website_draft(business)
    if isinstance(website, dict):
        website = {
            **website,
            "entitlement": {
                "attribution_visibility_unlocked": _website_attribution_eligible(business),
            },
        }
        trial = website.get("trial") if isinstance(website.get("trial"), dict) else {}
        data["generated_website"] = {
            "status": website.get("status", "draft"),
            "page_title": website.get("page_title") or business.name,
            "target_location": website.get("target_location", ""),
            "trial": trial,
            "website": website,
            "public_url": f"/en/generated/{website.get('website_slug')}" if website.get("status") == "published" and website.get("website_slug") else "",
        }
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
                    value = request.data[field] or ""
                    if field == "website" and len(str(value)) > Business.WEBSITE_MAX_LENGTH:
                        return Response({"detail": f"Website URLs must be {Business.WEBSITE_MAX_LENGTH} characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
                    setattr(business, field, value)
                else:
                    dashboard[field] = request.data[field] or ""

        if "accent_color" in request.data:
            accent = _safe_accent(request.data.get("accent_color"))
            if accent is None:
                return Response({"detail": "Choose a supported listing color."}, status=status.HTTP_400_BAD_REQUEST)
            business.accent_color = accent

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


class DashboardClaimedListingDraftView(APIView):
    permission_classes = [IsAuthenticated]

    def get_business(self, request, business_id):
        return get_object_or_404(owned_businesses(request.user), pk=business_id)

    def get(self, request, business_id):
        business = self.get_business(request, business_id)
        _verified_business(request, business.id)
        return Response(dashboard_payload(business, request))

    @transaction.atomic
    def put(self, request, business_id):
        business = self.get_business(request, business_id)
        _verified_business(request, business.id)
        draft = normalize_claimed_draft(business, request.data)
        if len(draft["website"]) > Business.WEBSITE_MAX_LENGTH:
            return Response({"detail": f"Website URLs must be {Business.WEBSITE_MAX_LENGTH} characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
        selected_category = Category.objects.filter(
            pk=draft.get("category_id"), is_public=True,
        ).exclude(slug="uncategorized").first() if draft.get("category_id") else None
        if selected_category and not draft.get("category_suggestion"):
            business.category = selected_category
            resolve_pending_category_suggestions(listing=business, category=selected_category)
            business.save(update_fields=["category"])
        claimed = save_claimed_draft(business, draft)
        return Response({"business_id": business.id, "claimed_listing_status": claimed.get("status", "draft"), "claimed_listing_draft": draft, **dashboard_payload(business, request)})


class DashboardClaimedListingPublishView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        claimed = claimed_listing_container(business)
        draft = claimed.get("draft") if isinstance(claimed.get("draft"), dict) else None
        if not draft:
            return Response({"detail": "Prepare your Claimed Listing before publishing."}, status=status.HTTP_400_BAD_REQUEST)
        if CategorySuggestion.objects.filter(listing=business, status="pending").exists():
            return Response({"detail": "Your suggested category is awaiting review."}, status=status.HTTP_400_BAD_REQUEST)
        category = Category.objects.filter(pk=draft.get("category_id"), is_public=True).exclude(slug="uncategorized").first()
        if not category:
            return Response({"detail": "Choose a published canonical category before publishing."}, status=status.HTTP_400_BAD_REQUEST)
        if not draft.get("name") or not draft.get("description"):
            return Response({"detail": "Add a business name and description before publishing."}, status=status.HTTP_400_BAD_REQUEST)
        published = dict(draft)
        if not str(published.get("logo_url") or "").strip():
            published["logo_url"] = _website_logo_from_business(business)
        claimed["published"] = published
        claimed["status"] = "published"
        sidebar = dict(business.premium_sidebar or {})
        sidebar["_claimed_listing"] = claimed
        business.premium_sidebar = sidebar
        business.tier = "claimed"
        business.is_published = True
        business.category = category
        business.save(update_fields=["premium_sidebar", "tier", "is_published", "category"])
        return Response(dashboard_payload(business, request))


class DashboardClaimedListingUnpublishView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        claimed = claimed_listing_container(business)
        if not claimed.get("published"):
            return Response({"detail": "This Claimed Listing is already unpublished."}, status=status.HTTP_400_BAD_REQUEST)
        # Keep the draft for the owner, but remove the public snapshot. The
        # tier remains claimed so the owner can republish without reclaiming.
        claimed["published"] = None
        claimed["status"] = "draft"
        sidebar = dict(business.premium_sidebar or {})
        sidebar["_claimed_listing"] = claimed
        business.premium_sidebar = sidebar
        # Unpublishing the postcard returns the listing to its normal public
        # directory presentation; it does not remove the directory listing.
        business.is_published = True
        business.save(update_fields=["premium_sidebar", "is_published"])
        return Response(dashboard_payload(business, request))


class DashboardBusinessLogoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    max_logo_bytes = 5 * 1024 * 1024

    def get_owned(self, request, business_id):
        return _verified_business(request, business_id)

    def post(self, request, business_id):
        business = self.get_owned(request, business_id)
        upload = request.FILES.get("logo")
        if not upload:
            return Response({"detail": "Choose a logo image to upload."}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > self.max_logo_bytes:
            return Response({"detail": "Logo files must be 5 MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
        if upload.content_type not in {"image/png", "image/jpeg", "image/webp"}:
            return Response({"detail": "Upload a PNG, JPEG, or WebP image."}, status=status.HTTP_400_BAD_REQUEST)
        business.logo_file = upload
        business.save(update_fields=["logo_file"])
        logo_url = request.build_absolute_uri(business.logo_file.url)
        draft = normalize_claimed_draft(business, claimed_listing_container(business).get("draft", {}))
        draft["logo_url"] = logo_url
        save_claimed_draft(business, draft)
        payload = dashboard_payload(business, request)
        payload["logo_url"] = logo_url
        return Response(payload)

    def delete(self, request, business_id):
        business = self.get_owned(request, business_id)
        if business.logo_file:
            business.logo_file.delete(save=False)
        business.logo_file = None
        business.save(update_fields=["logo_file"])
        draft = normalize_claimed_draft(business, claimed_listing_container(business).get("draft", {}))
        draft["logo_url"] = ""
        save_claimed_draft(business, draft)
        return Response(dashboard_payload(business, request))


class DashboardClaimedListingBackgroundView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    max_background_bytes = 10 * 1024 * 1024

    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        upload = request.FILES.get("background")
        if not upload:
            return Response({"detail": "Choose a background image."}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > self.max_background_bytes:
            return Response({"detail": "Background images must be 10 MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
        if upload.content_type not in {"image/png", "image/jpeg", "image/webp"}:
            return Response({"detail": "Upload a PNG, JPEG, or WebP image."}, status=status.HTTP_400_BAD_REQUEST)
        business.claimed_background_file = upload
        business.save(update_fields=["claimed_background_file"])
        background_url = request.build_absolute_uri(business.claimed_background_file.url)
        draft = normalize_claimed_draft(business, claimed_listing_container(business).get("draft", {}))
        draft["background_image"] = background_url
        save_claimed_draft(business, draft)
        payload = dashboard_payload(business, request)
        payload["background_image"] = background_url
        payload["claimed_listing_draft"] = {**payload.get("claimed_listing_draft", {}), "background_image": background_url}
        return Response(payload)

    def delete(self, request, business_id):
        business = _verified_business(request, business_id)
        if business.claimed_background_file:
            business.claimed_background_file.delete(save=False)
        business.claimed_background_file = None
        business.save(update_fields=["claimed_background_file"])
        draft = normalize_claimed_draft(business, claimed_listing_container(business).get("draft", {}))
        draft["background_image"] = business.image_url or ""
        save_claimed_draft(business, draft)
        return Response(dashboard_payload(business, request))


class DashboardPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")
        if request.user.has_usable_password() and not request.user.check_password(current):
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
        business = _verified_business(request, business_id)
        response = _website_response(business)
        from .website_editor import make_preview_token
        response["preview_url"] = f"/en/generated/{response['website']['website_slug']}?preview_token={make_preview_token(business)}"
        return Response(response)

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        exists = bool((business.premium_sidebar or {}).get("_website"))
        draft = _website_draft(business)
        for key in ("page_title", "target_location", "target_city", "target_region", "target_country", "service_area"):
            if key in request.data:
                value = str(request.data.get(key) or "").strip()
                if key == "page_title" and not value:
                    return Response({"detail": "A page title is required."}, status=status.HTTP_400_BAD_REQUEST)
                draft[key] = value
        if not exists:
            draft["website_slug"] = ""
        draft = _ensure_website_slug(business, draft)
        hero = dict(draft.get("sections", {}).get("hero", {}))
        if draft.get("page_title"):
            hero["title"] = draft["page_title"]
            draft["sections"] = {**draft.get("sections", {}), "hero": hero}
        draft["content"] = _website_content_from_draft(business, draft)
        _save_website(business, draft)
        response = _website_response(business, created=not exists)
        from .website_editor import make_preview_token
        response["preview_url"] = f"/en/generated/{response['website']['website_slug']}?preview_token={make_preview_token(business)}"
        return Response(response, status=status.HTTP_200_OK if exists else status.HTTP_201_CREATED)

    @transaction.atomic
    def patch(self, request, business_id):
        business = _verified_business(request, business_id)
        draft = _website_draft(business)
        for key in ("page_title", "target_location", "target_city", "target_region", "target_country", "service_area"):
            if key in request.data:
                value = str(request.data.get(key) or "").strip()
                if key == "page_title" and not value:
                    return Response({"detail": "A page title is required."}, status=status.HTTP_400_BAD_REQUEST)
                draft[key] = value
        if "layout_mode" in request.data and request.data["layout_mode"] in {"one_page", "multi_page"}:
            draft["layout_mode"] = request.data["layout_mode"]
        if isinstance(request.data.get("effects"), dict):
            effects = dict(draft.get("effects", {})) if isinstance(draft.get("effects"), dict) else {}
            for key in ("reveal", "background_parallax"):
                if key in request.data["effects"]:
                    effects[key] = bool(request.data["effects"][key])
            draft["effects"] = effects
        if isinstance(request.data.get("theme"), dict):
            theme = dict(draft.get("theme", {}))
            for key in ("primary", "dark"):
                value = request.data["theme"].get(key)
                if isinstance(value, str) and re.fullmatch(r"#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?", value):
                    theme[key] = value.lower()
            draft["theme"] = theme
        if isinstance(request.data.get("settings"), dict):
            website_settings = dict(draft.get("settings", {})) if isinstance(draft.get("settings"), dict) else {}
            if _website_attribution_eligible(business):
                if "attribution_visible" in request.data["settings"]:
                    website_settings["attribution_visible"] = bool(request.data["settings"]["attribution_visible"])
            else:
                # Never allow a client-provided value to hide attribution
                # before the server confirms the entitlement.
                website_settings["attribution_visible"] = True
            draft["settings"] = website_settings
        if isinstance(request.data.get("sections"), dict):
            sections = dict(draft.get("sections", {}))
            for key in ("hero", "services", "about", "gallery", "contact"):
                if isinstance(request.data["sections"].get(key), dict):
                    sections[key] = request.data["sections"][key]
            draft["sections"] = sections
        if isinstance(request.data.get("contact"), dict):
            contact = dict(draft.get("contact", {})) if isinstance(draft.get("contact"), dict) else {}
            incoming_contact = request.data["contact"]
            for key in (*WEBSITE_CONTACT_FIELDS, "eyebrow", "title", "message"):
                if key in incoming_contact:
                    contact[key] = str(incoming_contact.get(key) or "")
            if isinstance(incoming_contact.get("visibility"), dict):
                visibility = dict(contact.get("visibility", {})) if isinstance(contact.get("visibility"), dict) else {}
                for key in WEBSITE_CONTACT_VISIBILITY_FIELDS:
                    if key in incoming_contact["visibility"]:
                        visibility[key] = bool(incoming_contact["visibility"][key])
                contact["visibility"] = visibility
            draft["contact"] = contact
        draft = _normalize_website_contact(draft)
        draft["content"] = _website_content_from_draft(business, draft)
        _save_website(business, draft)
        return Response(_website_response(business))


class DashboardWebsiteTrialView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        if not isinstance((business.premium_sidebar or {}).get("_website"), dict):
            return Response({"detail": "Create the private website preview before starting its trial."}, status=status.HTTP_400_BAD_REQUEST)
        draft = _website_draft(business)
        trial = dict(draft.get("trial", {}))
        if trial.get("started_at"):
            # A start timestamp is the idempotency key. Expired trials remain
            # expired and cannot be restarted through this endpoint.
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
