'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

type Option = { id: number; name: string; country?: { id: number; name: string } };
type FormData = { name: string; category_id: string; business_type: string; city_id: string; country_id: string; description: string; region: string; phone: string; email: string; website: string; logo_url: string; address: string; postal_code: string };
const emptyForm: FormData = { name: '', category_id: '', business_type: '', city_id: '', country_id: '', description: '', region: '', phone: '', email: '', website: '', logo_url: '', address: '', postal_code: '' };
const STORAGE_KEY = 'listacrosseu-new-business-draft';

export default function ListYourBusinessPageClient({ lang }: { lang: string }) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [categories, setCategories] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [countries, setCountries] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<Array<{ name: string; canonical_path: string }>>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && searchParams.get('resume') === '1') { try { setForm({ ...emptyForm, ...JSON.parse(saved) }); } catch { sessionStorage.removeItem(STORAGE_KEY); } }
    Promise.all(['all-categories', 'all-cities', 'all-countries'].map((path) => fetch(`${PUBLIC_API_BASE_URL}/api/listings/${path}/`).then((response) => response.json())))
      .then(([categoryData, cityData, countryData]) => { setCategories(categoryData.value || categoryData.results || categoryData); setCities(cityData.value || cityData.results || cityData); setCountries(countryData.value || countryData.results || countryData); })
      .catch(() => setError('Unable to load the location and category options.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const visibleCities = useMemo(() => form.country_id ? cities.filter((city) => city.country?.id === Number(form.country_id)) : cities, [cities, form.country_id]);
  function update(field: keyof FormData, value: string) { setForm((current) => ({ ...current, [field]: value, ...(field === 'country_id' ? { city_id: '' } : {}) })); setError(''); setDuplicates([]); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setError(''); setDuplicates([]);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/create-business/`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) { window.location.href = `/${lang}/login?next=${encodeURIComponent(`/${lang}/list-your-business?resume=1`)}`; return; }
    if (response.status === 409) { setDuplicates(data.duplicates || []); setError(data.detail || 'A likely matching business already exists.'); setSubmitting(false); return; }
    if (!response.ok) { setError(data.detail || 'Unable to create the business listing.'); setSubmitting(false); return; }
    sessionStorage.removeItem(STORAGE_KEY); window.location.href = `/${lang}/dashboard?business=${data.id}`;
  }

  if (loading) return <div className="mx-auto max-w-3xl p-10 text-center text-slate-600"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  return <main className="mx-auto max-w-4xl px-5 py-12"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">ListAcrossEU</p><h1 className="mt-2 text-4xl font-black text-slate-900">List your business</h1><p className="mt-3 max-w-2xl text-slate-600">Create your free listing and manage it from your Listing module.</p></div><form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2">Business name<input required value={form.name} onChange={(event) => update('name', event.target.value)} className="field" /></label><label>Category<select required value={form.category_id} onChange={(event) => update('category_id', event.target.value)} className="field"><option value="">Choose a category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Business type / what you do<input required value={form.business_type} onChange={(event) => update('business_type', event.target.value)} placeholder="e.g. family restaurant" className="field" /></label><label>Country<select required value={form.country_id} onChange={(event) => update('country_id', event.target.value)} className="field"><option value="">Choose a country</option>{countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>City<select required value={form.city_id} onChange={(event) => update('city_id', event.target.value)} className="field"><option value="">Choose a city</option>{visibleCities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="sm:col-span-2">Short description<textarea required value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} className="field" /></label><label>Region<input value={form.region} onChange={(event) => update('region', event.target.value)} className="field" /></label><label>Address<input value={form.address} onChange={(event) => update('address', event.target.value)} className="field" /></label><label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} className="field" /></label><label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className="field" /></label><label>Website<input type="url" value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://" className="field" /></label><label>Logo/image URL<input type="url" value={form.logo_url} onChange={(event) => update('logo_url', event.target.value)} className="field" /></label></div>{error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p>{duplicates.length > 0 && <div className="mt-3 space-y-2">{duplicates.map((item) => <a key={item.canonical_path} href={item.canonical_path} className="block font-semibold underline">{item.name} — Is this your business? Claim it instead.</a>)}</div>}</div>}<button disabled={submitting} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Create my free listing</button><p className="mt-3 text-xs text-slate-500">You can add more details later from your Listing module.</p></form><style jsx>{`.field{display:block;width:100%;margin-top:.375rem;border:1px solid #cbd5e1;border-radius:.5rem;padding:.625rem;color:#0f172a;background:#fff}.field:focus{outline:2px solid #2563eb;outline-offset:1px}`}</style></main>;
}
