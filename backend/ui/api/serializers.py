from rest_framework import serializers
from hero_settings.models import HeroEffectSettings, UiTextTranslation
from ui.models import SidebarItem


class HeroEffectSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroEffectSettings
        fields = ["enabled", "opacity", "intensity", "updated_at"]


class UiTextTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UiTextTranslation
        fields = ["group", "language", "data", "updated_at"]


class SidebarItemSerializer(serializers.ModelSerializer):
    slot = serializers.SlugRelatedField(slug_field="key", read_only=True)

    class Meta:
        model = SidebarItem
        fields = [
            "id",
            "slot",
            "title",
            "item_type",
            "content_html",
            "content_text",
            "image_url",
            "link_url",
            "link_text",
            "order",
            "is_active",
            "css_classes",
        ]