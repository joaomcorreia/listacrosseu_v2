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

# Mock a request to test API response
from django.http import HttpRequest
from django.test import RequestFactory
from listings.api.views import BusinessList

print("🔍 Testing API endpoint response format...")

# Create a mock request
factory = RequestFactory()
request = factory.get('/api/businesses/?limit=3')

# Create view instance and get response
view = BusinessList()
view.request = request
queryset = view.get_queryset()[:3]
serializer = view.get_serializer(queryset, many=True)

print("📄 API Response format:")
print(json.dumps(serializer.data, indent=2))

print("\n✅ API endpoint test complete!")