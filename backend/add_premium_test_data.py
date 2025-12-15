#!/usr/bin/env python3

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

from listings.models import Business

def add_premium_test_data():
    """Add premium test data to some businesses."""
    
    try:
        # Get some premium businesses
        premium_businesses = Business.objects.filter(tier='premium')[:3]
        
        print(f"Found {premium_businesses.count()} premium businesses")
        
        for i, business in enumerate(premium_businesses):
            # Add premium content
            business.premium_content = f"""
{business.name} is a leading service provider in {business.city.name if business.city else 'the region'}. 

We specialize in delivering high-quality {business.category.name.lower() if business.category else 'professional'} services to our clients throughout {business.country.name if business.country else 'Europe'}. Our experienced team is committed to excellence and customer satisfaction.

With years of experience in the industry, we have built a reputation for reliability, professionalism, and innovative solutions. We work closely with our clients to understand their unique needs and provide customized services that exceed expectations.

Contact us today to learn more about how we can help your business succeed.
            """.strip()
            
            # Add premium images
            business.premium_images = [
                f"https://picsum.photos/400/300?random={business.id}1",
                f"https://picsum.photos/400/300?random={business.id}2", 
                f"https://picsum.photos/400/300?random={business.id}3"
            ]
            
            # Add logo
            business.logo_url = f"https://picsum.photos/120/120?random={business.id}0"
            
            # Add premium sidebar data
            business.premium_sidebar = {
                "sidebar_highlight": f"Trusted {business.category.name.lower() if business.category else 'professional'} services since 2015",
                "services": [
                    f"Professional {business.category.name.lower() if business.category else 'business'} consulting",
                    "Custom solutions and support", 
                    "Quality assurance and testing",
                    "24/7 customer support",
                    "Competitive pricing"
                ],
                "contact_email": f"info@{business.slug.replace('-', '')}.com",
                "opening_hours": "Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed"
            }
            
            business.save()
            print(f"✓ Updated {business.name} with premium content")
        
        # Also update some claimed businesses with basic content
        claimed_businesses = Business.objects.filter(tier='claimed')[:2]
        for business in claimed_businesses:
            if not business.description:
                business.description = f"Professional {business.category.name.lower() if business.category else 'business'} services in {business.city.name if business.city else 'the area'}. We are committed to providing excellent service to our customers."
            business.save()
            print(f"✓ Updated {business.name} with claimed content")
            
        print(f"\nTest data added successfully!")
        print(f"Premium businesses now have: content, images, sidebar data")
        print(f"Claimed businesses now have: basic descriptions")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_premium_test_data()