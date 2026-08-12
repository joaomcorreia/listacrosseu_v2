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
            'list-your-business-free',
            'free-business-listing-belgium',
            'free-business-listing-antwerp',
            'free-business-listing-anderlecht',
            'generated-business-website',
            'get-your-business-online-free',
            'get-your-small-business-online-fast',
            'promote-your-business-for-free',
            'advertise-your-business-online-free',
            'free-online-presence-for-small-business',
            'create-a-business-page-free',
            'put-your-business-online',
            'free-business-listing-brussels',
            'free-business-listing-ghent',
            'free-business-listing-liege',
            'free-business-listing-charleroi',
            'free-business-listing-leuven',
            'free-business-listing-mechelen',
            'free-business-listing-hasselt',
            'free-business-listing-bruges',
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
            'list-your-business-free': '/en/list-your-business-free/',
            'free-business-listing-belgium': '/en/free-business-listing-belgium/',
            'free-business-listing-antwerp': '/en/free-business-listing-antwerp/',
            'free-business-listing-anderlecht': '/en/free-business-listing-anderlecht/',
            'generated-business-website': '/en/generated-business-website/',
            'get-your-business-online-free': '/en/get-your-business-online-free/',
            'get-your-small-business-online-fast': '/en/get-your-small-business-online-fast/',
            'promote-your-business-for-free': '/en/promote-your-business-for-free/',
            'advertise-your-business-online-free': '/en/advertise-your-business-online-free/',
            'free-online-presence-for-small-business': '/en/free-online-presence-for-small-business/',
            'create-a-business-page-free': '/en/create-a-business-page-free/',
            'put-your-business-online': '/en/put-your-business-online/',
            'free-business-listing-brussels': '/en/free-business-listing-brussels/',
            'free-business-listing-ghent': '/en/free-business-listing-ghent/',
            'free-business-listing-liege': '/en/free-business-listing-liege/',
            'free-business-listing-charleroi': '/en/free-business-listing-charleroi/',
            'free-business-listing-leuven': '/en/free-business-listing-leuven/',
            'free-business-listing-mechelen': '/en/free-business-listing-mechelen/',
            'free-business-listing-hasselt': '/en/free-business-listing-hasselt/',
            'free-business-listing-bruges': '/en/free-business-listing-bruges/',
        }
        return routes.get(item, f'/en/{item}/')


sitemaps = {
    'businesses': BusinessSitemap,
    'business-slugs': BusinessSlugSitemap,
    'static': StaticPageSitemap,
}
