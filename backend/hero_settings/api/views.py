from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from hero_settings.models import HeroEffectSettings, UiTextGroup, UiTextTranslation
from ui.models import SidebarSlot
from .serializers import HeroEffectSettingsSerializer, UiTextTranslationSerializer, SidebarSlotSerializer


class HeroEffectSettingsView(APIView):
    """
    Returns the single hero effect settings record.
    If none exists, a default one is created.
    """

    def get(self, request, *args, **kwargs):
        settings_obj = HeroEffectSettings.get_solo()
        serializer = HeroEffectSettingsSerializer(settings_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UiTextByGroupAndLangView(APIView):
    """
    Returns a JSON blob of UI strings for a given group + language.

    If the requested language is missing, falls back to English.
    """

    def get(self, request, group_key: str):
        lang = request.query_params.get("lang", "en").lower()
        group = get_object_or_404(UiTextGroup, key=group_key)

        try:
            translation = group.translations.get(language=lang)
        except UiTextTranslation.DoesNotExist:
            try:
                translation = group.translations.get(language="en")
            except UiTextTranslation.DoesNotExist:
                return Response(
                    {"detail": "No translations found for this group."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        serializer = UiTextTranslationSerializer(translation)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SidebarBySlotKeyView(APIView):
    """
    Returns sidebar items for a given slot key.
    Only returns active slots and active items.
    """

    def get(self, request, slot_key: str):
        try:
            slot = SidebarSlot.objects.prefetch_related("items").get(
                key=slot_key,
                is_active=True
            )
        except SidebarSlot.DoesNotExist:
            return Response(
                {"detail": "Sidebar slot not found or inactive."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Filter to only active items
        slot.items.set(slot.items.filter(is_active=True).order_by("order", "created_at"))
        
        serializer = SidebarSlotSerializer(slot)
        return Response(serializer.data, status=status.HTTP_200_OK)