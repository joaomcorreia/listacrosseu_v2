from django.urls import path
from .views import HeroEffectSettingsView, UiTextByGroupAndLangView, SidebarBySlotKeyView

urlpatterns = [
    path("hero-effects/", HeroEffectSettingsView.as_view(), name="hero-effects"),
    path(
        "texts/<str:group_key>/",
        UiTextByGroupAndLangView.as_view(),
        name="ui-texts-by-group",
    ),
    path(
        "sidebar/<str:slot_key>/",
        SidebarBySlotKeyView.as_view(),
        name="sidebar-by-slot",
    ),
]