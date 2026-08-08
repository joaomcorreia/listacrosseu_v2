'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Briefcase, Building2, Car, CircleHelp, FileText, HeartPulse, Scissors, Sparkles, Store, Truck, Utensils, Wrench } from 'lucide-react';
import type { BusinessDetail } from '@/lib/api';
import ClaimBusinessModal from '@/components/ClaimBusinessModal';
import InnerPageHero from '@/components/InnerPageHero';
import BlogPostsSlider from '@/components/blog/BlogPostsSlider';
import { getBusinessCanonicalPath } from '@/lib/businessUrls';
import { ListingAdsBlock } from './ListingAdsBlock';

export type RelatedBusiness = {
  id: number; name: string; slug: string; tier: 'free' | 'claimed' | 'premium';
  country: { name: string; slug: string }; city: { name: string; slug: string } | null;
  town?: { name: string; slug: string } | null; category: { name: string; slug: string } | null;
  address?: string; address_line1?: string; phone?: string; website?: string; description?: string;
};

type Props = { business: BusinessDetail; relatedBusinesses: RelatedBusiness[]; relatedHeading?: string; lang: string };

const ACCENTS = [
  ['border-blue-300', 'bg-blue-100 text-blue-700', 'bg-blue-50 text-blue-800'], ['border-emerald-300', 'bg-emerald-100 text-emerald-700', 'bg-emerald-50 text-emerald-800'],
  ['border-orange-300', 'bg-orange-100 text-orange-700', 'bg-orange-50 text-orange-800'], ['border-violet-300', 'bg-violet-100 text-violet-700', 'bg-violet-50 text-violet-800'],
  ['border-teal-300', 'bg-teal-100 text-teal-700', 'bg-teal-50 text-teal-800'], ['border-rose-300', 'bg-rose-100 text-rose-700', 'bg-rose-50 text-rose-800'],
  ['border-amber-300', 'bg-amber-100 text-amber-700', 'bg-amber-50 text-amber-800'],
] as const;

