from rest_framework import serializers
from listings.models import Country, City, Town, Category, Business, BusinessClaimRequest


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
        fields = ["id", "name", "slug", "business_count"]
    
    def get_business_count(self, obj):
        # Use annotated count if available, otherwise do a query
        return getattr(obj, 'business_count', obj.business_set.count())


class BusinessSerializer(serializers.ModelSerializer):
    country = CountrySerializer()
    city = CitySerializer()
    town = TownSerializer()
    category = CategorySerializer()

    country_slug = serializers.SerializerMethodField()
    city_slug = serializers.SerializerMethodField()
    town_slug = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()
    canonical_path = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = [
            "id",
            "name",
            "slug",
            "tier",
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
            "image_url",
            "premium_content",
            "premium_images",
            "premium_sidebar",
            "is_micro",
            "employee_count",
            "source",
            "external_id",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["keywords"] = normalize_keywords(instance.keywords)
        dashboard = (instance.premium_sidebar or {}).get("_dashboard", {})
        data.update({
            "region": dashboard.get("region", ""),
            "business_type": dashboard.get("business_type", ""),
            "owner_name": dashboard.get("owner_name", ""),
            "email": dashboard.get("email", ""),
        })
        visibility = dashboard.get("visibility", {})
        defaults = {
            "owner_name": False,
            "email": False,
            "phone": True,
            "website": True,
            "city": True,
            "region": True,
        }
        for field, default in defaults.items():
            if visibility.get(field, default) is False:
                data[field] = None if field == "city" else ""

        if instance.tier == "free":
            # Unclaimed free listings expose directory discovery data only.
            # Rich contact/profile fields become available after claiming.
            for field in (
                "address", "address_line1", "postal_code", "latitude", "longitude",
                "website", "phone", "email", "owner_name", "region", "logo_url",
                "image_url", "premium_content", "premium_images",
                "premium_sidebar", "employee_count",
            ):
                data[field] = None if field in {"latitude", "longitude"} else ""
        return data

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
