'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';
import PostcardEditor from '@/components/business/PostcardEditor';
import SpokenLanguagePicker from '@/components/business/SpokenLanguagePicker';

type Option = { id: number; name: string; country?: { id: number; name: string } };
type FormData = { name: string; category_id: string; category_suggestion: string; business_type: string; city_id: string; country_id: string; description: string; region: string; phone: string; contact_email: string; whatsapp_number: string; languages: string[]; website: string; logo_url: string; background_image: string; logo_file?: File | string; background_file?: File | string; address: string; postal_code: string; accent_color: string; overlay_color: string; overlay_opacity: number; visibility: Record<string, boolean> };
const DESCRIPTION_MAX_LENGTH = 500;
const emptyForm: FormData = { name: '', category_id: '', category_suggestion: '', business_type: '', city_id: '', country_id: '', description: '', region: '', phone: '', contact_email: '', whatsapp_number: '', languages: [], website: '', logo_url: '', background_image: '', address: '', postal_code: '', accent_color: '#2563EB', overlay_color: '#0F172A', overlay_opacity: 0.72, visibility: { address: true, phone: true, whatsapp: false, email: false, website: true, languages: true, description: true, business_type: true } };
const STORAGE_KEY = 'listacrosseu-new-business-draft';

function csrfToken() { return document.cookie.split(';').map((value) => value.trim().split('=')).find(([key]) => key === 'csrftoken')?.[1] || ''; }

