import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

from listings.models import Business

print("=== Location-First URLs: Canonical Path Testing ===")
print()

# Test canonical path generation for different businesses
businesses = Business.objects.select_related('city', 'country', 'town').filter(tier__in=['premium', 'claimed'])[:3]

for business in businesses:
    print(f"🏢 Business: {business.name} (Tier: {business.tier.upper()})")
    print(f"   Current slug: {business.slug}")
    print(f"   City: {business.city.name if business.city else 'None'} ({business.city.slug if business.city else 'None'})")  
    print(f"   Town: {business.town.name if business.town else 'None'} ({business.town.slug if business.town else 'None'})")
    print(f"   🔗 Canonical URL: {business.get_canonical_path('en')}")
    print(f"   📊 SEO Priority: {business.get_sitemap_priority()}")
    print(f"   🔄 Update Freq: {business.get_sitemap_changefreq()}")
    print()

# Test API endpoint
print("=== Testing Business Detail API ===")
import requests

try:
    # Test one business API response
    test_business = businesses[0] if businesses else None
    if test_business:
        url = f"http://127.0.0.1:8000/api/listings/businesses/{test_business.slug}/"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Response includes canonical_path: {data.get('canonical_path', 'MISSING')}")
        else:
            print(f"❌ API Error: {response.status_code}")
    
except Exception as e:
    print(f"❌ API Test failed: {e}")

print()

# Test Featured Business API
print("=== Testing Featured Business API (Premium EU-wide visibility) ===")
try:
    # Test EU-wide premium businesses
    url = "http://127.0.0.1:8000/api/listings/businesses/featured/?scope=eu&limit=5"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ EU Premium Businesses: {data['count']} found")
        for business in data['results'][:2]:
            print(f"   - {business['name']} (Tier: {business['tier']}) -> {business.get('canonical_path', 'NO PATH')}")
    else:
        print(f"❌ Featured API Error: {response.status_code}")
        
except Exception as e:
    print(f"❌ Featured API Test failed: {e}")

print()
print("=== URL Patterns Summary ===")
print("✅ /[lang]/[city]/[business] - Primary format (no town)")
print("✅ /[lang]/[city]/[town]/[business] - Extended format (with town)") 
print("✅ /[lang]/business/[slug] - Fallback (redirects to canonical)")
print()
print("🎯 Next: Test frontend routing and redirects")