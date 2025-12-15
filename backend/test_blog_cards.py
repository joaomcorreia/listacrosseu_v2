#!/usr/bin/env python
"""
Test script to verify blog cards functionality
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

from content.models import Page, Section

def test_blog_cards_functionality():
    """
    Test that blog cards sections are properly configured
    """
    print("🧪 Testing Blog Cards CMS Section Functionality")
    print("=" * 50)
    
    # Check all pages have blog_cards sections
    pages = Page.objects.all()
    print(f"📄 Found {pages.count()} pages in the system")
    
    for page in pages:
        blog_section = Section.objects.filter(
            page=page,
            key='blog_cards',
            type='blog_cards'
        ).first()
        
        if blog_section:
            status = "✅ ACTIVE" if blog_section.active else "⏸️ INACTIVE"
            print(f"  • {page.key}: {status}")
            print(f"    Title: '{blog_section.title}'")
            print(f"    Settings: {blog_section.settings}")
            print(f"    Order: {blog_section.order}")
        else:
            print(f"  • {page.key}: ❌ MISSING blog_cards section")
    
    # Test specific settings
    print(f"\n🔧 Blog Cards Section Configuration:")
    blog_sections = Section.objects.filter(type='blog_cards')
    
    for section in blog_sections:
        settings = section.settings
        print(f"  • Page: {section.page.key}")
        print(f"    Mode: {settings.get('mode', 'NOT SET')}")
        print(f"    Limit: {settings.get('limit', 'NOT SET')}")
        print(f"    Category: {settings.get('categorySlug', 'None')}")
        print()
    
    print("✅ Blog Cards CMS Section test completed!")

if __name__ == "__main__":
    test_blog_cards_functionality()