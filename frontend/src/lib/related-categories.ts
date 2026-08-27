type CategoryRelationship = {
  aliases: string[];
  related: string[];
  broader: string[];
};

const relationships: Record<string, CategoryRelationship> = {
  'website-design': {
    aliases: ['web-design'],
    related: ['web-development', 'digital-agency', 'it-services', 'digital-marketing'],
    broader: ['business-consultants'],
  },
  restaurant: {
    aliases: ['restaurants'],
    related: ['cafe', 'fast-food', 'catering', 'bakery'],
    broader: ['food-beverage'],
  },
  barber: {
    aliases: ['barbers'],
    related: ['hair-salon', 'beauty-salon', 'grooming'],
    broader: [],
  },
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getRecommendationCategoryCandidates(category: { slug?: string | null; name?: string | null } | null | undefined) {
  const key = normalize(category?.slug || category?.name || '');
  const relationshipEntry = Object.entries(relationships).find(([canonical, relationship]) => (
    canonical === key || relationship.aliases.includes(key)
  ));
  const canonicalKey = relationshipEntry?.[0];
  const relationship = relationshipEntry?.[1];
  const equivalentCategories = canonicalKey && canonicalKey !== key
    ? [canonicalKey]
    : (relationship?.aliases || []);
  return Array.from(new Set([
    key,
    ...equivalentCategories,
    ...(relationship?.related || []),
    ...(relationship?.broader || []),
  ].filter(Boolean)));
}
