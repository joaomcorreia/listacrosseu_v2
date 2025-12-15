#!/usr/bin/env python3
import os
import sys
import django

# Add the backend directory to Python path
backend_dir = r'C:\projects\listacrosseu_v2\backend'
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

# Test the data
from listings.models import Business, Country, City, Category

print("🔍 Testing imported data...")
print(f"📊 Total businesses: {Business.objects.count()}")
print(f"🌍 Countries: {Country.objects.count()}")
print(f"🏙️  Cities: {City.objects.count()}")
print(f"📂 Categories: {Category.objects.count()}")

print("\n🔍 Sample businesses:")
for business in Business.objects.select_related('country', 'city', 'category')[:3]:
    print(f"  - {business.name}")
    print(f"    Country: {business.country.name}")
    print(f"    City: {business.city.name if business.city else 'N/A'}")
    print(f"    Category: {business.category.name if business.category else 'N/A'}")
    print()

# Test API serialization
from listings.api.serializers import BusinessSerializer

print("🔍 Testing API serialization:")
businesses = Business.objects.select_related('country', 'city', 'category')[:2]
serializer = BusinessSerializer(businesses, many=True)
data = serializer.data

print(f"📄 Serialized {len(data)} businesses:")
for item in data:
    print(f"  - {item['name']} ({item['country']['name']})")

print("\n✅ Backend data test complete!")