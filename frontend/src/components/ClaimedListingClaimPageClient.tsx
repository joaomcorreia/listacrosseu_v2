'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';
import PostcardEditor from '@/components/business/PostcardEditor';

type Business = {
  id: number; name: string; slug: string; tier: 'free' | 'claimed' | 'premium';
  description?: string; address?: string; address_line1?: string; postal_code?: string;
  phone?: string; website?: string; logo_url?: string; image_url?: string; accent_color?: string;
  category?: { id: number; name: string } | null; city?: { id: number; name: string } | null; country?: { id: number; name: string } | null;
};

type Draft = {
  name: string; business_type: string; description: string; address: string; address_line1: string; postal_code: string;
  phone: string; contact_email: string; whatsapp_number: string; website: string; owner_name: string; languages: string[];
  logo_url: string; image_url: string; background_image: string; accent_color: string; overlay_color: string; overlay_opacity: number;
  region: string; category_id?: number | null; city_id?: number | null; category_suggestion: string; visibility: Record<string, boolean>;
};

const emptyDraft = (business: Business): Draft => ({
  name: business.name || '', business_type: business.category?.name || '', description: business.description || '',
  address: business.address || '', address_line1: business.address_line1 || '', postal_code: business.postal_code || '',
  phone: business.phone || '', contact_email: '', whatsapp_number: '', website: business.website || '', owner_name: '', languages: [],
  logo_url: business.logo_url || '', image_url: business.image_url || '', background_image: '', accent_color: business.accent_color || '#2563EB',
  overlay_color: '#0F172A', overlay_opacity: 0.72, region: '', category_id: business.category?.id || null, city_id: business.city?.id || null,
  category_suggestion: '', visibility: { address: true, phone: true, whatsapp: false, email: false, website: true, languages: true, description: true, business_type: true },
});

function csrfCookie() { return document.cookie.split(';').map((value) => value.trim().split('=')).find(([key]) => key === 'csrftoken')?.[1] || ''; }

export default function ClaimedListingClaimPageClient({ lang }: { lang: string }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [claimantName, setClaimantName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<{ businessId: number; accountCreated?: boolean; accountExists?: boolean } | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const slug = query.get('slug') || query.get('business') || '';
    Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/listings/businesses/${encodeURIComponent(slug)}/`).then((response) => response.json()),
      fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/auth/`, { credentials: 'include' }).then((response) => response.json()),
      fetch(`${PUBLIC_API_BASE_URL}/api/listings/all-categories/`, { cache: 'no-store' }).then((response) => response.json()),
    ]).then(([listing, auth, categoryData]) => {
      if (!listing?.id) throw new Error('This business listing could not be loaded.');
      if (listing.tier !== 'free') throw new Error('This business is not available for a new claim.');
      setBusiness(listing); setDraft(emptyDraft(listing)); setAuthenticated(Boolean(auth.authenticated)); setEmail(auth.user?.email || '');
      setCategories(Array.isArray(categoryData) ? categoryData : categoryData.value || categoryData.results || []);
    }).catch((reason) => setError(reason.message || 'Unable to load the claim editor.')).finally(() => setLoading(false));
  }, []);

  function update(field: keyof Draft, value: string | number | null | string[] | Record<string, boolean>) { setDraft((current) => current ? { ...current, [field]: value } : current); }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!business || !draft) return; setSending(true); setError(''); setNotice('');
    const payload = { business_id: business.id, name: claimantName.trim() || draft.owner_name || email.trim(), email: email.trim(), password, business_name: draft.name, business_address: draft.address_line1 || draft.address, business_post_code: draft.postal_code, draft: { ...draft, owner_name: claimantName.trim() || draft.owner_name } };
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/claims`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfCookie() }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.message || 'Unable to continue this claim.');
      if (data.claim_status === 'verified') { window.location.href = `/${lang}/dashboard?business=${data.business_id}`; return; }
      setResult({ businessId: data.business_id, accountCreated: data.account_created, accountExists: data.account_exists }); setNotice(data.message || 'Verification is required before your Claimed Listing can be managed.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue this claim.'); } finally { setSending(false); }
  }

  if (loading) return <main className="mx-auto max-w-6xl px-6 py-16 text-slate-700">Loading your Claimed Listing...</main>;
  if (error && !business) return <main className="mx-auto max-w-xl px-6 py-16 text-red-700">{error}</main>;
  if (!business || !draft) return null;
  if (result) return <main className="mx-auto max-w-xl px-6 py-16"><section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-emerald-950"><h1 className="text-3xl font-black">Verification required</h1><p className="mt-4">{notice}</p><p className="mt-3 text-sm">Your Claimed Listing presentation is saved for this business. Verify the email address before it can be published.</p>{result.accountExists && <a href={`/${lang}/login?next=${encodeURIComponent(`/${lang}/dashboard?business=${result.businessId}`)}`} className="mt-6 inline-flex rounded bg-blue-700 px-4 py-3 font-bold text-white">Sign in to continue</a>}{result.accountCreated && <a href={`/${lang}/check-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(`/${lang}/dashboard?business=${result.businessId}`)}`} className="mt-6 inline-flex rounded bg-blue-700 px-4 py-3 font-bold text-white">Check your email</a>}</section></main>;

  const listing = { ...draft, category: categories.find((item) => item.id === draft.category_id) || business.category, city: business.city, country: business.country };
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl"><PostcardEditor value={listing} categories={categories} showMediaControls={false} showStyleControls canvasMode="editing" showPreviewButton={false} onChange={(field, value) => update(field as keyof Draft, value as never)} /><form onSubmit={submit} className="mx-auto mt-8 max-w-5xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div><h2 className="text-xl font-black text-slate-950">Confirm listing and account details</h2><p className="mt-1 text-sm text-slate-600">Confirm the details used to manage this Claimed Listing.</p></div><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Street address<input required value={draft.address_line1} onChange={(event) => update('address_line1', event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label><label className="block text-sm font-semibold text-slate-700">Post code<input required value={draft.postal_code} onChange={(event) => update('postal_code', event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label></div>{!authenticated && <label className="block text-sm font-semibold text-slate-700">Your name<input required value={claimantName} onChange={(event) => setClaimantName(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>}<label className="block text-sm font-semibold text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>{!authenticated && <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input required type={passwordVisible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-11 font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /> <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100">{passwordVisible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}</button></div></label>}{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}<button disabled={sending} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60">{sending ? 'Continuing...' : 'Continue with this Claimed Listing'}</button></form></div></main>;
}
