from django.conf import settings
from django.urls import path

from .views import (
    BusinessDetail,
    BusinessList,
    BusinessSearchView,
    CategoryList,
    CityList,
    CountryList,
    CountryStatsListView,
    DebugListingsSampleView,
    FeaturedBusinessListView,
    FilteredCategoryListView,
    FilteredCityListView,
    FilteredCountryListView,
    FilteredTownListView,
    TopCitiesView,
    TopCountriesWithCategoriesView,
    TownList,
    create_claim,
    verify_claim,
)


urlpatterns = [
    path("businesses/featured/", FeaturedBusinessListView.as_view(), name="featured-businesses"),
    path("businesses/search/", BusinessSearchView.as_view(), name="business-search"),
    path("businesses/", BusinessList.as_view(), name="business-list"),
    path("businesses/<slug:slug>/", BusinessDetail.as_view(), name="business-detail"),
    path("countries/stats/", CountryStatsListView.as_view(), name="country-stats"),
    path("countries/", FilteredCountryListView.as_view(), name="filtered-country-list"),
    path("cities/", FilteredCityListView.as_view(), name="filtered-city-list"),
    path("cities/top/", TopCitiesView.as_view(), name="top-cities"),
    path("countries/top-categories/", TopCountriesWithCategoriesView.as_view(), name="top-countries-categories"),
    path("towns/", FilteredTownListView.as_view(), name="filtered-town-list"),
    path("categories/", FilteredCategoryListView.as_view(), name="filtered-category-list"),
    path("all-countries/", CountryList.as_view(), name="country-list"),
    path("all-cities/", CityList.as_view(), name="city-list"),
    path("all-towns/", TownList.as_view(), name="town-list"),
    path("all-categories/", CategoryList.as_view(), name="category-list"),
    path("claims", create_claim, name="create-claim"),
    path("verify", verify_claim, name="verify-claim"),
]

if settings.EXPOSE_PUBLIC_DEBUG_ENDPOINTS:
    urlpatterns.insert(
        0,
        path("debug/listings-sample/", DebugListingsSampleView.as_view(), name="debug-listings-sample"),
    )
