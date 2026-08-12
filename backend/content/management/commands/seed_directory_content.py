from django.core.management.base import BaseCommand

from content.models import Page, Section
from listings.models import Category


class Command(BaseCommand):
    help = "Seed local country and city directory page content."

    CONTENT = {
        "country-de": {
            "title": "Businesses in Germany",
            "subtitle": "Explore local businesses and services across Germany.",
            "intro": "Browse Germany's public business directory and discover companies by city and category.",
            "hero_image": "/images/flags/de.png",
        },
        "country-be": {
            "title": "Businesses in Belgium",
            "subtitle": "Find local businesses and services across Belgium.",
            "intro": "Explore businesses throughout Belgium, from Antwerp and Brussels to cities across the country.",
            "hero_image": "/images/flags/be.png",
        },
        "city-antwerp": {
            "title": "Businesses in Antwerp",
            "subtitle": "Discover businesses, services and local companies in Antwerp.",
            "intro": "Browse Antwerp businesses on ListAcrossEU and find the local services you need.",
            "hero_image": "/images/flags/be.png",
        },
        "landing-list-your-business-free": {
            "title": "List Your Business for Free",
            "subtitle": "Create a free public business listing on ListAcrossEU.",
            "intro": "Add your business, help people find you across Europe, and keep your public listing free. Claim it later to manage the information shown to customers.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "List your business for free",
            "cta_href": "/en/list-your-business",
        },
        "landing-free-business-listing-belgium": {
            "title": "Free Business Listings in Belgium",
            "subtitle": "Browse Belgian businesses and add your own listing for free.",
            "intro": "Explore local businesses across Belgium, claim a listing you manage, and keep your business information available to people searching locally.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "List your business for free",
            "cta_href": "/en/list-your-business",
        },
        "landing-free-business-listing-antwerp": {
            "title": "Free Business Listings in Antwerp",
            "subtitle": "Discover Antwerp businesses and services on ListAcrossEU.",
            "intro": "Browse the current Antwerp directory and list your own business for free. Owners can claim and manage their listing through the normal verification flow.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "List your business for free",
            "cta_href": "/en/list-your-business",
        },
        "landing-free-business-listing-anderlecht": {
            "title": "Free Business Listings in Anderlecht",
            "subtitle": "Find local businesses in Anderlecht and add yours for free.",
            "intro": "Use the Anderlecht directory to discover local services. Businesses can create a free listing and claim it later to manage their public information.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "List your business for free",
            "cta_href": "/en/list-your-business",
        },
        "landing-generated-business-website": {
            "title": "ListAcrossEU Generated Website",
            "subtitle": "Turn a claimed business listing into a simple professional website.",
            "intro": "Start with a free listing, claim and manage it, then try a generated business website free for 30 days. It costs €9.95/month + VAT if you keep it after the trial. Custom domain options are coming next.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/pricing",
        },
        "landing-get-your-business-online-free": {
            "title": "Get Your Business Online Free",
            "subtitle": "Give customers a useful place to find your business without an upfront listing fee.",
            "intro": "Start with a factual ListAcrossEU business listing, then claim it when you are ready to manage the details. A free listing is a practical first step for a business that needs a discoverable online presence.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-get-your-small-business-online-fast": {
            "title": "Get Your Small Business Online Fast",
            "subtitle": "Set up a clear business presence in a few focused steps.",
            "intro": "Add your business to the directory, check the public information, and claim the listing if you manage it. When you want more than a directory entry, try the ListAcrossEU Generated Website free for 30 days.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-promote-your-business-for-free": {
            "title": "Promote Your Business for Free",
            "subtitle": "Help local customers discover what your business offers.",
            "intro": "A public directory listing can support your existing marketing by making your business name, description, location, country, and category easier to browse. Claim the listing to manage it yourself.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-advertise-your-business-online-free": {
            "title": "Advertise Your Business Online Free",
            "subtitle": "Create a factual directory presence before you decide on paid promotion.",
            "intro": "ListAcrossEU provides a free public listing route for businesses that want to be found by location and category. This is directory visibility, not a promise of rankings or guaranteed traffic. Claim your listing to keep it accurate.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-online-presence-for-small-business": {
            "title": "Free Online Presence for Small Business",
            "subtitle": "Start with a simple, useful business profile on ListAcrossEU.",
            "intro": "Small businesses can begin with a free public listing and add context through a short factual description, location, country, and category. Claiming gives the owner a way to manage the listing before trying a generated website.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-create-a-business-page-free": {
            "title": "Create a Business Page for Free",
            "subtitle": "Give your business a dedicated public page in the directory.",
            "intro": "Create a free listing so people can browse your business by country, city, and category. After claiming it, you can explore the ListAcrossEU Generated Website as a separate next step.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-put-your-business-online": {
            "title": "Put Your Business Online",
            "subtitle": "Make your business easier to discover in the places customers search.",
            "intro": "List your business free on ListAcrossEU, then claim it if you are the owner or manager. The directory is the starting point; the generated website is an optional next step for a claimed listing.",
            "hero_image": "/images/eu-map.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-brussels": {
            "title": "Free Business Listings in Brussels",
            "subtitle": "Browse real businesses and local services in Brussels.",
            "intro": "Explore the current Brussels directory on ListAcrossEU. Business owners can add a free listing and claim it later to manage the public information shown to visitors.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-ghent": {
            "title": "Free Business Listings in Ghent",
            "subtitle": "Find local businesses and services in Ghent.",
            "intro": "Browse real Ghent listings by name, description, location, and category where available. Add your own business free, then claim it if you manage the listing.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-liege": {
            "title": "Free Business Listings in Liège",
            "subtitle": "Explore local businesses and services in Liège.",
            "intro": "Use the Liège directory to discover real businesses currently available in the local data. Owners can create a free listing and claim it through the normal verification flow.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-charleroi": {
            "title": "Free Business Listings in Charleroi",
            "subtitle": "Browse businesses and services in Charleroi.",
            "intro": "Discover the current Charleroi listings on ListAcrossEU. If your business is not listed, you can add it free and claim it later to manage its public details.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-leuven": {
            "title": "Free Business Listings in Leuven",
            "subtitle": "Find Leuven businesses and services in one local directory.",
            "intro": "This Leuven landing page is ready for local directory data as City records become available. Add your business free, then claim it to manage the listing.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-mechelen": {
            "title": "Free Business Listings in Mechelen",
            "subtitle": "Discover Mechelen businesses and local services.",
            "intro": "Browse the Mechelen directory when local records are available. Businesses can start with a free listing and claim it later to keep their public information accurate.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-hasselt": {
            "title": "Free Business Listings in Hasselt",
            "subtitle": "Find local businesses and services in Hasselt.",
            "intro": "The Hasselt page uses live directory data when a matching City record is present. You can add a business free and claim it later through the normal owner flow.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
        "landing-free-business-listing-bruges": {
            "title": "Free Business Listings in Bruges",
            "subtitle": "Explore local businesses and services in Bruges.",
            "intro": "Use ListAcrossEU to browse Bruges businesses when local records are available. Owners can create a free listing, claim it, and then decide whether to try a generated website.",
            "hero_image": "/images/flags/be.png",
            "cta_label": "Try Your Generated Website Free",
            "cta_href": "/en/generated-business-website",
        },
    }

    def handle(self, *args, **options):
        for key, values in self.CONTENT.items():
            scope, slug = key.split("-", 1)
            page, _ = Page.objects.get_or_create(key=f"directory-{scope}-{slug}", defaults={"active": True})
            page.active = True
            page.save(update_fields=["active"])
            Section.objects.update_or_create(
                page=page,
                key="hero",
                defaults={
                    "type": "directory_hero",
                    "order": 1,
                    "active": True,
                    "title": values["title"],
                    "subtitle": values["subtitle"],
                    "body": values["intro"],
                    "cta_label": values.get("cta_label", ""),
                    "cta_href": values.get("cta_href", ""),
                    "settings": {
                        "scope": scope,
                        "slug": slug,
                        "hero_image": values["hero_image"],
                        "seo_title": values["title"],
                        "meta_description": values["intro"],
                        "related_links": [],
                    },
                },
            )
            self.stdout.write(self.style.SUCCESS(f"Seeded {scope} directory content: {slug}"))

        for category in Category.objects.all().iterator():
            page, _ = Page.objects.get_or_create(key=f"directory-category-{category.slug}", defaults={"active": True})
            page.active = True
            page.save(update_fields=["active"])
            Section.objects.update_or_create(
                page=page,
                key="hero",
                defaults={
                    "type": "directory_hero",
                    "order": 1,
                    "active": True,
                    "title": category.name,
                    "subtitle": f"Explore {category.name.lower()} businesses across Europe.",
                    "body": "Browse current directory listings by location and discover local businesses in this category.",
                    "settings": {"scope": "category", "slug": category.slug, "hero_image": "/images/eu-map.png"},
                },
            )
