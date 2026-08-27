'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Building2, Search, UserRoundCheck, type LucideIcon } from 'lucide-react';
import InnerPageHero from '@/components/InnerPageHero';
import ListYourBusinessPageClient from '@/components/ListYourBusinessPageClient';
import BlogPostsSlider from '@/components/blog/BlogPostsSlider';
import BusinessCard from '@/components/BusinessCard';
import { fetchBusinesses, type Business } from '@/lib/api/listings';
import { GENERATED_WEBSITE_PRODUCT } from '@/lib/product-config';

type Context = { category?: string; city?: string; region?: string; country?: string };

const faqItems = [
  ['Is the business listing really free?', 'Yes. The basic List Across EU business listing is free. Optional products and upgrades may be available separately.'],
  ['What if my business is already on List Across EU?', 'Claim the existing listing instead of creating another one. This helps keep the directory accurate and gives you access to manage the information available to your listing.'],
  ['Do I need a website?', 'No. You can have a List Across EU business listing even if your business does not have its own website.'],
  ['Where can my business appear?', 'Your business may appear on relevant List Across EU business, category, city, regional and country pages depending on the information associated with your listing.'],
  ['Can my business appear on Google?', 'Yes. Public List Across EU business pages are designed to be accessible to search engines and can be indexed by Google, Bing and other search engines. Search engines decide independently what they index and how results are ranked, so a specific position or appearance cannot be guaranteed.'],
  ['Can I update my information later?', 'Yes. Once you have access to your listing, you can manage the information supported by your listing type.'],
  ['Will claiming my listing improve my Google ranking?', 'Claiming your listing does not guarantee a higher Google ranking. It gives you control over your business information on List Across EU and can make your public listing more complete and useful.'],
  ['What is the Generated Website?', 'The Generated Website is a separate optional website product created using your business information. You can edit and preview it before payment and publishing.'],
  ['Can I promote my business in a different location from where it is based?', 'A Claimed Listing is connected to the actual location of your business and should represent where the business is genuinely based. If your business serves customers in another city, region or country, you can use a Generated Website and choose the location or service area that page should focus on. For example, a mobile business based in one city could create a Generated Website aimed at customers in another city it serves.'],
  ['If I register for a Generated Website, do I lose my Claimed Listing or can I keep both?', 'You can keep both. Your Claimed Listing remains active on List Across EU, while your Generated Website gives you a separate and more flexible online presence. The two can work together to help people discover your business.'],
  ['Can I use my own domain with my Generated Website?', 'Yes. Custom domains are available on request. If you already own a domain, we can connect it to your Generated Website for a small setup fee. If you need a new domain, we can also register and configure one for you. Standard domain setup can start from approximately €19 + VAT for the first year, depending on the domain extension. Your Generated Website subscription continues separately.'],
] as const;

const benefitCards: Array<{ title: string; body: string; Icon: LucideIcon }> = [
  { title: 'Free listing', body: 'Create a basic public business presence.', Icon: BadgeCheck },
  { title: 'Relevant discovery', body: 'Appear across useful directory pages.', Icon: Search },
  { title: 'Manage your information', body: 'Keep supported listing details up to date.', Icon: UserRoundCheck },
  { title: 'No website required', body: 'Start with your List Across EU listing.', Icon: Building2 },
];