function getAccent(business: BusinessDetail) {
  const hash = Array.from(`${business.id}-${business.slug}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ACCENTS[hash % ACCENTS.length];
}

function CategoryIcon({ category }: { category?: string | null }) {
  const value = (category || '').toLowerCase();
  const Icon = value.match(/restaurant|cafe|coffee|food|bar/) ? Utensils : value.match(/garage|car|auto|mechanic/) ? Car : value.match(/beauty|salon|hair|spa/) ? Scissors : value.match(/clean/) ? Sparkles : value.match(/construction|building|architect/) ? Building2 : value.match(/plumb|water|heating|electric/) ? Wrench : value.match(/employment|job|recruit|career|professional/) ? Briefcase : value.match(/shop|retail|store/) ? Store : value.match(/moving|transport|logistic/) ? Truck : value.match(/health|medical|doctor|clinic/) ? HeartPulse : value.match(/legal|account|consult|service/) ? FileText : CircleHelp;
  return <Icon className="h-8 w-8" aria-hidden="true" />;
}

function RelatedCard({ business, lang }: { business: RelatedBusiness; lang: string }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-900"><Link className="hover:text-blue-700 hover:underline" href={getBusinessCanonicalPath(business, lang)}>{business.name}</Link></h3><span className="shrink-0 text-xs font-medium capitalize text-slate-500">{business.tier}</span></div>
    {business.category?.name && <p className="mt-2 text-sm text-blue-700">{business.category.name}</p>}
    {business.city?.name && <p className="mt-1 text-sm text-slate-600">{business.city.name}</p>}
  </article>;
}

export function FreeBusinessDetailPage({ business, relatedBusinesses, relatedHeading, lang }: Props) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [border, icon, badge] = getAccent(business);
  const categoryName = business.category?.name || 'Business';
  const locationParts = [business.city?.name, business.country?.name].filter(Boolean);
  const grouped = relatedBusinesses.reduce<Record<string, RelatedBusiness[]>>((groups, item) => { const key = item.category?.name || 'Other businesses'; (groups[key] ||= []).push(item); return groups; }, {});
  const usefulGroups = Object.entries(grouped).filter(([, items]) => items.length >= 2).slice(0, 3);
  const showGroups = usefulGroups.length >= 2;
  const breadcrumbs = [
    { label: 'Home', href: `/${lang}` }, { label: 'Countries', href: `/${lang}/countries` },
    ...(business.country ? [{ label: business.country.name, href: `/${lang}/countries/${business.country.slug}` }] : []),
    ...(business.city ? [{ label: business.city.name, href: `/${lang}/cities/${business.city.slug}` }] : []), { label: business.name },
  ];

  return <div className="min-h-screen bg-white">
    <InnerPageHero variant="medium" title={business.city?.name || business.country?.name || 'Europe'} eyebrow="Local business directory" description={[business.country?.name, categoryName].filter(Boolean).join(' · ')} breadcrumbs={breadcrumbs} />
    <section className="w-full bg-slate-50 px-4 py-4 sm:py-5" aria-label="Free business listing">
      <article className={`mx-auto aspect-[1.75/1] w-full max-w-[460px] overflow-hidden rounded-xl border-2 ${border} bg-white shadow-sm`}>
        <div className="flex h-full flex-col justify-center gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${icon}`} aria-label={`${categoryName} icon`}>{business.logo_url ? <img src={business.logo_url} alt={`${business.name} logo`} className="max-h-full max-w-full rounded-xl object-contain" /> : <CategoryIcon category={business.category?.name} />}</div>
          <div className="min-w-0 flex-1"><h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{business.name}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-sm font-medium ${badge}`}>{categoryName}</span>{locationParts.length > 0 && <span className="text-sm text-slate-600">{locationParts.join(', ')}</span>}</div></div>
        </div>
      </article>
    </section>
    <section className="w-full bg-white px-4 py-5" aria-label="Claim this business">
      <div className="mx-auto max-w-[760px] rounded-lg border border-emerald-200 bg-emerald-50 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-emerald-950">Is this your business? Claim it for free</h2><p className="mt-1 text-sm text-emerald-900">Get more visibility and manage how your business appears on ListAcrossEU.</p></div><button type="button" onClick={() => setClaimOpen(true)} className="shrink-0 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">Claim it for free</button></div><ClaimBusinessModal business={business as never} isOpen={claimOpen} onClose={() => setClaimOpen(false)} /></div>
    </section>
    <main className="container mx-auto px-4 py-8"><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start"><div>
      {relatedBusinesses.length > 0 && business.city?.name && <section className="mx-auto mt-0 max-w-5xl" aria-labelledby="nearby-businesses-heading"><h2 id="nearby-businesses-heading" className="text-2xl font-bold text-slate-950">More businesses in {relatedHeading || business.city.name}</h2>{showGroups ? <div className="mt-6 space-y-8">{usefulGroups.map(([category, items]) => <div key={category}><h3 className="mb-3 text-lg font-semibold text-slate-900">{category}</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.slice(0, 4).map((item) => <RelatedCard key={item.id} business={item} lang={lang} />)}</div></div>)}</div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{relatedBusinesses.slice(0, 12).map((item) => <RelatedCard key={item.id} business={item} lang={lang} />)}</div>}</section>}
      <BlogPostsSlider lang={lang} countrySlug={business.country?.slug} countryName={business.country?.name} mode="country" />
    </div><aside className="lg:sticky lg:top-24"><ListingAdsBlock showDirectoryAd={false} /></aside></div></main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({'@context': 'https://schema.org', '@type': 'LocalBusiness', name: business.name, ...(business.description && { description: business.description }), ...(business.website && { url: business.website }), ...(business.phone && { telephone: business.phone }), ...(business.address && { address: { '@type': 'PostalAddress', streetAddress: business.address_line1 || business.address, addressLocality: business.city?.name, addressCountry: business.country?.name } })}) }} />
  </div>;
}
