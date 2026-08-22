from django.contrib import admin
from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.text import slugify
from .models import Country, City, Town, Category, Business, BusinessClaimRequest, CategorySuggestion
from .category_suggestions import sync_listing_category


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "code")
    search_fields = ("name", "slug", "code")


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "country", "slug")
    list_filter = ("country",)
    search_fields = ("name", "slug")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_public")
    list_filter = ("is_public",)
    search_fields = ("name", "slug")


class CategorySuggestionAdminForm(forms.ModelForm):
    canonical_name = forms.CharField(required=False, help_text="Used when approving as a new canonical category.")
    canonical_slug = forms.SlugField(required=False, help_text="Optional slug override when approving as a new category.")

    class Meta:
        model = CategorySuggestion
        fields = "__all__"

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("status") == "approved":
            has_existing_category = bool(cleaned.get("category"))
            has_canonical_name = bool(cleaned.get("canonical_name", "").strip())
            if not has_existing_category and not has_canonical_name:
                raise ValidationError("Select an existing category or enter a canonical category name before approving.")
        return cleaned


@admin.register(CategorySuggestion)
class CategorySuggestionAdmin(admin.ModelAdmin):
    form = CategorySuggestionAdminForm
    list_display = ("proposed_name", "status", "category", "listing", "submitter_email", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("proposed_name", "submitter_email", "listing__name")
    readonly_fields = ("created_at", "updated_at", "reviewed_at")

    def save_model(self, request, obj, form, change):
        if obj.status == "approved":
            category = obj.category
            canonical_name = form.cleaned_data.get("canonical_name", "").strip()
            canonical_slug = form.cleaned_data.get("canonical_slug", "").strip()
            if category is None and canonical_name:
                category, _ = Category.objects.get_or_create(
                    slug=canonical_slug or slugify(canonical_name),
                    defaults={"name": canonical_name, "is_public": True},
                )
            if category and not category.is_public:
                category.is_public = True
                category.save(update_fields=["is_public"])
            obj.category = category
            obj.reviewed_at = timezone.now()
            if obj.listing and category:
                sync_listing_category(listing=obj.listing, category=category)
        elif obj.status == "rejected":
            obj.reviewed_at = timezone.now()
        else:
            obj.reviewed_at = None
        super().save_model(request, obj, form, change)


@admin.register(Town)
class TownAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "slug")
    list_filter = ("city__country", "city")
    search_fields = ("name", "slug")


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "tier",
        "is_published",
        "country",
        "city",
        "town",
        "category",
        "visibility_scope",
        "visibility_country",
        "premium_layout_width",
        "source",
    )
    list_filter = (
        "tier",
        "is_published",
        "visibility_scope",
        "country",
        "city",
        "town",
        "category",
        "source",
        "is_micro",
    )
    search_fields = ("name", "description", "website", "phone")

    fieldsets = (
        ("Basic Information", {
            "fields": ("name", "slug", "tier", "is_published", "category")
        }),
        ("Location", {
            "fields": ("country", "city", "town", "address", "address_line1", "postal_code", "latitude", "longitude")
        }),
        ("Visibility", {
            "fields": ("visibility_scope", "visibility_country"),
            "description": "Controls where this listing is allowed to appear (EU-wide or country-only).",
        }),
        ("Contact & Web", {
            "fields": ("phone", "business_contact_email", "whatsapp_number", "spoken_languages", "website", "description", "keywords")
        }),
        ("Premium Content", {
            "fields": ("logo_url", "logo_file", "claimed_background_file", "image_url", "premium_content", "premium_images", "premium_sidebar", "premium_layout_width"),
            "classes": ("collapse",),
            "description": "Premium tier content and configuration",
        }),
        ("Business Details", {
            "fields": ("is_micro", "employee_count"),
            "classes": ("collapse",),
        }),
        ("Import Tracking", {
            "fields": ("source", "external_id", "imported_from_csv", "csv_imported_at", "csv_source_file"),
            "classes": ("collapse",),
        }),
    )


@admin.register(BusinessClaimRequest)
class BusinessClaimRequestAdmin(admin.ModelAdmin):
    list_display = ("business_name", "name", "email", "created_at")
    list_filter = ("created_at",)
    search_fields = ("business_name", "name", "email")
    readonly_fields = ("created_at",)
