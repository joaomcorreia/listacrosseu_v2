#!/usr/bin/env python3
import django
import os

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

from listings.models import Business

# Find businesses in Braga and set different tiers
braga_businesses = Business.objects.filter(city__slug='braga')[:3]
print(f'Found {len(braga_businesses)} businesses in Braga')

if braga_businesses:
    # Set first business to premium with test data
    business = braga_businesses[0]
    business.tier = 'premium'
    business.logo_url = 'https://via.placeholder.com/100x100/orange/white?text=LOGO'
    business.image_url = 'https://via.placeholder.com/400x300/blue/white?text=PREMIUM+IMAGE'
    business.keywords = ['premium', 'employment', 'professional', 'staffing', 'international']
    business.save()
    print(f'✅ Updated {business.name} -> PREMIUM tier')
    
    # Set second business to claimed
    if len(braga_businesses) > 1:
        business2 = braga_businesses[1]
        business2.tier = 'claimed'
        business2.keywords = ['claimed', 'recruitment', 'careers']
        business2.save()
        print(f'✅ Updated {business2.name} -> CLAIMED tier')
        
    # Keep third as FREE (default)
    if len(braga_businesses) > 2:
        business3 = braga_businesses[2]
        business3.tier = 'free'
        business3.keywords = ['legal', 'consulting', 'braga']
        business3.save()
        print(f'✅ Updated {business3.name} -> FREE tier')

print('🎯 Tier testing setup complete!')