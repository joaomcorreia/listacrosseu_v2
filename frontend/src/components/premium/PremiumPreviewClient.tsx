'use client';

import { useEffect, useState } from 'react';
import GeneratedWebsiteRenderer from './GeneratedWebsiteRenderer';
import type { GeneratedWebsite } from './generated-page-schema';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

export default function PremiumPreviewClient({ businessId, lang }: { businessId: string; lang: string }) {
  const [website, setWebsite] = useState<GeneratedWebsite | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${encodeURIComponent(businessId)}/website/`, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 || response.status === 404 ? 'Please sign in as the verified business owner to continue.' : data.detail || 'Unable to load this webpage preview.');
        setWebsite({ ...data, preview_url: data.preview_url });
      })
      .catch((reason) => setError(reason.message || 'Unable to load this webpage preview.'));
  }, [businessId]);

  if (error) return <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-slate-900">Webpage setup</h1><p className="mt-3 text-slate-600">{error}</p><a className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-semibold text-white" href={`/${lang}/login?next=/${lang}/premium-preview?business=${encodeURIComponent(businessId)}`}>Sign in</a></div>;
  if (!website) return <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center text-slate-600 shadow">Loading your website draft...</div>;
  return <GeneratedWebsiteRenderer initial={website} businessId={businessId} lang={lang} />;
}
