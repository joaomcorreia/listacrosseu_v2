import type { BusinessDetail } from '@/lib/api';
import { INTERNAL_BACKEND_URL } from '@/lib/env.server';
import { isPublicCategory } from '@/lib/public-categories';
import type { BusinessDiscovery, DiscoveryBusiness, DiscoveryGroup } from '@/components/business/BusinessDiscoverySections';

const CITY_CATEGORY_LIMIT = 14;
const CITY_INVENTORY_LIMIT = 60;
const COUNTRY_CATEGORY_LIMIT = 100;
const COUNTRY_INVENTORY_LIMIT = 60;

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

function groupByCategory(items: DiscoveryBusiness[], prefix: string, minimum = 2) {
  const groups = new Map<string, DiscoveryBusiness[]>();
  items.forEach((item) => {
    const category = item.category;
    if (!category) return;
    const current = groups.get(category.slug) || [];
    current.push(item);
    groups.set(category.slug, current);
  });
  return Array.from(groups.values())
    .filter((group) => group.length >= minimum)
    .map((items) => ({ key: `${prefix}-${items[0].category?.slug}`, title: items[0].category?.name || 'Businesses', items: items.slice(0, 4) }))
    .sort((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title));
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
  const countrySlug = business.country?.slug;
  const categorySlug = business.category?.slug;
  if (!countrySlug) return { cityGroups: [], countryGroups: [] };

  const [cityCategoryResults, cityResults, countryCategoryResults, countryResults] = await Promise.all([
    citySlug && categorySlug ? fetchResults({ city: citySlug, category: categorySlug }, CITY_CATEGORY_LIMIT) : Promise.resolve([]),
    citySlug ? fetchResults({ city: citySlug }, CITY_INVENTORY_LIMIT) : Promise.resolve([]),
    categorySlug ? fetchResults({ country: countrySlug, category: categorySlug }, COUNTRY_CATEGORY_LIMIT) : Promise.resolve([]),
    fetchResults({ country: countrySlug }, COUNTRY_INVENTORY_LIMIT),
  ]);

  const seen = new Set<number>([business.id]);
  const sameCategoryCityCandidates = unique(cityCategoryResults, business, new Set(seen));
  const sameCategoryCityItems = sameCategoryCityCandidates.slice(0, 12);
  const sameCategoryCity: DiscoveryGroup | undefined = sameCategoryCityItems.length >= 2 && business.category && business.city ? {
    key: 'same-category-city',
    title: `More ${business.category.name} in ${business.city.name}`,
    items: sameCategoryCityItems,
  } : undefined;
  if (sameCategoryCity) sameCategoryCity.items.forEach((item) => seen.add(item.id));

  const cityGroups = groupByCategory(unique(cityResults, business, seen), 'same-city').slice(0, 4);
  cityGroups.forEach((group) => group.items.forEach((item) => seen.add(item.id)));
  const sameCategoryCountryCandidates = unique(countryCategoryResults, business, new Set(seen)).filter((item) => item.city?.slug !== citySlug);
  const sameCategoryCountryItems = sameCategoryCountryCandidates.slice(0, 12);
  const sameCategoryCountry: DiscoveryGroup | undefined = sameCategoryCountryItems.length >= 2 && business.category && business.country ? {
    key: 'same-category-country',
    title: `More ${business.category.name} in ${business.country.name}`,
    items: sameCategoryCountryItems,
    viewAllHref: `/${lang}/countries/${business.country.slug}/categories/${business.category.slug}`,
    viewAllLabel: `View all ${business.category.name} in ${business.country.name}`,
  } : undefined;
  if (sameCategoryCountry) sameCategoryCountry.items.forEach((item) => seen.add(item.id));

  const countryGroups = groupByCategory(unique(countryResults, business, seen), 'same-country').slice(0, 3);
  return { sameCategoryCity, cityGroups, sameCategoryCountry, countryGroups };
}
