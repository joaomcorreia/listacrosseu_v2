#!/usr/bin/env python3
import os
import sys
import django
import json

# Add the backend directory to Python path
backend_dir = r'C:\projects\listacrosseu_v2\backend'
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

# Test serializer directly
from listings.models import Business
from listings.api.serializers import BusinessSerializer

print("🔍 Testing API serializer format...")

# Get some businesses
businesses = Business.objects.select_related('country', 'city', 'category')[:3]

# Serialize them
serializer = BusinessSerializer(businesses, many=True)
data = serializer.data

print("📄 API Response format:")
print(json.dumps(data, indent=2))

print(f"\n✅ Serialized {len(data)} businesses successfully!")