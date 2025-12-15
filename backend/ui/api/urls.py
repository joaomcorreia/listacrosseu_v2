from django.urls import path
from .views import (
    HeroEffectSettingsView,
    UiTextByGroupAndLangView,
    SidebarItemsView,
)

urlpatterns = [
    path("hero-effects/", HeroEffectSettingsView.as_view(), name="hero-effects"),
    path(
        "texts/<str:group_key>/",
        UiTextByGroupAndLangView.as_view(),
        name="ui-texts-by-group",
    ),
    path("sidebar/", SidebarItemsView.as_view(), name="sidebar-items"),
]