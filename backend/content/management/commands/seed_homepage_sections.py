from django.core.management.base import BaseCommand
from content.models import Page, Section, SectionItem


class Command(BaseCommand):
    help = 'Seeds the homepage with initial sections that match current layout'

    def handle(self, *args, **options):
        # Create or get the home page
        page, created = Page.objects.get_or_create(
            key='home',
            defaults={'active': True}
        )
        
        if created:
            self.stdout.write('Created home page')
        else:
            self.stdout.write('Home page already exists')
        
        # Clear existing sections if any
        page.sections.all().delete()
        
        # Create sections that match current homepage layout
        sections_data = [
            {
                'key': 'hero_main',
                'type': 'hero',
                'order': 1,
                'title': 'Find European Businesses',
                'subtitle': 'Discover thousands of businesses across Europe. Connect with local companies, explore market opportunities, and grow your network.',
                'cta_label': 'Explore Countries',
                'cta_href': '/countries',
                'cta_secondary_label': 'Browse Categories',
                'cta_secondary_href': '/categories',
                'settings': {
                    'show_snow': False,
                    'snow_intensity': 'medium'
                }
            },
            {
                'key': 'categories_grid',
                'type': 'category_grid', 
                'order': 2,
                'title': 'Popular Categories',
                'subtitle': 'Explore businesses by category across Europe',
                'settings': {
                    'columns': 5,
                    'auto_cycle': True
                }
            },
            {
                'key': 'cta_primary',
                'type': 'cta_band',
                'order': 3,
                'title': 'Ready to Expand Your Business Network?',
                'subtitle': 'Join thousands of businesses connecting across Europe',
                'cta_label': 'Get Started Today',
                'cta_href': '/countries',
                'cta_secondary_label': 'Learn More',
                'cta_secondary_href': '/about',
                'settings': {
                    'style': 'gradient',
                    'background_color': 'blue'
                }
            },
            {
                'key': 'country_explorer',
                'type': 'country_grid',
                'order': 4,
                'title': 'Explore European Markets',
                'subtitle': 'Discover business opportunities across Europe',
                'settings': {
                    'auto_cycle': True,
                    'cycle_interval': 3000,
                    'show_categories': True
                }
            },
            {
                'key': 'cities_interactive',
                'type': 'market_columns',
                'order': 5,
                'title': 'Top Cities by Business Activity',
                'subtitle': 'Explore the most active business hubs across Europe',
                'settings': {
                    'layout': 'three_columns',
                    'show_counts': True
                }
            },
            {
                'key': 'why_choose',
                'type': 'feature_cards',
                'order': 6,
                'title': 'Why Choose ListAcrossEU',
                'subtitle': 'Your gateway to European business opportunities',
                'settings': {
                    'layout': 'grid',
                    'columns': 3
                }
            },
            {
                'key': 'cta_secondary', 
                'type': 'cta_band',
                'order': 7,
                'title': 'Start Your European Business Journey',
                'subtitle': 'Discover new markets, connect with local businesses, and expand your reach',
                'cta_label': 'Browse All Countries',
                'cta_href': '/countries',
                'cta_secondary_label': 'View Categories',
                'cta_secondary_href': '/categories',
                'settings': {
                    'style': 'minimal',
                    'background_color': 'gray'
                }
            },
            {
                'key': 'blog_featured',
                'type': 'blog_featured',
                'order': 8,
                'title': 'Latest Insights',
                'subtitle': 'Stay updated with European business trends and opportunities',
                'cta_label': 'Read All Articles',
                'cta_href': '/blog',
                'settings': {
                    'posts_count': 6,
                    'category': 'insights',
                    'show_carousel': True
                }
            }
        ]
        
        # Create sections
        for section_data in sections_data:
            section = Section.objects.create(
                page=page,
                **section_data
            )
            self.stdout.write(f'Created section: {section.key}')
        
        # Create section items for why_choose section
        why_choose_section = page.sections.get(key='why_choose')
        features_data = [
            {
                'order': 1,
                'title': 'Comprehensive Database',
                'subtitle': 'Access thousands of verified businesses across 27+ European countries',
                'icon': 'database',
                'meta': {'highlight': True}
            },
            {
                'order': 2,
                'title': 'Real-time Updates',
                'subtitle': 'Get the latest business information and market insights',
                'icon': 'refresh',
                'meta': {'highlight': True}
            },
            {
                'order': 3,
                'title': 'Easy Integration',
                'subtitle': 'Simple API access for seamless integration with your systems',
                'icon': 'plug',
                'meta': {'highlight': True}
            }
        ]
        
        for feature_data in features_data:
            SectionItem.objects.create(
                section=why_choose_section,
                **feature_data
            )
            self.stdout.write(f'Created feature: {feature_data["title"]}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded homepage with {len(sections_data)} sections'
            )
        )