function RelatedBusinesses({ title, businesses, lang }: { title: string; businesses: Business[]; lang: string }) {
  if (!businesses.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><h2 className="text-2xl font-black text-slate-900">{title}</h2><Link href={`/${lang}/search`} className="text-sm font-semibold text-blue-700 hover:underline">Browse all</Link></div><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{businesses.map((business) => <BusinessCard key={business.id} business={business as any} lang={lang} />)}</div></section>;
}

export default function ListYourBusinessOnboardingClient({ lang }: { lang: string }) {
  const [context, setContext] = useState<Context>({});
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setContext({ category: params.get('category') || undefined, city: params.get('city') || undefined, region: params.get('region') || undefined, country: params.get('country') || undefined });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchBusinesses({ category: context.category, city: context.city, country: context.country, limit: 32 });
        if (!cancelled) setBusinesses(data.results || []);
      } catch { if (!cancelled) setBusinesses([]); } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [context.category, context.city, context.country]);

  const grouped = useMemo(() => {
    const seen = new Set<number>();
    const take = (predicate: (business: Business) => boolean) => businesses.filter((business) => predicate(business) && !seen.has(business.id)).slice(0, 4).map((business) => { seen.add(business.id); return business; });
    return {
      category: take((business) => Boolean(context.category && business.category?.slug === context.category)),
      city: take((business) => Boolean(context.city && business.city?.slug === context.city)),
      region: take((business) => Boolean(context.region && (business as Business & { region?: string }).region?.toLowerCase() === context.region?.toLowerCase())),
      country: take((business) => Boolean(context.country && business.country?.slug === context.country)),
      europe: take((business) => !context.category || business.category?.slug === context.category),
    };
  }, [businesses, context]);

  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) };
  const cityName = grouped.city[0]?.city?.name;
  const countryName = grouped.country[0]?.country?.name;

  return <>
    <InnerPageHero variant="tall" eyebrow="LIST ACROSS EU" title="List your business for free" description="Add your business to the European directory or claim an existing listing and manage your information." actions={[{ label: 'Start your free listing', href: '#list-form' }]} breadcrumbs={[{ label: 'Home', href: `/${lang}` }, { label: 'List your business' }]} />
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]"><div><h2 className="text-3xl font-black text-slate-900">Get your business listed across Europe</h2><div className="mt-5 space-y-4 text-base leading-7 text-slate-700"><p>Add your business to List Across EU for free, or claim an existing listing if we already have your business in our directory.</p><p>Your listing can appear on relevant List Across EU category, city, regional and country pages. Public business pages can also be discovered and indexed by Google, Bing and other search engines, although search engines decide independently what they index and how they rank results.</p><p>A basic listing can show your business name, what you do, your location and other information permitted by the listing type. You do not need your own website, and you can manage supported information later.</p><p>Already listed? Find and claim your business instead of creating a duplicate. If you want more than a directory listing, the separate Generated Website can be edited and previewed before payment and publishing.</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{benefitCards.map(({ title, body, Icon }) => <div key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-blue-700" strokeWidth={1.8} aria-hidden="true" /><h3 className="mt-3 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>)}</div></div></section>
    <section id="list-form" className="scroll-mt-20 bg-slate-50 py-12"><div className="border-y border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><h2 className="text-3xl font-black text-slate-900">Add or find your business</h2><p className="mt-2 max-w-2xl text-slate-600">Search for an existing listing or add your business. Duplicate matches can be claimed instead.</p></div></div><div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6"><ListYourBusinessPageClient lang={lang} /></div></section>
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><h2 className="text-3xl font-black text-slate-900">Questions about listing your business</h2><div className="mt-6 grid gap-3">{faqItems.map(([question, answer]) => <details key={question} className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-bold text-slate-900">{question}</summary><p className="mt-3 text-sm leading-6 text-slate-600">{answer}{question === 'Can I promote my business in a different location from where it is based?' && <><br /><Link href={`/${lang}/generated-business-website`} className="font-semibold text-blue-700 hover:underline">See how Generated Websites work →</Link></>}</p></details>)}</div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /></section>
    {!loading && <RelatedBusinesses lang={lang} title={context.category ? 'More businesses in this category' : 'Businesses across Europe'} businesses={grouped.category.length ? grouped.category : grouped.europe} />}
    <BlogPostsSlider lang={lang} mode="eu" />
    {!loading && cityName && <RelatedBusinesses lang={lang} title={`Businesses in ${cityName}`} businesses={grouped.city} />}
    {!loading && context.region && <RelatedBusinesses lang={lang} title={`Businesses in ${context.region}`} businesses={grouped.region} />}
    {!loading && countryName && <RelatedBusinesses lang={lang} title={`Businesses in ${countryName}`} businesses={grouped.country} />}
    {!loading && <RelatedBusinesses lang={lang} title={context.category ? `More ${context.category} businesses across Europe` : 'More businesses across Europe'} businesses={grouped.europe} />}
  </>;
}
