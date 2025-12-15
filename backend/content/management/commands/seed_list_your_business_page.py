from django.core.management.base import BaseCommand
from content.models import Page, Section, SectionItem


class Command(BaseCommand):
    help = 'Seed the "List Your Business" conversion page with CMS content'

    def handle(self, *args, **options):
        # Create or get the page
        page, created = Page.objects.get_or_create(
            key='list-your-business',
            defaults={'active': True}
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created new page: {page.key}'))
        else:
            self.stdout.write(f'Found existing page: {page.key}')
            # Clear existing sections to avoid duplicates
            page.sections.all().delete()
            self.stdout.write('Cleared existing sections')

        # Section 1: Hero
        hero_section = Section.objects.create(
            page=page,
            key='hero',
            type='hero',
            order=1,
            title='Get Your Business Discovered Across Europe',
            subtitle='ListAcrossEU helps small and micro businesses get found by customers searching by country, city, and category.',
            cta_label='List your business (free)',
            cta_href='/en/signup',  # TODO: Make locale-safe
            cta_secondary_label='See how it works',
            cta_secondary_href='#how-it-works',
            settings={'variant': 'heroGradient'}
        )

        # Section 2: Problem/Solution
        problem_section = Section.objects.create(
            page=page,
            key='problem_solution',
            type='problem_solution',
            order=2,
            title='Why most small businesses stay invisible online',
            body="""Your business doesn't show up outside your local area.

Large platforms prioritize ads over quality businesses.

Customers can't easily discover businesses by city and category.

Keeping multiple directories updated is time-consuming."""
        )

        # Section 3: Benefits
        benefits_section = Section.objects.create(
            page=page,
            key='benefits',
            type='benefits',
            order=3,
            title='What you get when you list your business'
        )

        # Benefits items
        benefits_items = [
            {
                'title': 'Local & European visibility',
                'subtitle': 'Appear on country, city, and category pages across Europe.',
                'icon': '🌍',
                'order': 1
            },
            {
                'title': 'Be found by intent-based searches',
                'subtitle': 'Customers search by location and service — not ads.',
                'icon': '🎯', 
                'order': 2
            },
            {
                'title': 'A clean business profile',
                'subtitle': 'One place for your description, website, contact info, and services.',
                'icon': '📋',
                'order': 3
            },
            {
                'title': 'Free to get started',
                'subtitle': 'Create your listing at no cost. Upgrade later if you want more visibility.',
                'icon': '🆓',
                'order': 4
            }
        ]

        for item_data in benefits_items:
            SectionItem.objects.create(section=benefits_section, **item_data)

        # Section 4: How it works
        how_it_works_section = Section.objects.create(
            page=page,
            key='how_it_works',
            type='how_it_works',
            order=4,
            title='How it works',
            settings={'anchor': 'how-it-works'}
        )

        # How it works steps
        steps = [
            {
                'title': 'Create your account',
                'subtitle': 'Sign up in less than a minute.',
                'badge': '1',
                'order': 1
            },
            {
                'title': 'Add or claim your business',
                'subtitle': 'We\'ll guide you through the details.',
                'badge': '2',
                'order': 2
            },
            {
                'title': 'Get published',
                'subtitle': 'Your business appears once approved.',
                'badge': '3',
                'order': 3
            },
            {
                'title': 'Improve visibility',
                'subtitle': 'Reach customers searching for businesses like yours.',
                'badge': '4',
                'order': 4
            }
        ]

        for step in steps:
            SectionItem.objects.create(section=how_it_works_section, **step)

        # Section 5: Trust/GDPR
        trust_section = Section.objects.create(
            page=page,
            key='trust_gdpr',
            type='trust_gdpr',
            order=5,
            title='Built for real businesses, not spam',
            body="""Listings are reviewed to keep quality high.

We don't sell your personal data.

We collect only what's needed to run the service and improve listings.

You can request export or deletion of your data.

Clear, transparent rules — no pay-to-play rankings.

GDPR-friendly approach by design."""
        )

        # Section 6: Who it's for
        who_its_for_section = Section.objects.create(
            page=page,
            key='who_its_for',
            type='who_its_for',
            order=6,
            title='Who should list on ListAcrossEU?'
        )

        # Good fit items
        good_fit_items = [
            {
                'title': 'Local services',
                'subtitle': 'Plumbers, electricians, consultants, freelancers',
                'meta': {'group': 'Good fit'},
                'order': 1
            },
            {
                'title': 'Restaurants & cafés',
                'subtitle': 'Independent eateries, family restaurants, specialty food',
                'meta': {'group': 'Good fit'},
                'order': 2
            },
            {
                'title': 'Professionals',
                'subtitle': 'Lawyers, doctors, accountants, coaches, agencies',
                'meta': {'group': 'Good fit'},
                'order': 3
            },
            {
                'title': 'Small shops',
                'subtitle': 'Boutiques, specialty stores, local retailers',
                'meta': {'group': 'Good fit'},
                'order': 4
            }
        ]

        # Not a fit items
        not_fit_items = [
            {
                'title': 'Large chains',
                'subtitle': 'Multi-national corporations with 100+ locations',
                'meta': {'group': 'Not a fit (yet)'},
                'order': 5
            },
            {
                'title': 'Spam/lead farms',
                'subtitle': 'Fake businesses, misleading listings, lead generation scams',
                'meta': {'group': 'Not a fit (yet)'},
                'order': 6
            },
            {
                'title': 'Low-quality duplicates',
                'subtitle': 'Multiple listings for the same business or location',
                'meta': {'group': 'Not a fit (yet)'},
                'order': 7
            }
        ]

        for item in good_fit_items + not_fit_items:
            SectionItem.objects.create(section=who_its_for_section, **item)

        # Section 7: Future features
        future_section = Section.objects.create(
            page=page,
            key='future_features',
            type='future_features',
            order=7,
            title='What\'s coming next',
            body='Join early and help shape the platform.'
        )

        # Future features
        features = [
            {
                'title': 'Verified badges',
                'subtitle': 'Official verification for established businesses',
                'order': 1
            },
            {
                'title': 'Featured listings',
                'subtitle': 'Premium placement for quality businesses',
                'order': 2
            },
            {
                'title': 'Business dashboard',
                'subtitle': 'Analytics and insights for your listing performance',
                'order': 3
            },
            {
                'title': 'Category highlights',
                'subtitle': 'Special features for industry leaders',
                'order': 4
            },
            {
                'title': 'Local visibility tools',
                'subtitle': 'Advanced tools to reach nearby customers',
                'order': 5
            }
        ]

        for feature in features:
            SectionItem.objects.create(section=future_section, **feature)

        # Section 8: Final CTA
        final_cta_section = Section.objects.create(
            page=page,
            key='final_cta',
            type='final_cta',
            order=8,
            title='Ready to be discovered?',
            subtitle='Join early and get listed across Europe.',
            cta_label='List your business now',
            cta_href='/en/signup',  # TODO: Make locale-safe
            cta_secondary_label='Contact us',
            cta_secondary_href='/en/contact'  # TODO: Check if route exists
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded page "{page.key}" with {page.sections.count()} sections'
            )
        )