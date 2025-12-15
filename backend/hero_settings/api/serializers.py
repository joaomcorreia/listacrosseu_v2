from rest_framework import serializers
from hero_settings.models import HeroEffectSettings, UiTextTranslation
from ui.models import SidebarSlot, SidebarItem


class HeroEffectSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroEffectSettings
        fields = ["enabled", "opacity", "intensity", "updated_at"]


class UiTextTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UiTextTranslation
        fields = ["group", "language", "data", "updated_at"]


class SidebarItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SidebarItem
        fields = [
            "id",
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
            "created_at",
            "updated_at",
        ]


class SidebarSlotSerializer(serializers.ModelSerializer):
    items = SidebarItemSerializer(many=True, read_only=True)

    class Meta:
        model = SidebarSlot
        fields = [
            "id",
            "key",
            "name",
            "is_active",
            "created_at",
            "updated_at",
            "items",
        ]