export default function ListYourBusinessPageClient({ lang }: { lang: string }) {
  const searchParams = useSearchParams();
  const nextAction = searchParams.get('next') === 'generated-website' ? 'generated-website' : '';
  const [form, setForm] = useState<FormData>(emptyForm);
  const [categories, setCategories] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [countries, setCountries] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<Array<{ id: number; name: string; slug: string; canonical_path: string }>>([]);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const logoObjectUrl = useRef('');
  const backgroundObjectUrl = useRef('');

  useEffect(() => () => {
    if (logoObjectUrl.current) URL.revokeObjectURL(logoObjectUrl.current);
    if (backgroundObjectUrl.current) URL.revokeObjectURL(backgroundObjectUrl.current);
  }, []);

  useEffect(() => {
    if (searchParams.get('resume') === '1') {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) try {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({ ...emptyForm, ...parsed, contact_email: parsed.contact_email || parsed.email || '' });
      } catch { sessionStorage.removeItem(STORAGE_KEY); }
    }
    Promise.all(['all-categories', 'all-cities', 'all-countries'].map((path) => fetch(`${PUBLIC_API_BASE_URL}/api/listings/${path}/`, path === 'all-categories' ? { cache: 'no-store' } : undefined).then((response) => response.json())))
      .then(([categoryData, cityData, countryData]) => { setCategories(Array.isArray(categoryData) ? categoryData : categoryData.value || categoryData.results || []); setCities(Array.isArray(cityData) ? cityData : cityData.value || cityData.results || []); setCountries(Array.isArray(countryData) ? countryData : countryData.value || countryData.results || []); })
      .catch(() => setError('Unable to load the location and category options.')).finally(() => setLoading(false));
  }, [searchParams]);

  const visibleCities = useMemo(() => form.country_id ? cities.filter((city) => city.country?.id === Number(form.country_id)) : cities, [cities, form.country_id]);
  function update(field: keyof FormData, value: string | string[] | number | File) { setForm((current) => ({ ...current, [field]: value, ...(field === 'country_id' ? { city_id: '' } : {}) })); setError(''); setDuplicates([]); }
  function replaceObjectUrl(ref: MutableRefObject<string>, file: File) { if (ref.current) URL.revokeObjectURL(ref.current); const url = URL.createObjectURL(file); ref.current = url; return url; }
  function uploadLogo(file: File | undefined) { if (!file) return; const url = replaceObjectUrl(logoObjectUrl, file); setForm((current) => ({ ...current, logo_file: file, logo_url: url })); }
  function uploadBackground(file: File | undefined) { if (!file) return; const url = replaceObjectUrl(backgroundObjectUrl, file); setForm((current) => ({ ...current, background_file: file, background_image: url })); }
  function removeLogo() { if (logoObjectUrl.current) URL.revokeObjectURL(logoObjectUrl.current); logoObjectUrl.current = ''; setForm((current) => ({ ...current, logo_file: '', logo_url: '' })); }
  function removeBackground() { if (backgroundObjectUrl.current) URL.revokeObjectURL(backgroundObjectUrl.current); backgroundObjectUrl.current = ''; setForm((current) => ({ ...current, background_file: '', background_image: '' })); }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setError(''); setDuplicates([]); sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, logo_file: undefined, background_file: undefined }));
    if (form.description.length > DESCRIPTION_MAX_LENGTH) { setError(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`); setSubmitting(false); return; }
    const payload = { ...form, email: form.contact_email, category_id: suggestingCategory ? '' : form.category_id, category_suggestion: suggestingCategory ? form.category_suggestion : '' };
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => { if (key === 'logo_file' || key === 'background_file' || value instanceof File) return; body.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')); });
    if (form.logo_file instanceof File) body.append('logo', form.logo_file);
    if (form.background_file instanceof File) body.append('background', form.background_file);
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/create-business/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() }, body });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) { window.location.href = `/${lang}/login?next=${encodeURIComponent(`/${lang}/list-your-business?resume=1${nextAction ? `&next=${nextAction}` : ''}`)}`; return; }
    if (response.status === 409) { setDuplicates(data.duplicates || []); setError(data.detail || 'A likely matching business already exists.'); setSubmitting(false); return; }
    if (!response.ok) { setError(data.detail || 'Unable to create the business listing.'); setSubmitting(false); return; }
    sessionStorage.setItem('listacrosseu-pending-listing', JSON.stringify({ businessId: data.id, email: data.email || form.contact_email, pendingToken: data.pending_token || '', next: nextAction, authenticated: data.claim_status === 'verified' })); sessionStorage.removeItem(STORAGE_KEY);
    if (data.claim_status === 'verified') { window.location.href = `/${lang}/dashboard?business=${data.id}`; return; }
    window.location.href = `/${lang}/check-email?email=${encodeURIComponent(data.email || form.contact_email)}&next=${encodeURIComponent(`/${lang}/dashboard?business=${data.id}`)}`;
  }

  if (loading) return <div className="mx-auto max-w-3xl p-10 text-center text-slate-600"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  const category = categories.find((item) => item.id === Number(form.category_id));
  const city = cities.find((item) => item.id === Number(form.city_id));
  const country = countries.find((item) => item.id === Number(form.country_id));
  return <main className="mx-auto max-w-6xl px-5 py-12"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">ListAcrossEU</p><h1 className="mt-2 text-4xl font-black text-slate-900">List your business</h1><p className="mt-3 max-w-2xl text-slate-600">Create your owner listing using the same shared postcard presentation used by Claimed Listings.</p></div><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]"><form onSubmit={submit} className="listing-form rounded-2xl bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="form-label sm:col-span-2">Business name<input required value={form.name} onChange={(event) => update('name', event.target.value)} className="field" /></label><div className="form-label"><span>Category</span>{suggestingCategory ? <><input required value={form.category_suggestion} onChange={(event) => update('category_suggestion', event.target.value)} placeholder="Proposed category name" className="field" /><button type="button" onClick={() => { setSuggestingCategory(false); update('category_suggestion', ''); }} className="mt-2 text-sm font-semibold text-blue-700 hover:underline">Choose an existing category instead</button></> : <><select required value={form.category_id} onChange={(event) => update('category_id', event.target.value)} className="field"><option value="">Choose a category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={() => { setSuggestingCategory(true); update('category_id', ''); }} className="mt-2 text-sm font-semibold text-blue-700 hover:underline">Can&apos;t find your category? Suggest one</button></>}</div><label className="form-label">Business type<input required value={form.business_type} onChange={(event) => update('business_type', event.target.value)} className="field" /></label><label className="form-label">Country<select required value={form.country_id} onChange={(event) => update('country_id', event.target.value)} className="field"><option value="">Choose a country</option>{countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="form-label">City<select required value={form.city_id} onChange={(event) => update('city_id', event.target.value)} className="field"><option value="">Choose a city</option>{visibleCities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="form-label sm:col-span-2">Description<textarea required value={form.description} onChange={(event) => update('description', event.target.value)} rows={4} className="field" /></label><label className="form-label">Region<input value={form.region} onChange={(event) => update('region', event.target.value)} className="field" /></label><label className="form-label">Address<input value={form.address} onChange={(event) => update('address', event.target.value)} className="field" /></label><label className="form-label">Post code<input value={form.postal_code} onChange={(event) => update('postal_code', event.target.value)} className="field" /></label><label className="form-label">Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} className="field" /></label><label className="form-label">WhatsApp<input value={form.whatsapp_number} onChange={(event) => update('whatsapp_number', event.target.value)} className="field" /></label><label className="form-label">Business contact email<input type="email" value={form.contact_email} onChange={(event) => update('contact_email', event.target.value)} className="field" /></label><label className="form-label">Spoken languages<SpokenLanguagePicker value={form.languages} onChange={(languages) => update('languages', languages)} /></label><label className="form-label">Website<input type="url" value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://" className="field" /></label><label className="form-label">Logo image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadLogo(event.target.files?.[0])} className="field" />{form.logo_url && <button type="button" onClick={removeLogo} className="mt-2 text-sm font-semibold text-red-700 hover:underline">Remove logo</button>}</label><label className="form-label sm:col-span-2">Postcard background image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadBackground(event.target.files?.[0])} className="field" />{form.background_image && <button type="button" onClick={removeBackground} className="mt-2 text-sm font-semibold text-red-700 hover:underline">Restore default background</button>}</label></div>{error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p>{duplicates.length > 0 && <div className="mt-3 space-y-2">{duplicates.map((item) => <a key={item.canonical_path} href={item.canonical_path} className="block font-semibold underline">{item.name} — Is this your business? Claim it instead.</a>)}</div>}</div>}<button disabled={submitting} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Create my owner listing</button></form><aside><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Shared postcard preview</p><div className="mt-6"><PostcardEditor value={{ name: form.name, description: form.description, logo_url: form.logo_url, background_image: form.background_image, phone: form.phone, contact_email: form.contact_email, whatsapp_number: form.whatsapp_number, website: form.website, address: form.address, address_line1: form.address, postal_code: form.postal_code, region: form.region, languages: form.languages, accent_color: form.accent_color, overlay_color: form.overlay_color, overlay_opacity: form.overlay_opacity, category, business_type: form.business_type, city, country, visibility: form.visibility, category_id: form.category_id }} categories={categories} onLogoUpload={uploadLogo} onBackgroundUpload={uploadBackground} allowMediaUpload={false} canvasMode="preview" showStyleControls showPreviewButton={false} onChange={(field, value) => update(field as keyof FormData, value as never)} /></div></aside></div><style jsx>{`.listing-form .form-label{display:block;color:#334155;font-size:.875rem;font-weight:600}.listing-form .field{display:block;width:100%;margin-top:.375rem;border:1px solid #cbd5e1;border-radius:.5rem;padding:.625rem;color:#0f172a;background:#fff}.listing-form .field::placeholder{color:#64748b;opacity:1}.listing-form .field:focus{outline:2px solid #2563eb;outline-offset:1px}.listing-form option{color:#0f172a;background:#fff}`}</style></main>;
}
