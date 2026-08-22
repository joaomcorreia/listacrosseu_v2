'use client';

import { useEffect, useState } from 'react';
import { generatedWebsiteHostUrl, PUBLIC_API_BASE_URL } from '@/lib/env.public';
import { formatLocalizedDate } from '@/lib/date-format';

type WebsiteData = {
  business_id: number;
  business_name: string;
  preview_url?: string;
  public_url?: string;
  website: {
    website_slug: string;
    page_title: string;
    target_location: string;
    service_area: string;
    status: string;
    published: boolean;
    published_at: string | null;
    trial: { status: string; started_at: string | null; ends_at: string | null };
  };
};

function csrfToken() {
  return document.cookie.split(';').map((value) => value.trim().split('=')).find(([key]) => key === 'csrftoken')?.[1] || '';
}

export default function GeneratedWebsiteDashboardClient({ lang, businessId }: { lang: string; businessId?: string }) {
  const [data, setData] = useState<WebsiteData | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    const endpoint = businessId ? `${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${encodeURIComponent(businessId)}/website/` : '';
    if (!endpoint) { setError('Choose a business from your dashboard first.'); return; }
    const response = await fetch(endpoint, { credentials: 'include' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 || response.status === 404 ? 'Sign in as the verified business owner to manage this website.' : payload.detail || 'Unable to load the website dashboard.');
    setData(payload);
  }

  useEffect(() => { load().catch((reason) => setError(reason.message || 'Unable to load the website dashboard.')); }, [businessId]);

  function preview() {
    if (!data) return;
    const parsed = data.preview_url ? new URL(data.preview_url, window.location.origin) : null;
    window.open(generatedWebsiteHostUrl(data.website.website_slug, `/${parsed?.search || ''}`), '_blank', 'noopener,noreferrer');
  }

  async function startTrial() {
    if (!data) return;
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${data.business_id}/website/trial/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() } });
    if (response.ok) { setNotice('30-day trial activated locally.'); await load(); } else setError('Trial activation is unavailable.');
  }

  async function changePublication(action: 'publish' | 'unpublish') {
    if (!data) return;
    setError(''); setNotice('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${data.business_id}/website/${action}/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.detail || `Unable to ${action} the website.`); return; }
    setData(payload);
    setNotice(action === 'publish' ? 'Website published.' : 'Website unpublished.');
  }

  function viewWebsite() {
    if (!data?.website.published) return;
    const path = data.public_url || `/en/generated/${data.website.website_slug}`;
    window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
  }

  if (error) return <main className="min-h-screen bg-slate-100 p-6"><section className="mx-auto max-w-xl rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-black text-slate-900">Generated Website</h1><p className="mt-3 text-slate-600">{error}</p><a href={`/${lang}/dashboard`} className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-bold text-white">Back to dashboard</a></section></main>;
  if (!data) return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">Loading website dashboard...</main>;

  const site = data.website;
  const activeTrial = site.trial.status === 'trial' || site.trial.status === 'active';
  const daysRemaining = site.trial.ends_at ? Math.max(0, Math.ceil((new Date(site.trial.ends_at).getTime() - Date.now()) / 86400000)) : 0;
  const status = site.trial.status === 'expired' ? 'Trial expired' : activeTrial ? (site.published ? 'Live · trial active' : 'Trial active') : 'Preview ready';
  const formatDate = (value: string | null) => formatLocalizedDate(value, lang);
  return <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 lg:px-10"><div className="mx-auto max-w-5xl"><header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Website</p><h1 className="mt-2 text-3xl font-black">{site.page_title}</h1><p className="mt-2 text-slate-600">Separate from the Claimed Listing for {data.business_name}.</p></div><a href={`/${lang}/dashboard?business=${data.business_id}`} className="text-sm font-bold text-blue-700 hover:underline">Business Listing</a></header><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs font-bold uppercase text-slate-500">Status</p><p className="mt-1 font-black">{status}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Target/service location</p><p className="mt-1 font-black">{site.target_location || 'Not set'}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Trial start</p><p className="mt-1 font-black">{formatDate(site.trial.started_at)}</p></div><div><p className="text-xs font-bold uppercase text-slate-500">Trial end</p><p className="mt-1 font-black">{formatDate(site.trial.ends_at)}{activeTrial && <span className="block text-sm text-emerald-700">{daysRemaining} days remaining</span>}</p></div></div><div className="mt-8 flex flex-wrap gap-3"><a href={`/${lang}/premium-preview?business=${data.business_id}`} className="rounded bg-blue-700 px-4 py-2 font-bold text-white">Edit website</a><button type="button" onClick={preview} className="rounded border border-slate-300 px-4 py-2 font-bold">Preview</button>{site.trial.status === 'active' || site.trial.status === 'trial' ? site.published ? <><button type="button" onClick={() => changePublication('publish')} className="rounded border border-blue-600 px-4 py-2 font-bold text-blue-700">Republish website</button><button type="button" onClick={() => changePublication('unpublish')} className="rounded border border-slate-300 px-4 py-2 font-bold text-slate-700">Unpublish website</button></> : <button type="button" onClick={() => changePublication('publish')} className="rounded border border-emerald-600 px-4 py-2 font-bold text-emerald-700">Publish website</button> : <span className="rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">Publishing unavailable until the trial is active</span>}{site.published && <button type="button" onClick={viewWebsite} className="rounded bg-slate-900 px-4 py-2 font-bold text-white">View website</button>}{site.trial.status === 'not_started' && <button type="button" onClick={startTrial} className="rounded border border-emerald-600 px-4 py-2 font-bold text-emerald-700">Start my 30-day trial</button>}</div>{notice && <p className="mt-4 text-sm font-semibold text-emerald-700">{notice}</p>}<p className="mt-5 text-xs text-slate-500">Publishing creates a public snapshot. Later draft saves remain private until you republish.</p></section></div></main>;
}
