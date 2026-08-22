"""Shared indexability rules for public directory landing pages."""

COUNTRY_CATEGORY_INDEXABLE_MIN_LISTINGS = 5


def is_country_category_indexable(listing_count: int) -> bool:
    return listing_count >= COUNTRY_CATEGORY_INDEXABLE_MIN_LISTINGS
