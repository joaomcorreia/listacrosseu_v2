"""Rules shared by public category discovery and SEO surfaces."""

PUBLIC_CATEGORY_EXCLUDED_SLUGS = frozenset({"uncategorized"})

from listings.public_querysets import public_categories
