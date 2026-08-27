import type { BusinessDetail } from '@/lib/api';
import { INTERNAL_BACKEND_URL } from '@/lib/env.server';
import { isPublicCategory } from '@/lib/public-categories';
import { getRecommendationCategoryCandidates } from '@/lib/related-categories';
import type { BusinessDiscovery, DiscoveryBusiness, DiscoveryGroup } from '@/components/business/BusinessDiscoverySections';

const RECOMMENDATION_LIMIT = 8;

function isEligible(item: DiscoveryBusiness, business: BusinessDetail) {
  return item.id !== business.id && Boolean(item.city?.slug) && isPublicCategory(item.category || {});
}

function unique(items: DiscoveryBusiness[], business: BusinessDetail, seen = new Set<number>()) {
  return items.filter((item) => {
    if (!isEligible(item, business) || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function fetchResults(params: Record<string, string>, limit: number): Promise<DiscoveryBusiness[]> {
  const searchParams = new URLSearchParams({ ...params, limit: String(limit), offset: '0' });
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/listings/businesses/search/?${searchParams.toString()}`, { next: { revalidate: 300 }, headers: { Accept: 'application/json' } });
    if (!response.ok) return [];
    const data = await response.json() as { results?: DiscoveryBusiness[] };
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

export async function fetchBusinessDiscovery(business: BusinessDetail, lang = 'en'): Promise<BusinessDiscovery> {
  const citySlug = business.city?.slug;
  const townSlug = business.town?.slug;
  const countrySlug = business.country?.slug;
  const categoryCandidates = getRecommendationCategoryCandidates(business.category);
  if (!countrySlug) return { cityGroups: [], countryGroups: [] };

  const seen = new Set<number>([business.id]);
  const groups: DiscoveryGroup[] = [];

  async function loadLevel(filters: Record<string, string>) {
    if (!categoryCandidates.length) return [];
    const responses = await Promise.all(categoryCandidates.map((category) => fetchResults({ ...filters, category }, RECOMMENDATION_LIMIT)));
    const levelSeen = new Set<number>();
    return responses.flatMap((response) => response).filter((item) => {
      if (levelSeen.has(item.id)) return false;
      levelSeen.add(item.id);
      return true;
    }).slice(0, RECOMMENDATION_LIMIT);
  }

  function addGroup(key: string, title: string, items: DiscoveryBusiness[], viewAllHref?: string, viewAllLabel?: string) {
    const uniqueItems = unique(items, business, seen);
    if (uniqueItems.length === 0) return;
    uniqueItems.forEach((item) => seen.add(item.id));
    groups.push({ key, title, items: uniqueItems, viewAllHref, viewAllLabel });
  }

  if (townSlug) {
    addGroup('same-town', `Similar businesses in ${business.town?.name || 'this area'}`, await loadLevel({ country: countrySlug, city: citySlug || '', town: townSlug }));
  }
  if (citySlug) {
    addGroup('same-city', `Similar businesses in ${business.city?.name || 'this city'}`, await loadLevel({ country: countrySlug, city: citySlug }));
  }
  addGroup('same-country', `More ${business.category?.name || 'similar'} businesses in ${business.country.name}`, await loadLevel({ country: countrySlug }), `/${lang}/countries/${business.country.slug}${business.category?.slug ? `/categories/${business.category.slug}` : ''}`, business.category ? `View all ${business.category.name} in ${business.country.name}` : undefined);
  addGroup('europe', 'Explore similar businesses across Europe', await loadLevel({}));

  const sameCategoryCity = groups.find((group) => group.key === 'same-city');
  const sameCategoryCountry = groups.find((group) => group.key === 'same-country');
  const cityGroups = groups.filter((group) => group.key === 'same-town');
  const countryGroups = groups.filter((group) => group.key === 'europe');
  return { sameCategoryCity, cityGroups, sameCategoryCountry, countryGroups };
}
