#!/usr/bin/env python
"""
Script to add blog_cards section to all existing pages.
Can be run multiple times safely (idempotent).
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'listacrosseu_backend.settings')
django.setup()

from content.models import Page, Section

def add_blog_cards_section_to_all_pages():
    """
    Add blog_cards section to all existing pages if they don't already have one.
    """
    pages = Page.objects.all()
    
    for page in pages:
        # Check if page already has a blog_cards section
        existing_section = Section.objects.filter(
            page=page,
            key='blog_cards'
        ).first()
        
        if not existing_section:
            # Find the highest order number for this page
            max_order = Section.objects.filter(page=page).aggregate(
                max_order=models.Max('order')
            )['max_order'] or 0
            
            # Create new blog_cards section
            Section.objects.create(
                page=page,
                key='blog_cards',
                type='blog_cards',
                title='Featured Blog Posts',
                subtitle='Stay updated with the latest insights and trends',
                order=max_order + 10,  # Place near the end
                active=True,
                settings={
                    'mode': 'latest',
                    'limit': 3,
                    'categorySlug': None
                }
            )
            print(f"Added blog_cards section to page: {page.key}")
        else:
            print(f"Page {page.key} already has blog_cards section")

if __name__ == "__main__":
    from django.db import models
    
    print("Adding blog_cards sections to all pages...")
    add_blog_cards_section_to_all_pages()
    print("Done!")