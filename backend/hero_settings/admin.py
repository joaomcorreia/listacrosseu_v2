from django.contrib import admin
from .models import HeroEffectSettings, UiTextGroup, UiTextTranslation


@admin.register(HeroEffectSettings)
class HeroEffectSettingsAdmin(admin.ModelAdmin):
    list_display = ("enabled", "intensity", "opacity", "updated_at")

    def has_add_permission(self, request):
        # Only allow one instance
        if HeroEffectSettings.objects.exists():
            return False
        return super().has_add_permission(request)


class UiTextTranslationInline(admin.TabularInline):
    model = UiTextTranslation
    extra = 1


@admin.register(UiTextGroup)
class UiTextGroupAdmin(admin.ModelAdmin):
    list_display = ("key",)
    inlines = [UiTextTranslationInline]


@admin.register(UiTextTranslation)
class UiTextTranslationAdmin(admin.ModelAdmin):
    list_display = ("group", "language", "updated_at")
    list_filter = ("language", "group")
