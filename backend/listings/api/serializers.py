from rest_framework import serializers
from listings.models import Country, City, Town, Category, Business, BusinessClaimRequest
from listings.claim_flow import public_claimed_presentation


def normalize_keywords(value):
    """Return the public keyword contract: a clean list of non-empty strings."""
    if isinstance(value, list):
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["id", "name", "slug", "code"]


class CountryWithStatsSerializer(serializers.ModelSerializer):
    business_count = serializers.SerializerMethodField()
    city_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Country
        fields = ["id", "name", "slug", "code", "business_count", "city_count"]
    
    def get_business_count(self, obj):
        # Use annotated count if available, otherwise do a query
        return getattr(obj, 'business_count', obj.businesses.count())
    
    def get_city_count(self, obj):
        # Use annotated count if available, otherwise do a query  
        return getattr(obj, 'city_count', obj.cities.count())


class CitySerializer(serializers.ModelSerializer):
    country = CountrySerializer()

    class Meta:
        model = City
        fields = ["id", "name", "slug", "country"]


class TownSerializer(serializers.ModelSerializer):
    city = CitySerializer()

    class Meta:
        model = Town
        fields = ["id", "name", "slug", "city"]


class CategorySerializer(serializers.ModelSerializer):
    business_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "is_public", "business_count"]
    
    def get_business_count(self, obj):
        # Use annotated count if available, otherwise do a query
        return getattr(obj, 'business_count', obj.business_set.filter(is_published=True).count())


class BusinessSerializer(serializers.ModelSerializer):
    website = serializers.URLField(required=False, allow_blank=True, max_length=Business.WEBSITE_MAX_LENGTH)
    country = CountrySerializer()
    city = CitySerializer()
    town = TownSerializer()
    category = CategorySerializer()

    country_slug = serializers.SerializerMethodField()
    city_slug = serializers.SerializerMethodField()
    town_slug = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()
    canonical_path = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            "id",
            "name",
            "slug",
            "tier",
            "is_published",
            "visibility_scope",
            "visibility_country",
            "premium_layout_width",
            "country",
            "city",
            "town",
            "category",
            "country_slug",
            "city_slug",
            "town_slug",
            "category_slug",
            "canonical_path",
            "address",
            "address_line1",
            "postal_code",
            "latitude",
            "longitude",
            "website",
            "phone",
            "description",
            "keywords",
            "logo_url",
            "accent_color",
            "image_url",
            "premium_content",
            "premium_images",
            "premium_sidebar",
            "is_micro",
            "employee_count",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Publication is controlled by the claimed-listing snapshot, not the
        # historical tier field. Unpublishing keeps the owner's draft and
        # account entitlement but must remove the public presentation.
        published = public_claimed_presentation(instance)
        data["claimed_listing_published"] = bool(published)
        if published:
            for field in ("name", "description", "address", "address_line1", "postal_code", "phone", "website", "logo_url", "image_url", "background_image", "gallery_images", "business_type", "region", "contact_email", "whatsapp_number", "languages", "overlay_color", "overlay_opacity", "accent_color"):
                if field in published:
                    data[field] = published[field]
        data["keywords"] = normalize_keywords(instance.keywords)
        dashboard = (instance.premium_sidebar or {}).get("_dashboard", {})
        data.update({
            "region": data.get("region", dashboard.get("region", "")),
            "business_type": data.get("business_type", dashboard.get("business_type", "")),
            "owner_name": "",
            "email": "",
            "contact_email": data.get("contact_email", ""),
            "whatsapp_number": data.get("whatsapp_number", ""),
            "languages": data.get("languages", []),
            "background_image": data.get("background_image", ""),
            "overlay_color": data.get("overlay_color", "#0F172A"),
            "overlay_opacity": data.get("overlay_opacity", 0.72),
        })
        visibility = (published or {}).get("visibility") if published else None
        visibility = visibility if isinstance(visibility, dict) else dashboard.get("visibility", {})
        defaults = {
            "owner_name": False,
            "email": False,
            "phone": True,
            "website": True,
            "city": True,
            "region": True,
            "country": True,
        }
        for field, default in defaults.items():
            if visibility.get(field, default) is False:
                data[field] = None if field in {"city", "country"} else ""
        data["visibility"] = visibility
        data["gallery_images"] = (published or {}).get("gallery_images", []) if published else []
        if visibility.get("address", True) is False:
            data["address"] = ""
            data["address_line1"] = ""
            data["postal_code"] = ""
        if visibility.get("whatsapp", False) is False:
            data["whatsapp_number"] = ""
        if visibility.get("email", False) is False:
            data["contact_email"] = ""
        if visibility.get("languages", True) is False:
            data["languages"] = []
        if visibility.get("description", True) is False:
            data["description"] = ""
        if visibility.get("business_type", True) is False:
            data["business_type"] = ""

        if instance.tier == "free":
            # Unclaimed free listings expose directory discovery data only.
            # Rich contact/profile fields become available after claiming.
            for field in (
                "address", "address_line1", "postal_code", "latitude", "longitude",
                "website", "phone", "email", "contact_email", "whatsapp_number", "languages", "owner_name", "region", "logo_url",
                "image_url", "premium_content", "premium_images",
                "premium_sidebar", "employee_count",
            ):
                data[field] = None if field in {"latitude", "longitude"} else ""
            data["accent_color"] = ""
            data["background_image"] = ""
        return data

    def get_logo_url(self, obj):
        if obj.logo_file:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.logo_file.url) if request else obj.logo_file.url
        return obj.logo_url or ""

    def get_country_slug(self, obj):
        return obj.country.slug if obj.country else None

    def get_city_slug(self, obj):
        return obj.city.slug if obj.city else None

    def get_town_slug(self, obj):
        return obj.town.slug if obj.town else None

    def get_category_slug(self, obj):
        return obj.category.slug if obj.category else None
    
    def get_canonical_path(self, obj):
        # Get language from request context, default to 'en'
        request = self.context.get('request')
        lang = getattr(request, 'LANGUAGE_CODE', 'en') if request else 'en'
        return obj.get_canonical_path(lang)


class BusinessClaimRequestSerializer(serializers.ModelSerializer):
    listing = BusinessSerializer(read_only=True)
    listing_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = BusinessClaimRequest
        fields = [
            "id",
            "listing",
            "listing_id",
            "name",
            "email",
            "business_name",
            "business_address",
            "business_post_code",
            "created_at",
        ]
