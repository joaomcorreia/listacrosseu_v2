from django.contrib.sitemaps import Sitemap
from django.db.models import Count
from django.urls import reverse
from django.utils import timezone
from listings.models import Business
from listings.directory_indexability import COUNTRY_CATEGORY_INDEXABLE_MIN_LISTINGS
from blog.models import BlogPostTranslation
from listings.public_querysets import public_businesses


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
        return public_businesses().select_related('city', 'country').filter(
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
        return public_businesses()

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


class CountryCategorySitemap(Sitemap):
    """Useful country/category combinations backed by real listings."""

    changefreq = "monthly"
    priority = 0.6
    protocol = "https"

    def items(self):
        return (
            public_businesses()
            .filter(country__isnull=False, category__isnull=False, category__is_public=True)
            .values("country__slug", "category__slug")
            .annotate(listing_count=Count("id", distinct=True))
            .filter(listing_count__gte=COUNTRY_CATEGORY_INDEXABLE_MIN_LISTINGS)
            .order_by("country__slug", "category__slug")
        )

    def location(self, item):
        return f"/en/countries/{item['country__slug']}/categories/{item['category__slug']}"


class BlogSitemap(Sitemap):
    """Published blog translations with their language-specific public URLs."""

    changefreq = "monthly"
    priority = 0.7
    protocol = "https"

    def items(self):
        return BlogPostTranslation.objects.filter(
            is_published=True,
            post__status="published",
        ).select_related("post")

    def location(self, item):
        return f"/{item.language}/blog/{item.slug}"

    def lastmod(self, item):
        return item.updated_at


class GeneratedWebsiteSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.5
    protocol = "https"

    def items(self):
        items = []
        now = timezone.now()
        for business in Business.objects.filter(tier="claimed").only("id", "premium_sidebar"):
            website = (business.premium_sidebar or {}).get("_website")
            snapshot = website.get("published_snapshot") if isinstance(website, dict) else None
            trial = website.get("trial", {}) if isinstance(website, dict) else {}
            ends_at = trial.get("ends_at")
            if not isinstance(snapshot, dict) or not website.get("published", True) or trial.get("status") not in {"trial", "active"} or not snapshot.get("website_slug"):
                continue
            if ends_at:
                try:
                    expires = timezone.datetime.fromisoformat(str(ends_at).replace("Z", "+00:00"))
                    if timezone.is_naive(expires):
                        expires = timezone.make_aware(expires)
                    if now >= expires:
                        continue
                except (TypeError, ValueError):
                    continue
            items.append(business)
        return items

    def location(self, item):
        website = (item.premium_sidebar or {}).get("_website", {})
        return f"/en/generated/{website['published_snapshot']['website_slug']}"

    def lastmod(self, item):
        website = (item.premium_sidebar or {}).get("_website", {})
        published_at = website.get("published_at")
        return timezone.datetime.fromisoformat(str(published_at).replace("Z", "+00:00")) if published_at else item.updated_at


sitemaps = {
    'businesses': BusinessSitemap,
    'business-slugs': BusinessSlugSitemap,
    'static': StaticPageSitemap,
    'country-categories': CountryCategorySitemap,
    'blogs': BlogSitemap,
    'generated-websites': GeneratedWebsiteSitemap,
}
