from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from hero_settings.models import (
    HeroEffectSettings,
    UiTextGroup,
    UiTextTranslation,
)
from ui.models import SidebarItem
from .serializers import (
    HeroEffectSettingsSerializer,
    UiTextTranslationSerializer,
    SidebarItemSerializer,
)


class HeroEffectSettingsView(APIView):
    """
    GET /api/ui/hero-effects/
    Returns the single hero effect settings record, creating it if missing.
    """

    def get(self, request, *args, **kwargs):
        obj, _ = HeroEffectSettings.objects.get_or_create(id=1)
        serializer = HeroEffectSettingsSerializer(obj)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UiTextByGroupAndLangView(APIView):
    """
    GET /api/ui/texts/<group_key>/?lang=en
    Returns UI text JSON for a given group + language, falling back to en.
    """

    def get(self, request, group_key: str):
        lang = (request.query_params.get("lang") or "en").lower()

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


class SidebarItemsView(APIView):
    """
    GET /api/ui/sidebar/?slot=blog_post&lang=en
    Returns active sidebar items for a given slot + language.
    Note: Current SidebarItem model doesn't have language field,
    so we'll just return items for the slot.
    """

    def get(self, request, *args, **kwargs):
        slot_key = (request.query_params.get("slot") or "").strip()
        lang = (request.query_params.get("lang") or "en").lower()

        if not slot_key:
            return Response(
                {"detail": "Missing 'slot' query parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter active items for the slot
        items = SidebarItem.objects.filter(
            slot__key=slot_key,
            slot__is_active=True,
            is_active=True,
        ).select_related("slot").order_by("order", "created_at")

        serializer = SidebarItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)