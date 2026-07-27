from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from listings.models import Business


class BusinessSitemap(Sitemap):
    """
    Sitemap for business detail pages with tier-based priorities.
    
    Only includes canonical URLs (location-first format).
    Premium businesses get highest priority and weekly updates.
    """
    changefreq = "monthly"
    priority = 0.5
    protocol = "https"

    def items(self):
        """Return all businesses with city and country for URL generation."""
        return Business.objects.select_related('city', 'country').filter(
            city__isnull=False  # Only include businesses with cities for canonical URLs
        )

    def location(self, obj):
        """Return the canonical location-first URL for the business."""
        # Use the model's canonical path helper
        return obj.get_canonical_path()

    def lastmod(self, obj):
        """Return last modification date."""
        return obj.created_at

    def changefreq(self, obj):
        """Return change frequency based on tier."""
        return obj.get_sitemap_changefreq()

    def priority(self, obj):
        """Return priority based on tier."""
        return obj.get_sitemap_priority()


class BusinessSlugSitemap(Sitemap):
    """
    Sitemap for /{lang}/business/{slug} URLs.
    Uses English locale by default.
    """
    changefreq = "monthly"
    priority = 0.4
    protocol = "https"

    def items(self):
        return Business.objects.all()

    def location(self, obj):
        return f"/en/business/{obj.slug}"

    def lastmod(self, obj):
        return obj.created_at


class StaticPageSitemap(Sitemap):
    """Sitemap for static pages."""
    changefreq = "monthly"
    priority = 0.8
    protocol = "https"

    def items(self):
        return ['home', 'search', 'list-business']

    def location(self, item):
        # Default to English for static pages
        if item == 'home':
            return '/en/'
        elif item == 'search':
            return '/en/search/'
        elif item == 'list-business':
            return '/en/list-your-business/'
        return f'/en/{item}/'


# Sitemap index configuration
sitemaps = {
    'businesses': BusinessSitemap,
    'business-slugs': BusinessSlugSitemap,
    'static': StaticPageSitemap,
}
