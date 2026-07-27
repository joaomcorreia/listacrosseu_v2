"""
Geo-specific API views for city and location pages.
These endpoints are optimized for the frontend location pages.
"""
from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from listings.models import Country, City, Town, Business
from listings.api.serializers import CountrySerializer, CitySerializer, TownSerializer, BusinessSerializer


class CityDetailView(generics.RetrieveAPIView):
    """
    Get city details by slug, including country info.
    """
    lookup_field = "slug"
    queryset = City.objects.all().select_related("country")
    serializer_class = CitySerializer


class CityBusinessesView(APIView):
    """
    Get businesses in a specific city.
    """
    def get(self, request, city_slug):
        try:
            city = City.objects.get(slug=city_slug)
            country_code = (city.country.code or "").upper() if city.country else ""
            businesses = Business.objects.filter(city=city).select_related("country", "city", "town", "category")
            if country_code:
                businesses = businesses.filter(
                    Q(tier="claimed")
                    | Q(tier="premium", visibility_scope="eu")
                    | Q(
                        tier="premium",
                        visibility_scope="country",
                        visibility_country__iexact=country_code,
                    )
                )
            else:
                businesses = businesses.filter(
                    Q(tier="claimed")
                    | Q(tier="premium", visibility_scope="eu")
                )
            
            # Apply pagination
            limit = min(int(request.query_params.get('limit', 20)), 100)
            offset = int(request.query_params.get('offset', 0))
            
            total_count = businesses.count()
            businesses = list(businesses)
            tier_order = {"premium": 1, "claimed": 2, "free": 3}
            businesses.sort(key=lambda b: (tier_order.get(b.tier, 4), b.created_at))
            businesses = businesses[offset:offset + limit]
            
            serializer = BusinessSerializer(businesses, many=True)
            
            return Response({
                "city": CitySerializer(city).data,
                "businesses": serializer.data,
                "total_count": total_count,
                "has_more": (offset + limit) < total_count
            })
        except City.DoesNotExist:
            return Response({"error": "City not found"}, status=404)


class TownDetailView(generics.RetrieveAPIView):
    """
    Get town details by slug, including city and country info.
    """
    lookup_field = "slug"
    queryset = Town.objects.all().select_related("city__country")
    serializer_class = TownSerializer


class TownBusinessesView(APIView):
    """
    Get businesses in a specific town.
    """
    def get(self, request, town_slug):
        try:
            town = Town.objects.get(slug=town_slug)
            country_code = (town.city.country.code or "").upper() if town.city and town.city.country else ""
            businesses = Business.objects.filter(town=town).select_related("country", "city", "town", "category")
            if country_code:
                businesses = businesses.filter(
                    Q(tier__in=["free", "claimed"])
                    | Q(tier="premium", visibility_scope="eu")
                    | Q(
                        tier="premium",
                        visibility_scope="country",
                        visibility_country__iexact=country_code,
                    )
                )
            else:
                businesses = businesses.filter(
                    Q(tier__in=["free", "claimed"])
                    | Q(tier="premium", visibility_scope="eu")
                )
            
            # Apply pagination
            limit = min(int(request.query_params.get('limit', 20)), 100)
            offset = int(request.query_params.get('offset', 0))
            
            total_count = businesses.count()
            businesses = list(businesses)
            tier_order = {"premium": 1, "claimed": 2, "free": 3}
            businesses.sort(key=lambda b: (tier_order.get(b.tier, 4), b.created_at))
            businesses = businesses[offset:offset + limit]
            
            serializer = BusinessSerializer(businesses, many=True)
            
            return Response({
                "town": TownSerializer(town).data,
                "businesses": serializer.data,
                "total_count": total_count,
                "has_more": (offset + limit) < total_count
            })
        except Town.DoesNotExist:
            return Response({"error": "Town not found"}, status=404)


class CitiesWithBusinessesView(APIView):
    """
    Get all cities that have businesses, with business counts.
    """
    def get(self, request):
        country_slug = request.query_params.get('country', None)
        
        cities = City.objects.annotate(
            business_count=Count('businesses')
        ).filter(business_count__gt=0).select_related('country')
        
        if country_slug:
            cities = cities.filter(country__slug=country_slug)
        
        cities = cities.order_by('-business_count', 'name')
        
        # Apply pagination
        limit = min(int(request.query_params.get('limit', 50)), 200)
        offset = int(request.query_params.get('offset', 0))
        
        total_count = cities.count()
        cities = cities[offset:offset + limit]
        
        data = []
        for city in cities:
            city_data = CitySerializer(city).data
            city_data['business_count'] = city.business_count
            data.append(city_data)
        
        return Response({
            "cities": data,
            "total_count": total_count,
            "has_more": (offset + limit) < total_count
        })


class TownsWithBusinessesView(APIView):
    """
    Get all towns that have businesses, with business counts.
    """
    def get(self, request):
        city_slug = request.query_params.get('city', None)
        
        towns = Town.objects.annotate(
            business_count=Count('businesses')
        ).filter(business_count__gt=0).select_related('city__country')
        
        if city_slug:
            towns = towns.filter(city__slug=city_slug)
        
        towns = towns.order_by('-business_count', 'name')
        
        # Apply pagination
        limit = min(int(request.query_params.get('limit', 50)), 200)
        offset = int(request.query_params.get('offset', 0))
        
        total_count = towns.count()
        towns = towns[offset:offset + limit]
        
        data = []
        for town in towns:
            town_data = TownSerializer(town).data
            town_data['business_count'] = town.business_count
            data.append(town_data)
        
        return Response({
            "towns": data,
            "total_count": total_count,
            "has_more": (offset + limit) < total_count
        })
