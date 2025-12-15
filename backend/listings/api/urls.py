from django.urls import path
from .views import (
    BusinessList,
    BusinessDetail,
    CountryList,
    CountryStatsListView,
    CityList,
    TownList,
    CategoryList,
    BusinessSearchView,
    BusinessClaimRequestCreate,
    DebugListingsSampleView,
    FilteredCountryListView,
    FilteredCityListView,
    FilteredTownListView,
    FilteredCategoryListView,
    TopCitiesView,
    TopCountriesWithCategoriesView,
    FeaturedBusinessListView,
)

urlpatterns = [
    # Debug endpoints
    path("debug/listings-sample/", DebugListingsSampleView.as_view(), name="debug-listings-sample"),
    
    # Business endpoints
    path("businesses/featured/", FeaturedBusinessListView.as_view(), name="featured-businesses"),
    path("businesses/search/", BusinessSearchView.as_view(), name="business-search"),
    path("businesses/", BusinessList.as_view(), name="business-list"),
    path("businesses/<slug:slug>/", BusinessDetail.as_view(), name="business-detail"),
    
    # Country explorer endpoints  
    path("countries/stats/", CountryStatsListView.as_view(), name="country-stats"),
    
    # Filtered geographic endpoints (with listings only)
    path("countries/", FilteredCountryListView.as_view(), name="filtered-country-list"),
    path("cities/", FilteredCityListView.as_view(), name="filtered-city-list"),
    path("cities/top/", TopCitiesView.as_view(), name="top-cities"),
    path("countries/top-categories/", TopCountriesWithCategoriesView.as_view(), name="top-countries-categories"),
    path("towns/", FilteredTownListView.as_view(), name="filtered-town-list"),
    path("categories/", FilteredCategoryListView.as_view(), name="filtered-category-list"),
    
    # Original endpoints (all records)
    path("all-countries/", CountryList.as_view(), name="country-list"),
    path("all-cities/", CityList.as_view(), name="city-list"),
    path("all-towns/", TownList.as_view(), name="town-list"),
    path("all-categories/", CategoryList.as_view(), name="category-list"),
    
    # Business claim endpoints
    path("claims/", BusinessClaimRequestCreate.as_view(), name="business-claim-create"),
]