import Link from 'next/link';
import { getBusinessCanonicalPath } from '@/lib/businessUrls';

export type DiscoveryBusiness = {
  id: number;
  name: string;
  slug: string;
  tier: 'free' | 'claimed' | 'premium';
  country: { name: string; slug: string };
  city: { name: string; slug: string } | null;
  town?: { name: string; slug: string } | null;
  category: { name: string; slug: string; is_public?: boolean } | null;
};

export type DiscoveryGroup = {
  key: string;
  title: string;
  items: DiscoveryBusiness[];
  viewAllHref?: string;
  viewAllLabel?: string;
};

export type BusinessDiscovery = {
  sameCategoryCity?: DiscoveryGroup;
  cityGroups: DiscoveryGroup[];
  sameCategoryCountry?: DiscoveryGroup;
  countryGroups: DiscoveryGroup[];
};

function DiscoveryCard({ business, lang }: { business: DiscoveryBusiness; lang: string }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <h3 className="font-semibold text-slate-900"><Link className="hover:text-blue-700 hover:underline" href={getBusinessCanonicalPath(business, lang)}>{business.name}</Link></h3>
    {business.category?.name && <p className="mt-2 text-sm text-blue-700">{business.category.name}</p>}
    {business.city?.name && <p className="mt-1 text-sm text-slate-600">{business.city.name}</p>}
  </article>;
}

function Group({ group, lang }: { group: DiscoveryGroup; lang: string }) {
  if (group.items.length === 0) return null;
  return <section aria-labelledby={`${group.key}-heading`}>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <h3 id={`${group.key}-heading`} className="text-xl font-semibold text-slate-900">{group.title}</h3>
      {group.viewAllHref && <Link href={group.viewAllHref} className="text-sm font-semibold text-blue-700 hover:underline">{group.viewAllLabel || 'View all'}</Link>}
    </div>
    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((item) => <DiscoveryCard key={item.id} business={item} lang={lang} />)}</div>
  </section>;
}

export default function BusinessDiscoverySections({ discovery, lang, cityName, citySlug, countryName, countrySlug }: { discovery: BusinessDiscovery; lang: string; cityName?: string; citySlug?: string; countryName: string; countrySlug: string }) {
  const groups = [discovery.sameCategoryCity, ...discovery.cityGroups, discovery.sameCategoryCountry, ...discovery.countryGroups].filter((group): group is DiscoveryGroup => Boolean(group?.items.length));
  if (groups.length === 0) return null;

  return <section className="mx-auto mt-0 max-w-5xl" aria-labelledby="business-discovery-heading">
    <h2 id="business-discovery-heading" className="text-2xl font-bold text-slate-950">Discover more businesses</h2>
    <div className="mt-6 space-y-6">
      {groups.map((group) => <div key={group.key} className="rounded-lg border-2 border-slate-400 bg-slate-50 p-4 sm:p-5"><Group group={group} lang={lang} /></div>)}
    </div>
    {cityName && citySlug && <Link href={`/${lang}/cities/${citySlug}`} className="mt-8 inline-flex text-sm font-semibold text-blue-700 hover:underline">Explore all businesses in {cityName}</Link>}
    {!cityName && <Link href={`/${lang}/countries/${countrySlug}`} className="mt-8 inline-flex text-sm font-semibold text-blue-700 hover:underline">Explore more businesses in {countryName}</Link>}
  </section>;
}
