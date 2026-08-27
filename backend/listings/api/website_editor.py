from django.db import transaction
from copy import deepcopy
from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.core import signing
from django.utils import timezone
from datetime import timedelta
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .dashboard import _ensure_website_slug, _save_website, _verified_business, _website_attribution_eligible, _website_draft, _website_response
from listings.models import Business


def make_preview_token(business):
    return signing.dumps({"business_id": business.id, "expires": int((timezone.now() + timedelta(minutes=10)).timestamp())})


def preview_business_from_token(token, slug):
    try:
        payload = signing.loads(token, max_age=600)
        if int(payload.get("expires", 0)) < int(timezone.now().timestamp()):
            return None
        business = Business.objects.filter(pk=payload.get("business_id"), tier="claimed").first()
        if not business:
            return None
        draft = (business.premium_sidebar or {}).get("_website")
        return business if isinstance(draft, dict) and draft.get("website_slug") == slug else None
    except (signing.BadSignature, TypeError, ValueError):
        return None


class DashboardWebsitePublishView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        draft = _website_draft(business)
        trial = draft.get("trial", {}) if isinstance(draft.get("trial"), dict) else {}
        if trial.get("status") not in {"trial", "active"}:
            return Response({"detail": "An active Generated Website trial is required before publishing."}, status=400)
        ends_at = trial.get("ends_at")
        if ends_at:
            parsed_ends = timezone.datetime.fromisoformat(str(ends_at).replace("Z", "+00:00"))
            if timezone.is_naive(parsed_ends):
                parsed_ends = timezone.make_aware(parsed_ends)
            if timezone.now() >= parsed_ends:
                return Response({"detail": "The Generated Website trial has expired."}, status=400)
        draft = _ensure_website_slug(business, draft)
        published_at = timezone.now().isoformat()
        snapshot = deepcopy(draft)
        snapshot.pop("published_snapshot", None)
        snapshot["status"] = "published"
        snapshot["published_at"] = published_at
        draft["published_snapshot"] = snapshot
        draft["published_at"] = published_at
        draft["published"] = True
        draft["status"] = "trial"
        _save_website(business, draft)
        return Response(_website_response(business))


class DashboardWebsiteUnpublishView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, business_id):
        business = _verified_business(request, business_id)
        draft = _website_draft(business)
        if not isinstance(draft.get("published_snapshot"), dict):
            return Response({"detail": "This Generated Website is not published."}, status=400)
        draft["published"] = False
        _save_website(business, draft)
        return Response(_website_response(business))


class PublicGeneratedWebsiteView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        token = request.query_params.get("preview_token", "")
        business = preview_business_from_token(token, slug) if token else None
        if not token and business is None:
            for candidate in Business.objects.filter(tier="claimed").iterator():
                website = (candidate.premium_sidebar or {}).get("_website")
                snapshot = website.get("published_snapshot") if isinstance(website, dict) else None
                if isinstance(snapshot, dict) and website.get("published", True) and snapshot.get("website_slug") == slug:
                    business = candidate
                    break
        if business is None:
            return Response({"detail": "This Generated Website is not available."}, status=404)
        is_preview = bool(token)
        draft = _website_draft(business)
        snapshot = draft.get("published_snapshot") if isinstance(draft.get("published_snapshot"), dict) else None
        if not is_preview and (snapshot is None or not draft.get("published", True)):
            return Response({"detail": "This Generated Website is not published."}, status=404)
        if not is_preview:
            trial = draft.get("trial", {}) if isinstance(draft.get("trial"), dict) else {}
            if trial.get("status") not in {"trial", "active"}:
                return Response({"detail": "This Generated Website is not currently available."}, status=404)
            ends_at = trial.get("ends_at")
            if ends_at:
                parsed_ends = timezone.datetime.fromisoformat(str(ends_at).replace("Z", "+00:00"))
                if timezone.is_naive(parsed_ends):
                    parsed_ends = timezone.make_aware(parsed_ends)
                if timezone.now() >= parsed_ends:
                    return Response({"detail": "This Generated Website trial has expired."}, status=404)
        response_draft = deepcopy(draft if is_preview else snapshot)
        response_draft.pop("published_snapshot", None)
        response_draft = {
            **response_draft,
            "entitlement": {
                "attribution_visibility_unlocked": _website_attribution_eligible(business),
            },
        }
        if isinstance(response_draft.get("contact_form"), dict):
            response_draft["contact_form"] = {"enabled": bool(response_draft["contact_form"].get("enabled", True))}
        return Response({
            "business_id": business.id,
            "business_slug": business.slug,
            "business_name": business.name,
            "website": response_draft,
        })


class PublicGeneratedWebsiteContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        preview_token = request.query_params.get("preview_token", "")
        business = preview_business_from_token(preview_token, slug) if preview_token else None
        if business is None:
            for candidate in Business.objects.filter(tier="claimed").iterator():
                website = (candidate.premium_sidebar or {}).get("_website")
                snapshot = website.get("published_snapshot") if isinstance(website, dict) else None
                if isinstance(snapshot, dict) and website.get("published", True) and snapshot.get("website_slug") == slug:
                    business = candidate
                    break
        if business is None:
            return Response({"detail": "This Generated Website is not available."}, status=404)
        draft = (business.premium_sidebar or {}).get("_website") or {}
        snapshot = draft.get("published_snapshot") if isinstance(draft.get("published_snapshot"), dict) else None
        source = draft if preview_token else (snapshot or {})
        form_config = source.get("contact_form") if isinstance(source.get("contact_form"), dict) else {}
        recipient = str(form_config.get("recipient_email") or "").strip()
        if not form_config.get("enabled", True) or not recipient:
            return Response({"detail": "The contact form is not currently available."}, status=404)
        if str(request.data.get("website_url") or "").strip():
            return Response({"detail": "Unable to send this message."}, status=400)
        ip = request.META.get("REMOTE_ADDR", "unknown")
        rate_key = f"generated-contact:{slug}:{ip}"
        if not cache.add(rate_key, True, timeout=60):
            return Response({"detail": "Please wait before sending another message."}, status=429)
        name = str(request.data.get("name") or "").strip()[:120]
        email = str(request.data.get("email") or "").strip()[:254]
        phone = str(request.data.get("phone") or "").strip()[:80]
        subject = str(request.data.get("subject") or "").strip()[:160]
        message = str(request.data.get("message") or "").strip()[:5000]
        if not name or not message or not email:
            return Response({"detail": "Name, email and message are required."}, status=400)
        try:
            validate_email(email)
            validate_email(recipient)
        except ValidationError:
            return Response({"detail": "Enter a valid email address."}, status=400)
        body = "\n".join([
            f"Website: {business.name}", f"Name: {name}", f"Email: {email}",
            f"Phone: {phone or 'Not provided'}", f"Subject: {subject or 'Website contact'}", "", message,
            f"\nOriginating page: /generated/{slug}/contact",
        ])
        try:
            EmailMessage(subject or f"Website contact from {name}", body, settings.DEFAULT_FROM_EMAIL, [recipient], reply_to=[email]).send(fail_silently=False)
        except Exception:
            return Response({"detail": "Unable to send your message right now."}, status=503)
        return Response({"detail": "Your message has been sent."})
