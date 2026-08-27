import { GENERATED_WEBSITE_PRODUCT } from '@/lib/product-config';

export type SidebarContext = {
  citySlug?: string;
  countrySlug?: string;
  categorySlug?: string;
};

export type SidebarContent = {
  heading: string;
  body: string;
  links: Array<[string, string]>;
};

const GLOBAL: SidebarContent = {
  heading: 'Explore ListAcrossEU',
  body: 'Browse businesses, list your own for free, and explore the generated website option after claiming a listing.',
  links: [
    ['List Your Business Free', '/list-your-business'],
    [GENERATED_WEBSITE_PRODUCT.cta, '/pricing'],
    ['Pricing', '/pricing'],
    ['Browse businesses', '/search'],
  ],
};

const OVERRIDES: Record<string, Partial<SidebarContent>> = {
  'city-antwerp': { heading: 'Antwerp businesses', body: 'Browse the Antwerp directory and add your own local business free.', links: [['Antwerp businesses', '/cities/antwerp']] },
};

export function resolveSidebarContent(context: SidebarContext = {}): SidebarContent {
  const keys = [
    context.citySlug && `city-${context.citySlug}`,
    context.countrySlug && `country-${context.countrySlug}`,
    context.categorySlug && `category-${context.categorySlug}`,
  ].filter(Boolean) as string[];
  const override = keys.map((key) => OVERRIDES[key]).find(Boolean);
  return { ...GLOBAL, ...override, links: [...(override?.links || []), ...GLOBAL.links.filter(([label]) => !(override?.links || []).some(([overrideLabel]) => overrideLabel === label))] };
}
