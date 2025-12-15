from django.core.management.base import BaseCommand
from django.db import models
from content.models import Page, Section


class Command(BaseCommand):
    help = 'Add blog_cards section to all existing pages (idempotent)'

    def handle(self, *args, **options):
        pages = Page.objects.all()
        added_count = 0
        
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
                added_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Added blog_cards section to page: {page.key}")
                )
            else:
                self.stdout.write(f"Page {page.key} already has blog_cards section")
        
        if added_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f"Successfully added {added_count} blog_cards sections")
            )
        else:
            self.stdout.write("All pages already have blog_cards sections")