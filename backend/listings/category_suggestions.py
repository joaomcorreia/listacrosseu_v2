from django.utils import timezone

from .models import CategorySuggestion


def sync_listing_category(*, listing, category):
    """Apply an approved canonical category to the business and its presentations."""
    sidebar = dict(listing.premium_sidebar or {})
    claimed = sidebar.get("_claimed_listing") if isinstance(sidebar.get("_claimed_listing"), dict) else {}
    for key in ("draft", "published"):
        presentation = claimed.get(key)
        if isinstance(presentation, dict):
            presentation = dict(presentation)
            presentation["category_id"] = category.id
            claimed[key] = presentation
    if claimed:
        sidebar["_claimed_listing"] = claimed
    listing.category = category
    listing.premium_sidebar = sidebar
    listing.save(update_fields=["category", "is_published", "premium_sidebar"])


def ensure_category_suggestion(*, proposed_name, listing=None, user=None, email=""):
    proposed_name = str(proposed_name or "").strip()
    if not proposed_name:
        return None
    submitter_email = str(email or getattr(user, "email", "") or "").strip().lower()
    existing = CategorySuggestion.objects.filter(
        listing=listing,
        status="pending",
        proposed_name__iexact=proposed_name,
        submitter_email__iexact=submitter_email,
    ).first()
    if existing:
        return existing
    return CategorySuggestion.objects.create(
        proposed_name=proposed_name,
        listing=listing,
        submitted_by=user if getattr(user, "is_authenticated", False) else None,
        submitter_email=submitter_email,
    )


def resolve_pending_category_suggestions(*, listing, category, note="Superseded by the owner selecting an existing category."):
    if not listing or not category:
        return 0
    return CategorySuggestion.objects.filter(listing=listing, status="pending").update(
        status="rejected",
        category=category,
        reviewer_notes=note,
        reviewed_at=timezone.now(),
    )
