'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, EyeOff, Loader2, LogOut, Menu, Save, X } from 'lucide-react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

type Option = { id: number; name: string };

type DashboardBusiness = {
  id: number;
  name: string;
  tier: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  owner_name: string;
  region: string;
  business_type: string;
  logo_url: string;
  image_url: string;
  address: string;
  address_line1: string;
  postal_code: string;
  category_id?: number;
  city_id?: number;
  country: { id: number; name: string; slug: string } | null;
  city: { id: number; name: string; slug: string } | null;
  category: { id: number; name: string; slug: string } | null;
  visibility: Record<string, boolean>;
  claim_status: 'pending' | 'verified' | 'expired';
};

const defaultVisibility = {
  owner_name: false,
  email: false,
  phone: true,
  website: true,
  city: true,
  region: true,
};

function csrfToken() {
  return document.cookie.split(';').map((value) => value.trim().split('=')).find(([key]) => key === 'csrftoken')?.[1] || '';
}
function VisibilityToggle({ field, value, onChange }: { field: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex cursor-pointer items-center gap-1 text-[10px] font-medium text-slate-500"><input type="checkbox" className="sr-only" checked={value} onChange={(event) => onChange(event.target.checked)} /><span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-50 text-slate-400'}`} aria-hidden="true">{value ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</span><span className="sr-only">Show {field} on listing</span></label>;
}

function Field({ label, value, onChange, visibilityField, visibility, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; visibilityField?: string; visibility: Record<string, boolean>; type?: string }) {
  return <label className="block text-xs font-semibold text-slate-700"><span className="mb-1 flex items-center justify-between gap-2">{label}{visibilityField && <VisibilityToggle field={label} value={visibility[visibilityField] !== false} onChange={(next) => onChange(`__visibility:${visibilityField}:${next}`)} />}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" /></label>;
}

function SelectField({ label, value, options, onChange, visibilityField, visibility, onVisibilityChange }: { label: string; value: number | ''; options: Option[]; onChange: (value: number) => void; visibilityField?: string; visibility?: Record<string, boolean>; onVisibilityChange?: (value: boolean) => void }) {
  return <label className="block text-xs font-semibold text-slate-700"><span className="mb-1 flex items-center justify-between gap-2">{label}{visibilityField && visibility && onVisibilityChange && <VisibilityToggle field={label} value={visibility[visibilityField] !== false} onChange={onVisibilityChange} />}</span><select value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}

export default function DashboardPageClient({ lang, initialBusinessId }: { lang: string; initialBusinessId?: number }) {
  const [businesses, setBusinesses] = useState<DashboardBusiness[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<DashboardBusiness | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trialStarting, setTrialStarting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [panel, setPanel] = useState<'overview' | 'password'>('overview');
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/`, { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) throw new Error('AUTH_REQUIRED');
        if (!response.ok) throw new Error('LOAD_FAILED');
        return response.json();
      })
      .then((data) => {
        const items = data.results || [];
        if (!items.length) {
          setError("You don't have a business linked yet.");
          return;
        }
        setBusinesses(items);
        const initial = items.find((item: DashboardBusiness) => item.id === initialBusinessId) || items[0];
        setSelectedId(initial?.id ?? null);
        setForm(initial ? { ...initial, visibility: { ...defaultVisibility, ...initial.visibility } } : null);
      })
      .catch((reason) => {
        if (reason.message === 'AUTH_REQUIRED') {
          window.location.href = `/${lang}/login?next=/${lang}/dashboard`;
          return;
        }
        setError('Unable to load your dashboard.');
      })
      .finally(() => setLoading(false));
  }, [lang, initialBusinessId]);

  useEffect(() => {
    Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/listings/categories/`).then((response) => response.json()),
      fetch(`${PUBLIC_API_BASE_URL}/api/listings/cities/`).then((response) => response.json()),
    ]).then(([categories, cities]) => {
      setCategoryOptions(categories.value || categories.results || []);
      setCityOptions(cities.value || cities.results || []);
    }).catch(() => undefined);
  }, []);

  const selected = useMemo(() => businesses.find((item) => item.id === selectedId) || null, [businesses, selectedId]);

  useEffect(() => {
    if (selected) setForm({ ...selected, visibility: { ...defaultVisibility, ...selected.visibility } });
  }, [selected]);

  const updateField = (field: keyof DashboardBusiness, value: string) => {
    if (!form) return;
    if (value.startsWith('__visibility:')) {
      const [, key, next] = value.split(':');
      setForm({ ...form, visibility: { ...form.visibility, [key]: next === 'true' } });
      return;
    }
    setForm({ ...form, [field]: value });
  };

  const updateVisibility = (field: string, value: boolean) => {
    if (form) setForm({ ...form, visibility: { ...form.visibility, [field]: value } });
  };

  async function saveChanges() {
    if (!form || saving) return;
    setSaving(true); setMessage(''); setError('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() }, body: JSON.stringify({ name: form.name, category_id: form.category_id, city_id: form.city_id, business_type: form.business_type, phone: form.phone, description: form.description, owner_name: form.owner_name, email: form.email, website: form.website, logo_url: form.logo_url, image_url: form.image_url, region: form.region, address: form.address, address_line1: form.address_line1, postal_code: form.postal_code, visibility: form.visibility }) });
    if (response.ok) { const updated = await response.json(); setForm({ ...updated, visibility: { ...defaultVisibility, ...updated.visibility } }); setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item)); setMessage('Changes saved.'); } else { const data = await response.json().catch(() => ({})); setError(data.detail || 'Unable to save changes.'); }
    setSaving(false);
  }

  async function logout() { await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/logout/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() } }); window.location.href = `/${lang}`; }

  async function changePassword(event: React.FormEvent) { event.preventDefault(); const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/password/`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() }, body: JSON.stringify(passwords) }); setMessage(response.ok ? 'Password changed.' : ((await response.json().catch(() => ({}))).detail || 'Unable to change password.')); }

  async function startTrial() {
    if (!form || trialStarting) return;
    setTrialStarting(true); setError('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/website/`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() } });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      window.location.href = `/${lang}/premium-preview?business=${form.id}`;
      return;
    }
    setError(data.detail || 'Unable to start your webpage trial.');
    setTrialStarting(false);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading dashboard...</div>;
  if (error && !form) return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-md rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-slate-900">Dashboard 1</h1><p className="mt-3 text-slate-600">{error}</p>{error.includes('sign in') && <a className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-semibold text-white" href={`/${lang}/login`}>Sign in</a>}<a className="ml-2 mt-6 inline-flex rounded border border-slate-300 px-4 py-2 font-semibold text-slate-700" href={`/${lang}`}>Return</a></div></div>;

  return <div className="min-h-screen bg-slate-100 text-slate-900"><button type="button" onClick={() => setMobileNav(!mobileNav)} className="fixed left-4 top-4 z-30 rounded bg-slate-900 p-2 text-white lg:hidden" aria-label="Open dashboard menu">{mobileNav ? <X /> : <Menu />}</button><aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-neutral-900 px-5 py-8 text-white transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}><div className="mb-12 text-2xl font-black tracking-wide">DASHBOARD</div><nav className="space-y-2"><button onClick={() => { setPanel('overview'); setMobileNav(false); }} className={`block w-full px-2 py-2 text-left text-sm font-bold uppercase tracking-wider ${panel === 'overview' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Overview</button><button onClick={() => { setPanel('password'); setMobileNav(false); }} className={`block w-full px-2 py-2 text-left text-sm font-bold uppercase tracking-wider ${panel === 'password' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Change password</button><button onClick={logout} className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white"><LogOut className="h-4 w-4" />Logout</button></nav></aside><main className="min-h-screen px-4 py-8 lg:ml-64 lg:px-10"><div className="mx-auto max-w-6xl">{businesses.length > 1 && <label className="mb-6 block max-w-sm text-sm font-semibold">Your business<select value={selectedId || ''} onChange={(event) => setSelectedId(Number(event.target.value))} className="mt-1 block w-full rounded border border-slate-300 bg-white p-2"><option value="">Select a business</option>{businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}{panel === 'password' ? <section className="max-w-xl rounded-xl bg-white p-6 shadow"><h1 className="text-2xl font-bold">Change password</h1><form onSubmit={changePassword} className="mt-6 space-y-4"><Field label="Current password" type="password" value={passwords.current_password} onChange={(value) => setPasswords({ ...passwords, current_password: value })} visibility={{}} /><Field label="New password" type="password" value={passwords.new_password} onChange={(value) => setPasswords({ ...passwords, new_password: value })} visibility={{}} /><button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Save password</button></form></section> : form && <><header className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Module 1 - Business</p><h1 className="mt-1 text-3xl font-black">{form.name}</h1></div><span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800"><Check className="h-4 w-4" />{form.claim_status === 'verified' ? 'Claim verified' : 'Verification pending'}</span></header><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mx-auto max-w-3xl rounded-xl border-4 border-fuchsia-600 bg-slate-50 p-4 sm:p-6"><div className="grid gap-3 sm:grid-cols-[112px_1fr]"><div><div className="flex h-24 items-center justify-center rounded-md bg-red-800 p-2 text-center text-xs font-bold text-white">{form.logo_url ? <img src={form.logo_url} alt="Business logo" className="max-h-full max-w-full object-contain" /> : 'Upload image'}</div><input aria-label="Logo image URL" value={form.logo_url} onChange={(event) => updateField('logo_url', event.target.value)} placeholder="Image URL" className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-xs" /></div><div className="space-y-3"><Field label="Business name" value={form.name} onChange={(value) => updateField('name', value)} visibility={form.visibility} /><div className="grid gap-2 sm:grid-cols-2"><SelectField label="Category" value={form.category_id ?? form.category?.id ?? ''} options={categoryOptions} onChange={(value) => setForm({ ...form, category_id: value })} /><Field label="Business type" value={form.business_type} onChange={(value) => updateField('business_type', value)} visibility={form.visibility} /></div><Field label="Phone" value={form.phone} onChange={(value) => updateField('phone', value)} visibilityField="phone" visibility={form.visibility} /></div></div><label className="mt-4 block text-xs font-semibold text-slate-700">Description<button type="button" className="ml-2 text-blue-700 hover:underline" onClick={() => setMessage('AI writing is not configured yet; you can write the description yourself.')}>Help me write it</button><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className="mt-1 w-full resize-y rounded border border-slate-300 p-2 text-sm font-normal" /></label><div className="mt-3 grid gap-2 sm:grid-cols-2"><Field label="Owner name" value={form.owner_name} onChange={(value) => updateField('owner_name', value)} visibilityField="owner_name" visibility={form.visibility} /><Field label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} visibilityField="email" visibility={form.visibility} /><SelectField label="City" value={form.city_id ?? form.city?.id ?? ''} options={cityOptions} onChange={(value) => setForm({ ...form, city_id: value })} visibilityField="city" visibility={form.visibility} onVisibilityChange={(value) => updateVisibility('city', value)} /><Field label="Region" value={form.region} onChange={(value) => updateField('region', value)} visibilityField="region" visibility={form.visibility} /><Field label="Website" value={form.website} onChange={(value) => updateField('website', value)} visibilityField="website" visibility={form.visibility} /></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={saveChanges} disabled={saving} className="inline-flex items-center gap-2 rounded bg-blue-700 px-5 py-2 font-bold text-white disabled:opacity-60">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save changes</>}</button>{message && <p className="text-sm text-emerald-700">{message}</p>}{error && <p className="text-sm text-red-700">{error}</p>}</div></section><section className="mt-6 rounded-xl bg-red-800 p-5 text-white"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black uppercase">Upgrade to a webpage</h2><p className="mt-1 text-sm text-red-100">Turn your claimed listing into your own webpage.<br />Try it free for 30 days.</p></div><button type="button" onClick={startTrial} disabled={trialStarting} className="rounded bg-white px-4 py-2 font-bold text-red-800 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-70">{trialStarting ? 'Starting...' : 'Start free 30-day trial'}</button></div></section><section className="mt-12"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Optional services</p><h2 className="text-3xl font-black">Marketplace</h2></div><div className="space-y-8"><MarketplaceGroup title="PrintLab" items={['Business cards', 'Workwear', 'Stickers', 'Vehicle branding']} /><MarketplaceGroup title="Get online fast" items={['WordPress basic website', 'Try free - 30 days']} /><MarketplaceGroup title="Advertising" items={['Facebook posts', 'Facebook Ads', 'Google Ads', 'LinkedIn Ads']} /></div></section></>}</div></main></div>;
}

function MarketplaceGroup({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-slate-300 bg-slate-50 p-4 sm:p-6"><h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-800">{title}</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <div key={item} className="flex min-h-24 items-end rounded-lg border-2 border-slate-300 bg-white p-3 text-sm font-bold text-slate-700">{item}</div>)}</div></section>;
}
