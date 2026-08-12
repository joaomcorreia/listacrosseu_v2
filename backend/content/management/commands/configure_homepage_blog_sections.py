from django.core.management.base import BaseCommand

from content.models import Page, Section


class Command(BaseCommand):
    help = "Configure the three homepage blog sections to use distinct blog categories."

    def handle(self, *args, **options):
        page = Page.objects.get(key="home")
        sections = [
            ("blog_guides", "blog_cards", 8, "Latest EU Guides", "Practical guides for getting a business online.", "guides"),
            ("blog_insights", "blog_cards", 9, "Latest Insights", "Useful context for small businesses and local customers.", "insights"),
            ("blog_featured", "blog_featured", 10, "Featured Blog Posts", "In-depth ideas for building a useful business presence.", "featured"),
        ]
        for key, section_type, order, title, subtitle, category_key in sections:
            if category_key == "guides":
                slugs = ["how-to-list-your-business-online-for-free-in-europe", "how-to-claim-and-manage-your-business-listing", "getting-a-small-business-online-a-simple-checklist", "how-customers-find-local-businesses-online", "what-information-should-a-business-listing-include", "from-free-listing-to-your-own-business-website"]
            elif category_key == "insights":
                slugs = ["why-small-businesses-still-need-an-online-presence", "directory-listing-vs-business-website-whats-the-difference", "why-local-search-matters-for-small-businesses", "how-location-pages-help-customers-discover-businesses", "what-makes-a-business-page-useful-to-customers", "why-consistent-business-information-matters-online"]
            else:
                slugs = ["10-ways-to-make-your-small-business-easier-to-find-online", "how-a-generated-website-can-help-a-new-business-get-started", "free-business-listings-what-business-owners-should-know", "how-to-promote-a-local-business-without-a-large-advertising-budget", "building-trust-online-when-your-business-is-small", "five-things-customers-look-for-before-contacting-a-local-business"]
            section, _ = Section.objects.update_or_create(
                page=page,
                key=key,
                defaults={
                    "type": section_type,
                    "order": order,
                    "active": True,
                    "title": title,
                    "subtitle": subtitle,
                    "settings": {"category": category_key, "slugs": slugs, "limit": 6, "posts_count": 6, "show_carousel": True},
                },
            )
            self.stdout.write(f"Configured {section.key}")

        old_keys = ["blog_featured", "blog_cards"]
        Section.objects.filter(page=page, key__in=old_keys).exclude(key="blog_featured").update(active=False)
        self.stdout.write(self.style.SUCCESS("Homepage blog sections configured."))
