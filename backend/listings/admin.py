from django.contrib import admin
from .models import Country, City, Town, Category, Business, BusinessClaimRequest


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
    list_display = ("name", "slug")
    search_fields = ("name", "slug")


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
            "fields": ("name", "slug", "tier", "category")
        }),
        ("Location", {
            "fields": ("country", "city", "town", "address", "address_line1", "postal_code", "latitude", "longitude")
        }),
        ("Visibility", {
            "fields": ("visibility_scope", "visibility_country"),
            "description": "Controls where this listing is allowed to appear (EU-wide or country-only).",
        }),
        ("Contact & Web", {
            "fields": ("phone", "website", "description", "keywords")
        }),
        ("Premium Content", {
            "fields": ("logo_url", "image_url", "premium_content", "premium_images", "premium_sidebar", "premium_layout_width"),
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
