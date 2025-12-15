from django.core.management.base import BaseCommand
from content.models import Page, Section


class Command(BaseCommand):
    help = 'Add mixed, claimed, and premium listing sections to all CMS pages'
    
    def handle(self, *args, **options):
        # Get all pages
        pages = Page.objects.all()
        
        if not pages.exists():
            self.stdout.write(
                self.style.WARNING("No pages found in the system. Create pages first.")
            )
            return
            
        sections_added = 0
        
        for page in pages:
            # Define the three new listing sections
            new_sections = [
                {
                    'key': 'mixed_listings',
                    'type': 'listings_mixed',
                    'title': 'Businesses',
                    'order': 50,  # Place after hero/main content, before footer
                    'active': True,
                    'settings': {
                        'source': 'auto',
                        'limit': 24,
                        'layout': 'columns',
                        'columns': 3,
                        'includeTiers': ['free', 'claimed', 'premium']
                    }
                },
                {
                    'key': 'claimed_listings',
                    'type': 'listings_claimed', 
                    'title': 'Claimed Businesses',
                    'order': 60,
                    'active': True,
                    'settings': {
                        'source': 'manual',
                        'limit': 6,
                        'layout': 'grid',
                        'columns': 3
                    }
                },
                {
                    'key': 'premium_listings',
                    'type': 'listings_premium',
                    'title': 'Premium Businesses', 
                    'order': 65,
                    'active': True,
                    'settings': {
                        'source': 'manual',
                        'limit': 6,
                        'layout': 'grid',
                        'columns': 3
                    }
                }
            ]
            
            for section_data in new_sections:
                section, created = Section.objects.get_or_create(
                    page=page,
                    key=section_data['key'],
                    defaults={
                        'type': section_data['type'],
                        'title': section_data['title'],
                        'order': section_data['order'],
                        'active': section_data['active'],
                        'settings': section_data['settings']
                    }
                )
                
                if created:
                    sections_added += 1
                    self.stdout.write(f"✓ Added {section_data['key']} to page {page.key}")
                else:
                    self.stdout.write(f"- Page {page.key} already has {section_data['key']} section")
        
        self.stdout.write(
            self.style.SUCCESS(f"\nCompleted! Added {sections_added} new listing sections across {pages.count()} pages.")
        )