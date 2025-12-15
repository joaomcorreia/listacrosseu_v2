#!/usr/bin/env python3

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

from content.models import Page, Section, SectionBusinessPick
from listings.models import Business

def add_sample_business_picks():
    """Add sample business picks to demonstrate the manual selection feature."""
    
    try:
        # Get the homepage
        page = Page.objects.get(key='home')
        
        # Get the claimed listings section
        claimed_section = Section.objects.get(page=page, key='claimed_listings')
        premium_section = Section.objects.get(page=page, key='premium_listings')
        
        # Get some businesses with different tiers for testing
        claimed_businesses = Business.objects.filter(tier='claimed')[:3]
        premium_businesses = Business.objects.filter(tier='premium')[:3]
        
        print(f"Found {claimed_businesses.count()} claimed businesses")
        print(f"Found {premium_businesses.count()} premium businesses")
        
        # Add claimed businesses to claimed section
        for i, business in enumerate(claimed_businesses):
            pick, created = SectionBusinessPick.objects.get_or_create(
                section=claimed_section,
                business=business,
                defaults={'order': i}
            )
            if created:
                print(f"✓ Added {business.name} to claimed listings section")
            else:
                print(f"- {business.name} already in claimed listings section")
        
        # Add premium businesses to premium section
        for i, business in enumerate(premium_businesses):
            pick, created = SectionBusinessPick.objects.get_or_create(
                section=premium_section,
                business=business,
                defaults={'order': i}
            )
            if created:
                print(f"✓ Added {business.name} to premium listings section")
            else:
                print(f"- {business.name} already in premium listings section")
        
        print(f"\nClaimed section now has {claimed_section.business_picks.count()} manually selected businesses")
        print(f"Premium section now has {premium_section.business_picks.count()} manually selected businesses")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_sample_business_picks()