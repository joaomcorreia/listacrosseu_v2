"""Shared query filters for public directory surfaces."""

from listings.models import Business, Category


def public_businesses(queryset=None):
    """Return listings explicitly published for public directory use."""
    return (queryset or Business.objects).filter(is_published=True)


def public_categories(queryset=None):
    """Return categories explicitly published for public directory use."""
    return (queryset or Category.objects).filter(is_public=True).exclude(slug="uncategorized")
