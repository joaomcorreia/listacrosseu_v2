'use client';

import { useEffect, useState } from 'react';
import { withConfiguredPublicApiUrl } from '@/lib/env.public';
import GeneratedWebsiteRenderer from './GeneratedWebsiteRenderer';
import type { GeneratedWebsite, GeneratedWebsitePage } from './generated-page-schema';

export default function PublicGeneratedWebsiteClient({ slug, lang, previewToken, activePage = 'home' }: { slug: string; lang: string; previewToken?: string; activePage?: GeneratedWebsitePage }) {
  const [website, setWebsite] = useState<GeneratedWebsite | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = previewToken ? `?preview_token=${encodeURIComponent(previewToken)}` : '';
    fetch(withConfiguredPublicApiUrl(`/api/listings/generated-websites/${encodeURIComponent(slug)}/${query}`))
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || 'This Generated Website is not available.');
        setWebsite(data);
      })
      .catch((reason) => setError(reason.message || 'This Generated Website is not available.'));
  }, [slug]);

  if (error) return <main className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-black text-slate-900">Generated Website unavailable</h1><p className="mt-3 text-slate-600">{error}</p><a href={`/${lang}`} className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-bold text-white">Return home</a></main>;
  if (!website) return <main className="mx-auto max-w-2xl px-5 py-20 text-center text-slate-600">Loading Generated Website...</main>;
  return <GeneratedWebsiteRenderer initial={website} businessId={String(website.business_id)} lang={lang} readOnly activePage={activePage} />;
}
