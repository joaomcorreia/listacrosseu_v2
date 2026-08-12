'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BusinessCard from '@/components/BusinessCard';
import DirectorySidebarLayout from '@/components/DirectorySidebarLayout';
import Sidebar from '@/components/Sidebar';
import { fetchBusinessesByLocation, type BusinessSearchResult } from '@/lib/api/listings';
import { useDirectoryPageEditor, type DirectoryPageContent } from '@/components/DirectoryPageEditor';
import { STRIPE_GENERATED_WEBSITE_URL } from '@/lib/env.public';
import { GENERATED_WEBSITE_PRODUCT } from '@/lib/product-config';
import StructuredData from '@/components/StructuredData';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { PUBLIC_SITE_URL } from '@/lib/env.public';

type Scope = 'landing' | 'country' | 'city';

type Props = {
  lang: string;
  scope: Scope;
  slug: string;
  defaults: DirectoryPageContent;
  listing?: { country?: string; city?: string; heading: string };
};

export default function ManagedDirectoryPageClient({ lang, scope, slug, defaults, listing }: Props) {
  const editor = useDirectoryPageEditor({ scope, slug, defaults });
  const { content, editable, editMode, toolbar } = editor;
  const ctaHref = slug === 'generated-business-website'
    ? (STRIPE_GENERATED_WEBSITE_URL || `/${lang}/pricing`)
    : (content.cta_href || `/${lang}/list-your-business`);
  const [businesses, setBusinesses] = useState<BusinessSearchResult | null>(null);
  const relatedLinks = content.related_links?.length ? content.related_links : [
    { label: 'List Your Business for Free', href: `/${lang}/list-your-business-free` },
    { label: 'Generated Business Website', href: `/${lang}/generated-business-website` },
    { label: 'Pricing', href: `/${lang}/pricing` },
    { label: 'Browse businesses', href: `/${lang}/search` },
    ...(listing?.city ? [{ label: 'Belgium free business listings', href: `/${lang}/free-business-listing-belgium` }] : []),
  ];

  useEffect(() => {
    if (!listing) return;
    fetchBusinessesByLocation(listing.country, listing.city, { limit: 8 })
      .then(setBusinesses)
      .catch(() => setBusinesses({ results: [], total: 0, limit: 8, offset: 0 }));
  }, [listing?.country, listing?.city]);

  return (
    <div>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: `${PUBLIC_SITE_URL}/${lang}` },
        ...(listing?.country ? [{ name: 'Belgium', url: `${PUBLIC_SITE_URL}/${lang}/free-business-listing-belgium` }] : []),
        { name: content.title, url: `${PUBLIC_SITE_URL}/${lang}/${slug}` },
      ])} />
      <section
        className="relative isolate overflow-hidden bg-gradient-to-br from-[#123fc9] via-[#2454d8] to-[#6426a7] bg-cover bg-center text-white"
        style={content.hero_image ? { backgroundImage: `linear-gradient(90deg, rgba(7, 28, 86, 0.88), rgba(51, 38, 135, 0.72)), url(${content.hero_image})` } : undefined}
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            {editable('title', content.title, 'text-4xl font-black tracking-tight sm:text-6xl', 'h1')}
            {editable('subtitle', content.subtitle, 'mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg', 'p', true)}
            {content.cta_label && (editMode ? (
              <div className="mt-7 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-800">
                {editable('cta_label', content.cta_label)}
              </div>
            ) : (
              <a href={ctaHref} className="mt-7 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50">
                {content.cta_label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-slate-50 py-3">
        <div className="mx-auto max-w-7xl px-4 text-sm text-slate-600 sm:px-6 lg:px-8">
          <Link href={`/${lang}`} className="hover:text-blue-700">Home</Link>
          <span className="mx-2">/</span>
          <span>{content.title}</span>
        </div>
      </div>

      <DirectorySidebarLayout sidebar={<Sidebar content="ads" context={{ citySlug: listing?.city, countrySlug: listing?.country }} />}>
        <section className="pt-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {editable('intro', content.intro, 'text-base leading-7 text-slate-700', 'p', true)}
          </div>
        </section>

        <section className="py-10">
          <h2 className="text-2xl font-black text-slate-900">Free Listing <span className="text-blue-700">→</span> Claim <span className="text-blue-700">→</span> Try Your Generated Website Free</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['1', 'Free Listing', 'Add your business to the public directory.'],
              ['2', 'Claim', 'Verify ownership and manage your listing.'],
              ['3', 'Generated Website', `Try it with ${GENERATED_WEBSITE_PRODUCT.trial}, then ${GENERATED_WEBSITE_PRODUCT.price} if kept.`],
            ].map(([number, title, text]) => <article key={number} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-sm font-black text-blue-700">{number}</span><h3 className="mt-2 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
          </div>
          <p className="mt-5 text-sm text-slate-600">Custom domain options are coming next.</p>
          <Link href={`/${lang}/list-your-business-free`} className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">List your business for free</Link>
        </section>

        {listing && businesses && businesses.results.length > 0 && <section className="pb-12">
          <h2 className="text-2xl font-black text-slate-900">{listing.heading}</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.results.map((business) => <BusinessCard key={business.id} business={business as any} lang={lang} />)}
          </div>
        </section>}
        <section className="border-t border-slate-200 pb-12 pt-8">
          <h2 className="text-xl font-black text-slate-900">Explore more on ListAcrossEU</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {relatedLinks.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-500 hover:bg-blue-50">{link.label}</Link>)}
          </div>
        </section>
      </DirectorySidebarLayout>
      {toolbar}
    </div>
  );
}
