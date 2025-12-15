"""
Geo-specific URL patterns for city and location pages.
"""
from django.urls import path
from .geo_views import (
    CityDetailView,
    CityBusinessesView,
    TownDetailView,
    TownBusinessesView,
    CitiesWithBusinessesView,
    TownsWithBusinessesView,
)

urlpatterns = [
    # City endpoints
    path("cities/", CitiesWithBusinessesView.as_view(), name="cities-with-businesses"),
    path("cities/<slug:city_slug>/", CityDetailView.as_view(), name="city-detail"),
    path("cities/<slug:city_slug>/businesses/", CityBusinessesView.as_view(), name="city-businesses"),
    
    # Town endpoints
    path("towns/", TownsWithBusinessesView.as_view(), name="towns-with-businesses"),
    path("towns/<slug:town_slug>/", TownDetailView.as_view(), name="town-detail"),
    path("towns/<slug:town_slug>/businesses/", TownBusinessesView.as_view(), name="town-businesses"),
]