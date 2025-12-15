#!/usr/bin/env python
"""Check business data for demo/test filtering needs"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

from listings.models import Business
from django.db.models import Count

def check_business_data():
    print("=== Business Data Analysis for Preview ===\n")
    
    # Count total businesses
    total = Business.objects.count()
    print(f"Total businesses: {total}")
    
    # Check sources
    print("\nBusiness sources:")
    sources = Business.objects.values('source').annotate(count=Count('id')).order_by('-count')
    for source in sources[:10]:
        print(f"  - {source['source']}: {source['count']} businesses")
    
    # Check for test/demo names
    print("\nChecking for demo/test business names...")
    test_keywords = ['test', 'demo', 'sample', 'fake', 'example', 'temp', 'placeholder']
    found_test_businesses = []
    
    for keyword in test_keywords:
        businesses = Business.objects.filter(name__icontains=keyword)
        if businesses.exists():
            print(f"\nBusinesses containing '{keyword}':")
            for business in businesses[:3]:
                print(f"  - {business.name} (source: {business.source})")
                found_test_businesses.append(business.id)
    
    if not found_test_businesses:
        print("No obvious test/demo businesses found by name.")
    
    # Sample legitimate business names
    print("\nSample business names:")
    sample_businesses = Business.objects.exclude(id__in=found_test_businesses)[:10]
    for business in sample_businesses:
        print(f"  - {business.name} (source: {business.source})")
    
    # Analysis summary
    print(f"\n=== Summary ===")
    print(f"- Total businesses: {total}")
    print(f"- Potential test businesses found: {len(found_test_businesses)}")
    
    if found_test_businesses:
        print(f"- Recommend filtering businesses with IDs: {found_test_businesses[:5]}")
    else:
        print("- No filtering needed - data appears to be legitimate")

if __name__ == "__main__":
    check_business_data()