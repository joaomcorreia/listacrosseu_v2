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
            city__isnull=False
        )

    def location(self, obj):
        return obj.get_canonical_path()

    def lastmod(self, obj):
        return obj.created_at

    def changefreq(self, obj):
        return obj.get_sitemap_changefreq()

    def priority(self, obj):
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
    """Sitemap for important static and business-discovery pages."""
    changefreq = "monthly"
    priority = 0.8
    protocol = "https"

    def items(self):
        return [
            'home',
            'search',
            'list-business',
            'business-visibility',
            'ai-visibility',
            'promote-your-business-free',
            'get-found-online',
        ]

    def location(self, item):
        routes = {
            'home': '/en/',
            'search': '/en/search/',
            'list-business': '/en/list-your-business/',
            'business-visibility': '/en/business-visibility/',
            'ai-visibility': '/en/ai-visibility/',
            'promote-your-business-free': '/en/promote-your-business-free/',
            'get-found-online': '/en/get-found-online/',
        }
        return routes.get(item, f'/en/{item}/')


sitemaps = {
    'businesses': BusinessSitemap,
    'business-slugs': BusinessSlugSitemap,
    'static': StaticPageSitemap,
}
