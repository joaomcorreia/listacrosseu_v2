from copy import deepcopy


DEFAULT_VISIBILITY = {
    "address": True, "phone": True, "whatsapp": False, "email": False,
    "website": True, "city": True, "region": True, "country": True, "languages": True, "description": True, "business_type": True,
}
OVERLAY_COLORS = {"#2563EB", "#16A34A", "#0F766E", "#7C3AED", "#EA580C", "#DC2626", "#0F172A", "#64748B"}


def _safe_opacity(value):
    try:
        return max(0, min(1, float(value)))
    except (TypeError, ValueError):
        return 0.72


def _safe_overlay(value):
    value = str(value or "").strip().upper()
    return value if value in OVERLAY_COLORS else "#0F172A"


CLAIMED_LISTING_FIELDS = {
    "name", "business_type", "description", "address", "address_line1", "postal_code",
    "phone", "email", "contact_email", "whatsapp_number", "website", "owner_name", "languages", "logo_url", "image_url",
    "background_image", "gallery_images", "overlay_color", "overlay_opacity", "accent_color", "region", "category_id", "city_id", "category_suggestion", "visibility",
}


def claimed_listing_container(business):
    sidebar = business.premium_sidebar if isinstance(business.premium_sidebar, dict) else {}
    value = sidebar.get("_claimed_listing")
    return value if isinstance(value, dict) else {}


def normalize_claimed_draft(business, payload):
    payload = payload if isinstance(payload, dict) else {}
    dashboard = (business.premium_sidebar or {}).get("_dashboard", {}) if isinstance(business.premium_sidebar, dict) else {}
    existing_draft = claimed_listing_container(business).get("draft", {})
    existing_gallery = existing_draft.get("gallery_images", []) if isinstance(existing_draft, dict) else []
    gallery_value = payload.get("gallery_images", existing_gallery)
    gallery_images = [str(item).strip() for item in gallery_value if str(item).strip()][:4] if isinstance(gallery_value, list) else []
    stored_background = business.claimed_background_file.url if business.claimed_background_file else ""
    draft = {
        "name": str(payload.get("name") or business.name).strip(),
        "business_type": str(payload.get("business_type") or dashboard.get("business_type") or "").strip(),
        "description": str(payload.get("description") or business.description or "").strip(),
        "address": str(payload.get("address") or business.address or "").strip(),
        "address_line1": str(payload.get("address_line1") or business.address_line1 or "").strip(),
        "postal_code": str(payload.get("postal_code") or business.postal_code or "").strip(),
        "phone": str(payload.get("phone") or business.phone or "").strip(),
        "email": str(payload.get("email") or dashboard.get("email") or "").strip().lower(),
        "contact_email": str(payload.get("contact_email") or business.business_contact_email or "").strip().lower(),
        "whatsapp_number": str(payload.get("whatsapp_number") or business.whatsapp_number or "").strip(),
        "website": str(payload.get("website") or business.website or "").strip(),
        "owner_name": str(payload.get("owner_name") or dashboard.get("owner_name") or "").strip(),
        "languages": [str(item).strip() for item in payload.get("languages", business.spoken_languages) if str(item).strip()] if isinstance(payload.get("languages", business.spoken_languages), list) else [],
        "logo_url": str(payload.get("logo_url") or business.logo_url or "").strip(),
        "image_url": str(payload.get("image_url") or business.image_url or "").strip(),
        # A claimed-listing upload is more specific than the legacy business
        # image and must remain authoritative when an editor draft is saved.
        "background_image": str(stored_background or payload.get("background_image") or business.image_url or "").strip(),
        "gallery_images": gallery_images,
        "overlay_color": _safe_overlay(payload.get("overlay_color")),
        "overlay_opacity": _safe_opacity(payload.get("overlay_opacity", 0.72)),
        "accent_color": str(payload.get("accent_color") or business.accent_color or "#2563EB").strip().upper(),
        "region": str(payload.get("region") or dashboard.get("region") or "").strip(),
        "category_id": payload["category_id"] if "category_id" in payload else business.category_id,
        "city_id": payload.get("city_id") or business.city_id,
        "category_suggestion": str(payload.get("category_suggestion") or "").strip(),
        "visibility": {
            key: bool(payload.get("visibility", {}).get(key, default))
            for key, default in DEFAULT_VISIBILITY.items()
        } if isinstance(payload.get("visibility"), dict) else dict(DEFAULT_VISIBILITY),
    }
    return draft


def save_claimed_draft(business, draft):
    sidebar = dict(business.premium_sidebar or {})
    claimed = dict(claimed_listing_container(business))
    claimed["draft"] = deepcopy(draft)
    claimed.setdefault("published", None)
    claimed["status"] = "published" if claimed.get("published") else "draft"
    sidebar["_claimed_listing"] = claimed
    business.premium_sidebar = sidebar
    business.save(update_fields=["premium_sidebar"])
    return claimed


def public_claimed_presentation(business):
    published = claimed_listing_container(business).get("published")
    return published if isinstance(published, dict) else None
