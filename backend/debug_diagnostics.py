#!/usr/bin/env python3
from listings.models import Business, City, Country

print('=== DATABASE DIAGNOSTICS ===')
print(f'Total businesses: {Business.objects.count()}')
print(f'Total cities: {City.objects.count()}')
print(f'Total countries: {Country.objects.count()}')

print('\n=== FIRST 5 BUSINESSES ===')
for b in Business.objects.select_related('city', 'country')[:5]:
    city_info = f"{b.city.name} (slug: {b.city.slug})" if b.city else "None"
    country_info = f"{b.country.name}" if b.country else "None"
    print(f'  - {b.name} | City: {city_info} | Country: {country_info}')

print('\n=== BRAGA CITY SEARCH ===')
# Test the exact filtering that the API uses
braga_businesses = Business.objects.filter(
    city__slug__iexact='braga'
)
print(f'Businesses with city.slug=braga: {braga_businesses.count()}')

braga_businesses_name = Business.objects.filter(
    city__name__iexact='braga'
)
print(f'Businesses with city.name=braga: {braga_businesses_name.count()}')

print('\n=== CITIES CONTAINING BRAGA ===')
braga_cities = City.objects.filter(slug__icontains='braga')
for c in braga_cities:
    print(f'  - {c.name} (slug: {c.slug})')

print('\n=== ALL PORTUGUESE CITIES ===')
portuguese_cities = City.objects.filter(country__name__icontains='Portugal')
print(f'Total Portuguese cities: {portuguese_cities.count()}')
for c in portuguese_cities[:10]:  # Show first 10
    print(f'  - {c.name} (slug: {c.slug})')