'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, EyeOff, Loader2, LogOut, Menu, Save, X } from 'lucide-react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';
import ClaimedListingRenderer from '@/components/business/ClaimedListingRenderer';
import SpokenLanguagePicker from '@/components/business/SpokenLanguagePicker';
import PostcardEditor from '@/components/business/PostcardEditor';
import DashboardFooter from '@/components/dashboard/DashboardFooter';
import GeneratedWebsiteRenderer from '@/components/premium/GeneratedWebsiteRenderer';
import type { GeneratedWebsite } from '@/components/premium/generated-page-schema';
import { GENERATED_PAGE_TEMPLATES, resolveGeneratedTemplateId } from '@/components/premium/generated-page-registry';

type Option = { id: number; name: string };
type DashboardPanel = 'overview' | 'claimed-listing' | 'password';

type DashboardBusiness = {
  id: number;
  name: string;
  slug: string;
  tier: string;
  is_published: boolean;
  phone: string;
  email: string;
  contact_email?: string;
  whatsapp_number?: string;
  languages?: string[];
  website: string;
  description: string;
  owner_name: string;
  region: string;
  business_type: string;
  logo_url: string;
  image_url: string;
  background_image?: string;
  gallery_images?: string[];
  overlay_color?: string;
  overlay_opacity?: number;
  address: string;
  address_line1: string;
  postal_code: string;
  canonical_path: string;
  category_id?: number;
  city_id?: number;
  country: { id: number; name: string; slug: string } | null;
  city: { id: number; name: string; slug: string } | null;
  category: { id: number; name: string; slug: string } | null;
  visibility: Record<string, boolean>;
  claim_status: 'pending' | 'verified' | 'expired';
  password_setup_required?: boolean;
  claimed_listing_status?: 'draft' | 'published';
  pending_category_suggestion?: string;
  category_is_public?: boolean;
  claimed_listing_draft?: Record<string, unknown>;
  accent_color?: string;
  generated_website?: {
    status: string;
    page_title: string;
    target_location: string;
    trial: { status?: string; started_at?: string | null; ends_at?: string | null };
    public_url?: string;
    template_id?: string;
    template_variant?: string;
    website?: GeneratedWebsite['website'];
  };
};

const defaultVisibility = { owner_name: false, email: false, phone: true, website: true, city: true, region: true, country: true };
function canonicalDashboardBusiness(value: DashboardBusiness): DashboardBusiness {
  return { ...value, visibility: { ...defaultVisibility, ...value.visibility } };
}
const passwordSetupRequired = false;
function hasGeneratedWebsiteAccess(business: DashboardBusiness | null) {
  return false;
}

function GeneratedWebsiteComingSoon({ needsPasswordSetup = false }: { needsPasswordSetup?: boolean }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Product 2</p><h2 className="mt-1 text-2xl font-black text-slate-900">Generated Website</h2><p className="mt-3 text-sm leading-6 text-slate-600">Coming soon. The Generated Website product is being prepared and is not available to claimants yet.</p>{needsPasswordSetup && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><span className="font-bold">Create your password</span> to keep access to your account after this session. <a href="?section=password" className="font-bold text-amber-800 underline">Set it now</a></p>}</section>;
}
function hasPublishedClaimedListing(business: DashboardBusiness | null) {
  return Boolean(business?.claimed_listing_status === 'published' && business.is_published);
}
function csrfToken() {
  return document.cookie.split(';').map((value) => value.trim().split('=')).find(([key]) => key === 'csrftoken')?.[1] || '';
}

function Building2Placeholder() { return <span className="text-xs font-bold text-slate-400">Logo</span>; }

function VisibilityToggle({ field, value, onChange }: { field: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label className="inline-flex cursor-pointer items-center gap-1 text-[10px] font-medium text-slate-500"><input type="checkbox" className="sr-only" checked={value} onChange={(event) => onChange(event.target.checked)} /><span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-50 text-slate-400'}`} aria-hidden="true">{value ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</span><span className="sr-only">Show {field} on listing</span></label>;
}

function Field({ label, value, onChange, visibilityField, visibility, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; visibilityField?: string; visibility: Record<string, boolean>; type?: string }) {
  return <label className="block text-xs font-semibold text-slate-700"><span className="mb-1 flex items-center justify-between gap-2">{label}{visibilityField && <VisibilityToggle field={label} value={visibility[visibilityField] !== false} onChange={(next) => onChange(`__visibility:${visibilityField}:${next}`)} />}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" /></label>;
}

function SelectField({ label, value, options, onChange, visibilityField, visibility, onVisibilityChange }: { label: string; value: number | ''; options: Option[]; onChange: (value: number) => void; visibilityField?: string; visibility?: Record<string, boolean>; onVisibilityChange?: (value: boolean) => void }) {
  return <label className="block text-xs font-semibold text-slate-700"><span className="mb-1 flex items-center justify-between gap-2">{label}{visibilityField && visibility && onVisibilityChange && <VisibilityToggle field={label} value={visibility[visibilityField] !== false} onChange={onVisibilityChange} />}</span><select value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}

function StatusBadge({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'slate' }) {
  return <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${tone === 'green' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}><Check className="h-4 w-4" />{children}</span>;
}

function MarketplaceGroup({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-xl border border-slate-300 bg-slate-50 p-4 sm:p-6"><h3 className="mb-4 text-lg font-black uppercase tracking-wide text-slate-800">{title}</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <div key={item} className="flex min-h-24 items-end rounded-lg border-2 border-slate-300 bg-white p-3 text-sm font-bold text-slate-700">{item}</div>)}</div></section>;
}

function Benefit({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-black text-slate-900">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{children}</p></div>;
}

function Comparison({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return <div className="rounded-xl border border-slate-200 p-4"><h3 className="font-black text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-600">{subtitle}</p><ul className="mt-3 space-y-1 text-sm text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>;
}

function GeneratedWebsiteUpgradePanel({ startTrial, trialStarting }: { startTrial: () => void; trialStarting: boolean }) {
  return <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Product 2</p><h2 className="mt-2 text-2xl font-black text-slate-900">Create your Generated Website</h2><p className="mt-2 text-lg font-bold text-slate-700">Edit and preview before payment and publishing.</p><p className="mt-2 text-sm leading-6 text-slate-600">Use the information already in your listing and expand it into a website built around your services, locations and customers.</p></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><Benefit title="Dedicated service pages">Give important services their own content instead of squeezing everything into one listing.</Benefit><Benefit title="Target different locations">Create content for cities, regions or countries where you actually provide services, without implying a physical location.</Benefit><Benefit title="More room for your business">Add more images, services, contact information and richer content beyond the postcard.</Benefit><Benefit title="Built for visibility">Use proper page titles, descriptions and structured SEO for more opportunities to be discovered, without promising rankings.</Benefit></div><div className="mt-6 grid gap-3 md:grid-cols-2"><Comparison title="Claimed Listing" subtitle="Your business postcard inside ListAcrossEU" items={['Business identity', 'Contact information', 'Short description', 'Languages', 'Visual postcard presentation']} /><Comparison title="Generated Website" subtitle="A fuller online presence with more room to grow" items={['Services', 'Richer content', 'Images', 'Location-focused content', 'Multiple sections/pages as supported']} /></div><div className="mt-6 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">Create a private website preview</p><p className="mt-1 text-sm text-slate-600">We will use the information already in your listing. Choose a template and edit the preview before payment and publishing.</p></div><button type="button" onClick={startTrial} disabled={trialStarting} className="shrink-0 rounded bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">{trialStarting ? 'Creating preview...' : 'Create my website preview'}</button></div></section>;
}

function GeneratedWebsitePreviewSection(_props: { business: DashboardBusiness; lang?: string; createPreview: () => void; startTrial: () => void; creating: boolean }) {
  return null;
}

function LegacyGeneratedWebsitePreviewSection({ business, lang = 'en', createPreview, startTrial, creating, templateOverride }: { business: DashboardBusiness; lang?: string; createPreview: () => void; startTrial: () => void; creating: boolean; templateOverride?: 'classic-business' | 'service-pro' }) {
  const website = business.generated_website?.website;
  const currentTemplate = resolveGeneratedTemplateId(business.generated_website?.template_id);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic-business' | 'service-pro'>(currentTemplate === 'service-pro' ? 'service-pro' : 'classic-business');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMessage, setTemplateMessage] = useState('');
  useEffect(() => { setSelectedTemplate(currentTemplate === 'service-pro' ? 'service-pro' : 'classic-business'); }, [business.id, currentTemplate]);
  async function changeTemplate(next: 'classic-business' | 'service-pro') {
    if (next === selectedTemplate || templateSaving) return;
    setSelectedTemplate(next);
    setTemplateSaving(true);
    setTemplateMessage('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${business.id}/website/`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() }, body: JSON.stringify({ template_id: next }) });
    if (!response.ok) { setSelectedTemplate(currentTemplate === 'service-pro' ? 'service-pro' : 'classic-business'); setTemplateMessage('Unable to save the template selection.'); } else setTemplateMessage('Template saved.');
    setTemplateSaving(false);
  }
  const initial: GeneratedWebsite | null = website ? { business_id: business.id, business_slug: business.slug, business_name: business.name, template_id: templateOverride || selectedTemplate, template_variant: typeof website.template_variant === 'string' ? website.template_variant : 'variant-1', website } : null;
  return <><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Product 2</p>{initial ? <><h2 className="mt-2 text-2xl font-black text-slate-900">Generated Website</h2><p className="mt-2 text-sm leading-6 text-slate-600">Edit your preview, switch between Classic Business and Service Pro, then proceed to payment and publishing.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Website 1 Language</p><p className="mt-1 text-lg font-black text-slate-900">€9.95 <span className="text-sm font-semibold">+ VAT / month</span></p></div><div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Website 4 Languages</p><p className="mt-1 text-lg font-black text-slate-900">€14.95 <span className="text-sm font-semibold">+ VAT / month</span></p></div></div><button type="button" onClick={startTrial} disabled={creating} className="mt-4 rounded bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">Proceed to Payment and Publish</button></> : <><h2 className="mt-2 text-2xl font-black text-slate-900">Upgrade to a full website</h2><p className="mt-2 text-lg font-bold text-slate-700">Turn your listing into a complete business website.</p><p className="mt-2 text-sm leading-6 text-slate-600">Use the information already in your listing and expand it into a website built around your services, locations and customers.</p></>}</div>{!initial && <div className="mt-6 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">Create a private website preview</p><p className="mt-1 text-sm text-slate-600">We will use the information already in your listing. The preview remains editable until payment and publishing.</p></div><button type="button" onClick={createPreview} disabled={creating} className="shrink-0 rounded bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">{creating ? 'Creating preview...' : 'Create my website preview'}</button></div>}</section>{initial && <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><GeneratedWebsiteRenderer initial={initial} businessId={String(business.id)} lang={lang} privatePreview /></section>}</>;
}

export default function DashboardPageClient({ lang, initialBusinessId, initialPanel = 'overview', passwordSetupRequired = false }: { lang: string; initialBusinessId?: number; initialPanel?: DashboardPanel; passwordSetupRequired?: boolean }) {
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
  const [panel, setPanel] = useState<DashboardPanel>(initialPanel);
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [logoUploading, setLogoUploading] = useState(false);
  const [csrfValue, setCsrfValue] = useState('');

  useEffect(() => {
    fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/auth/`, { credentials: 'include' })
      .then(async (response) => { const data = await response.json().catch(() => ({})); if (data.csrfToken) setCsrfValue(data.csrfToken); return fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/`, { credentials: 'include', cache: 'no-store' }); })
      .then(async (response) => { if (response.status === 401 || response.status === 403) throw new Error('AUTH_REQUIRED'); if (!response.ok) throw new Error('LOAD_FAILED'); return response.json(); })
      .then((data) => {
        const items = data.results || [];
        if (!items.length) { setError("You don't have a business linked yet."); return; }
        setBusinesses(items);
        const initial = items.find((item: DashboardBusiness) => item.id === initialBusinessId) || items[0];
        setSelectedId(initial?.id ?? null);
        setForm(initial ? canonicalDashboardBusiness(initial) : null);
      })
      .catch((reason) => { if (reason.message === 'AUTH_REQUIRED') { window.location.href = `/${lang}/login?next=/${lang}/dashboard`; return; } setError('Unable to load your dashboard.'); })
      .finally(() => setLoading(false));
  }, [lang, initialBusinessId]);

  useEffect(() => {
    Promise.all([fetch(`${PUBLIC_API_BASE_URL}/api/listings/all-categories/`, { cache: 'no-store' }).then((response) => response.json()), fetch(`${PUBLIC_API_BASE_URL}/api/listings/cities/`).then((response) => response.json())]).then(([categories, cities]) => { setCategoryOptions(Array.isArray(categories) ? categories : categories.value || categories.results || []); setCityOptions(Array.isArray(cities) ? cities : cities.value || cities.results || []); }).catch(() => undefined);
  }, []);

  const selected = useMemo(() => businesses.find((item) => item.id === selectedId) || null, [businesses, selectedId]);
  useEffect(() => { if (selected) setForm(canonicalDashboardBusiness(selected)); }, [selected]);

  useEffect(() => {
    if (form?.category && !categoryOptions.some((option) => option.id === form.category?.id)) {
      setCategoryOptions((items) => [...items, { id: form.category!.id, name: `${form.category!.name} (currently unpublished)` }]);
    }
  }, [form, categoryOptions]);

  const updateField = (field: keyof DashboardBusiness, value: string) => {
    if (!form) return;
    if (value.startsWith('__visibility:')) { const [, key, next] = value.split(':'); setForm({ ...form, visibility: { ...form.visibility, [key]: next === 'true' } }); return; }
    setForm({ ...form, [field]: value });
  };
  const updateVisibility = (field: string, value: boolean) => { if (form) setForm({ ...form, visibility: { ...form.visibility, [field]: value } }); };

  async function saveChanges() {
    if (!form || saving) return;
    const wasPublished = hasPublishedClaimedListing(form);
    setSaving(true); setMessage(''); setError('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/claimed-listing/draft/`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfValue || csrfToken() }, body: JSON.stringify({ name: form.name, category_id: form.category_id, city_id: form.city_id, business_type: form.business_type, phone: form.phone, contact_email: form.contact_email, whatsapp_number: form.whatsapp_number, languages: form.languages || [], description: form.description, owner_name: form.owner_name, email: form.email, website: form.website, logo_url: form.logo_url, image_url: form.image_url, background_image: form.background_image, gallery_images: form.gallery_images || [], overlay_color: form.overlay_color, overlay_opacity: form.overlay_opacity, accent_color: form.accent_color, region: form.region, address: form.address, address_line1: form.address_line1, postal_code: form.postal_code, visibility: form.visibility }) });
    if (response.ok) { const updated = canonicalDashboardBusiness(await response.json()); setForm(updated); setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item)); setMessage(wasPublished ? 'Draft saved. Publish changes to update the public listing.' : 'Draft saved.'); } else { const data = await response.json().catch(() => ({})); setError(data.detail || 'Unable to save changes.'); }
    setSaving(false);
  }
  async function publishClaimedListing() {
    if (!form) return;
    const wasPublished = hasPublishedClaimedListing(form);
    setMessage(''); setError('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/claimed-listing/publish/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfValue || csrfToken() } });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { const updated = canonicalDashboardBusiness(data); setForm(updated); setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item)); setMessage(wasPublished ? 'Changes published. The public listing is updated.' : 'Claimed Listing published.'); }
    else setError(data.detail || 'Unable to publish the Claimed Listing.');
  }

  async function uploadLogo(file: File | undefined) {
    if (!form || !file) return;
    setLogoUploading(true); setError(''); const body = new FormData(); body.append('logo', file);
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/logo/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfValue || csrfToken() }, body });
    const data = await response.json().catch(() => ({})); if (response.ok) { const updated = { ...data, visibility: { ...defaultVisibility, ...data.visibility } }; setForm(updated); setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item)); } else setError(data.detail || 'Unable to upload the logo.'); setLogoUploading(false);
  }
  async function removeLogo() {
    if (!form) return;
    setLogoUploading(true); setError(''); const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/logo/`, { method: 'DELETE', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() } });
    const data = await response.json().catch(() => ({})); if (response.ok) { const updated = { ...data, visibility: { ...defaultVisibility, ...data.visibility } }; setForm(updated); setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item)); } else setError(data.detail || 'Unable to remove the logo.'); setLogoUploading(false);
  }
  async function uploadBackground(file: File | undefined) {
    if (!form || !file) return;
    setLogoUploading(true); setError('');
    const body = new FormData();
    body.append('background', file);
    try {
      // Keep uploads same-origin so the Next development proxy forwards the
      // multipart request and browser session/CSRF cookies consistently.
      const response = await fetch(`/api/dashboard/businesses/${form.id}/claimed-listing/background/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfValue || csrfToken() }, body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.detail || 'Unable to upload the background.');
        return;
      }
      const backgroundImage = data.background_image || data.claimed_listing_draft?.background_image;
      if (!backgroundImage) {
        setError('The background upload completed without a usable image URL.');
        return;
      }
      // Apply only the uploaded background. Other unsaved editor changes must
      // remain in memory when the upload response arrives.
      setForm((current) => current ? { ...current, background_image: backgroundImage } : current);
      setBusinesses((items) => items.map((item) => item.id === form.id ? { ...item, background_image: backgroundImage } : item));
    } catch {
      setError('Unable to upload the background. Please try again.');
    } finally {
      setLogoUploading(false);
    }
  }
  async function uploadGallery(slot: number, file: File | undefined) {
    if (!form || !file) return;
    setLogoUploading(true); setError('');
    const body = new FormData(); body.append('slot', String(slot)); body.append('image', file);
    try {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/claimed-listing/gallery/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfValue || csrfToken() }, body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.detail || 'Unable to upload the business photo.'); return; }
      const updated = { ...data, visibility: { ...defaultVisibility, ...data.visibility } };
      setForm(updated); setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch { setError('Unable to upload the business photo. Please try again.'); } finally { setLogoUploading(false); }
  }
  async function removeGallery(slot: number) {
    if (!form) return;
    setLogoUploading(true); setError('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/claimed-listing/gallery/?slot=${slot}`, { method: 'DELETE', credentials: 'include', headers: { 'X-CSRFToken': csrfValue || csrfToken() } });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { const updated = { ...data, visibility: { ...defaultVisibility, ...data.visibility } }; setForm(updated); setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item)); } else setError(data.detail || 'Unable to remove the business photo.');
    setLogoUploading(false);
  }
  async function logout() { const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/logout/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfValue || csrfToken() } }); if (response.ok) window.location.href = `/${lang}`; else setError('Unable to log out. Please try again.'); }
  async function changePassword(event: React.FormEvent) { event.preventDefault(); const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/password/`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfValue || csrfToken() }, body: JSON.stringify(passwords) }); setMessage(response.ok ? 'Password changed.' : ((await response.json().catch(() => ({}))).detail || 'Unable to change password.')); }

  function selectPanel(next: DashboardPanel) { setPanel(next); setMobileNav(false); setMessage(''); setError(''); }
  async function createWebsitePreview() {
    if (!form || trialStarting) return;
    setTrialStarting(true); setError('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${form.id}/website/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() } });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const updated = { ...form, generated_website: { status: data.website?.status || 'draft', page_title: data.website?.page_title || form.name, target_location: data.website?.target_location || '', trial: data.website?.trial || { status: 'not_started', started_at: null, ends_at: null }, website: data.website } };
      setForm(updated);
      setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item));
    } else setError(data.detail || 'Unable to create your website preview.');
    setTrialStarting(false);
  }

  function proceedToPayment() {
    setMessage('Payment and publishing will be available next. Your website remains editable and private.');
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading dashboard...</div>;
  if (error && !form) return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-md rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-slate-900">Dashboard</h1><p className="mt-3 text-slate-600">{error}</p>{error.includes('sign in') && <a className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-semibold text-white" href={`/${lang}/login`}>Sign in</a>}<a className="ml-2 mt-6 inline-flex rounded border border-slate-300 px-4 py-2 font-semibold text-slate-700" href={`/${lang}`}>Return</a></div></div>;

  const generatedAccess = hasGeneratedWebsiteAccess(form);
  const openListing = () => { if (form && hasPublishedClaimedListing(form)) window.open(`/${lang}/business/${encodeURIComponent(form.slug)}/`, '_blank', 'noopener,noreferrer'); };
  const navButton = (value: DashboardPanel, label: string) => <button type="button" onClick={() => selectPanel(value)} className={`block w-full px-2 py-2 text-left text-sm font-bold uppercase tracking-wider ${panel === value ? 'text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>;

  return <div className="min-h-screen bg-slate-100 text-slate-900"><button type="button" onClick={() => setMobileNav(!mobileNav)} className="fixed left-4 top-4 z-30 rounded bg-slate-900 p-2 text-white lg:hidden" aria-label="Open dashboard menu">{mobileNav ? <X /> : <Menu />}</button><aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-neutral-900 px-5 py-8 text-white transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}><div className="mb-12 text-2xl font-black tracking-wide">DASHBOARD</div><nav className="space-y-2">{navButton('overview', 'Overview')}{navButton('claimed-listing', 'Claimed Listing')}{generatedAccess && <a href={`/${lang}/dashboard/generated-website?business=${form?.id}`} className="block px-2 py-2 text-left text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white">Website</a>}{navButton('password', passwordSetupRequired ? 'Create Password' : 'Change Password')}<button type="button" onClick={logout} className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white"><LogOut className="h-4 w-4" />Logout</button></nav></aside><main className="min-h-screen px-4 py-8 lg:ml-64 lg:px-10"><div className="mx-auto max-w-6xl">{businesses.length > 1 && <label className="mb-6 block max-w-sm text-sm font-semibold">Your business<select value={selectedId || ''} onChange={(event) => setSelectedId(Number(event.target.value))} className="mt-1 block w-full rounded border border-slate-300 bg-white p-2"><option value="">Select a business</option>{businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}{panel === 'password' ? <PasswordPanel passwords={passwords} setPasswords={setPasswords} changePassword={changePassword} setup={passwordSetupRequired} /> : panel === 'claimed-listing' ? <ClaimedListingPanel form={form} categoryOptions={categoryOptions} cityOptions={cityOptions} updateField={updateField} updateVisibility={updateVisibility} setForm={setForm} setBusinesses={setBusinesses} saveChanges={saveChanges} publishChanges={publishClaimedListing} saving={saving} message={message} error={error} logoUploading={logoUploading} uploadLogo={uploadLogo} removeLogo={removeLogo} uploadBackground={uploadBackground} uploadGallery={uploadGallery} removeGallery={removeGallery} openListing={openListing} createPreview={createWebsitePreview} startTrial={proceedToPayment} trialStarting={trialStarting} /> : <OverviewPanel lang={lang} form={form} generatedAccess={generatedAccess} setPanel={selectPanel} openListing={openListing} createPreview={createWebsitePreview} startTrial={proceedToPayment} trialStarting={trialStarting} />}</div><DashboardFooter lang={lang} /></main></div>;
}

function PasswordPanel({ passwords, setPasswords, changePassword, setup }: { passwords: { current_password: string; new_password: string; confirm_password: string }; setPasswords: (value: { current_password: string; new_password: string; confirm_password: string }) => void; changePassword: (event: React.FormEvent) => void; setup?: boolean }) {
  return <section className="max-w-xl rounded-xl bg-white p-6 shadow"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Account</p><h1 className="mt-2 text-3xl font-black">{setup ? 'Create your password' : 'Change Password'}</h1>{setup && <p className="mt-2 text-slate-600">Choose a password so you can sign in again after this verification session ends.</p>}<form onSubmit={changePassword} className="mt-6 space-y-4">{!setup && <Field label="Current password" type="password" value={passwords.current_password} onChange={(value) => setPasswords({ ...passwords, current_password: value })} visibility={{}} />}<Field label={setup ? 'Password' : 'New password'} type="password" value={passwords.new_password} onChange={(value) => setPasswords({ ...passwords, new_password: value })} visibility={{}} /><Field label="Confirm password" type="password" value={passwords.confirm_password} onChange={(value) => setPasswords({ ...passwords, confirm_password: value })} visibility={{}} /><button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">{setup ? 'Create password' : 'Save password'}</button></form></section>;
}

function ComingSoonCard({ title, copy, example, benefits, prominent = false, price, normalPrice }: { title: string; copy: string; example?: string; benefits: string[]; prominent?: boolean; price?: string; normalPrice?: string }) {
  return <article className={'rounded-2xl border bg-white p-6 shadow-sm ' + (prominent ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-200')}><div className="flex items-center justify-between gap-3"><span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-800">Coming soon</span>{prominent && <span className="text-xs font-bold text-violet-700">Launch price · Best value</span>}</div><h3 className="mt-3 text-2xl font-black text-slate-900">{title}</h3>{price && <div className="mt-3"><p className="text-xl font-black text-slate-900">{price}</p>{normalPrice && <p className="mt-1 text-xs text-slate-500 line-through">Normal price {normalPrice}</p>}</div>}<p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>{example && !price && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-700">{example}</p>}<ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">{benefits.map((benefit) => <li key={benefit} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{benefit}</li>)}</ul></article>;
}

function FreeProductOverview({ form, setPanel, openListing }: { form: DashboardBusiness; setPanel: (panel: DashboardPanel) => void; openListing: () => void }) {
  return <><header className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Owner overview</p><h1 className="mt-2 text-3xl font-black">Welcome to your dashboard</h1></header><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Your free product</p><h2 className="mt-1 text-2xl font-black">Claimed Listing</h2><p className="mt-5 text-lg font-bold text-slate-900">{form.name}</p><p className="mt-1 text-sm text-slate-600">{form.is_published ? 'Published in the public directory.' : 'Not currently published in the public directory.'}</p></div><StatusBadge tone={form.claim_status === 'verified' ? 'green' : 'slate'}>{form.claim_status === 'verified' ? 'Claim verified' : 'Verification pending'}</StatusBadge></div><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => setPanel('claimed-listing')} className="rounded bg-blue-700 px-4 py-2 font-bold text-white">Edit claimed listing</button>{hasPublishedClaimedListing(form) && <button type="button" onClick={openListing} className="rounded border border-emerald-700 px-4 py-2 font-bold text-emerald-800">View live listing</button>}</div></section><section className="mt-10"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Future products</p><h2 className="mt-2 text-3xl font-black text-slate-900">More ways to grow your business online</h2><p className="mt-3 text-slate-600">Your free ListAcrossEU listing is only the beginning. Soon you&apos;ll be able to turn your business information into a complete website, use your own domain and create professional business email addresses.</p></div><div className="mt-6 grid gap-5 lg:grid-cols-2"><ComingSoonCard title="Website • 1 Language" copy="A complete multi-page website for businesses that only need one language." price="€9.95 / month + VAT" benefits={['Multi-page website', 'Multiple professional designs', 'Edit your content anytime', 'Services, gallery, contact form and map', 'AI writing suggestions', 'Hosting included']} /><ComingSoonCard prominent title="Website • Up to 4 Languages" copy="A complete multilingual website for businesses serving customers across Europe." price="€14.95 / month + VAT" normalPrice="€19.95 / month + VAT" benefits={['Everything in the 1-language website', 'Up to 4 website languages', 'Multilingual navigation and content', 'Multiple professional designs', 'AI writing suggestions', 'Hosting included']} /><ComingSoonCard title="Custom Domain" copy="Use your own professional web address with your ListAcrossEU website." example="www.yourbusiness.com" benefits={['Connect a domain you already own', 'Register a new domain through ListAcrossEU', 'Use it with your Generated Website']} /><ComingSoonCard title="Professional Email" copy="Use a professional email address that matches your business." example="info@yourbusiness.com" benefits={['Professional business identity', 'One or more email accounts', 'Works with your domain and Generated Website']} /></div><p className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Keep your free listing up to date. Your existing business information will make setting up these new services much faster when they become available.</p></section></>;
}

function OverviewPanel(props: { lang: string; form: DashboardBusiness | null; generatedAccess: boolean; setPanel: (panel: DashboardPanel) => void; openListing: () => void; createPreview: () => void; startTrial: () => void; trialStarting: boolean }) {
  if (!props.form) return null;
  return <FreeProductOverview form={props.form} setPanel={props.setPanel} openListing={props.openListing} />;
}

function LegacyOverviewPanel(props: { lang: string; form: DashboardBusiness | null; generatedAccess: boolean; setPanel: (panel: DashboardPanel) => void; openListing: () => void; createPreview: () => void; startTrial: () => void; trialStarting: boolean }) {
  if (!props.form) return null;
  return <><section className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Claimed Listing</p><p className="mt-2 font-bold text-slate-900">{props.form.claim_status === 'verified' ? 'Verified owner' : 'Verification pending'} · {props.form.claimed_listing_status === 'published' ? 'Published' : 'Draft not published'}</p><p className="mt-1 text-sm text-slate-700">Your original directory listing remains unchanged until you publish this Claimed Listing presentation.</p><button type="button" onClick={() => props.setPanel('claimed-listing')} className="mt-4 rounded bg-blue-700 px-4 py-2 font-bold text-white">Preview / Edit / Publish</button></section><OverviewPanelFields {...props} /></>;
}

function OverviewPanelFields({ lang, form, generatedAccess, setPanel, openListing, createPreview, startTrial, trialStarting }: { lang: string; form: DashboardBusiness | null; generatedAccess: boolean; setPanel: (panel: DashboardPanel) => void; openListing: () => void; createPreview: () => void; startTrial: () => void; trialStarting: boolean }) {
  if (!form) return null;
  const generated = form.generated_website;
  return <><header className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Owner overview</p><h1 className="mt-2 text-3xl font-black">Welcome to your dashboard</h1><p className="mt-2 max-w-2xl text-slate-600">Manage your ListAcrossEU products separately: your Claimed Listing and your Generated Website.</p></header><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Product 1</p><h2 className="mt-1 text-2xl font-black">Claimed Listing</h2></div><StatusBadge tone={form.claim_status === 'verified' ? 'green' : 'slate'}>{form.claim_status === 'verified' ? 'Claim verified' : 'Verification pending'}</StatusBadge></div><p className="mt-5 text-lg font-bold text-slate-900">{form.name}</p><p className="mt-1 text-sm text-slate-600">{form.is_published ? 'Published in the public directory.' : 'Not currently published in the public directory.'}</p><div className="mt-6 flex flex-wrap gap-3">{hasPublishedClaimedListing(form) ? <button type="button" onClick={openListing} className="rounded border border-emerald-700 px-4 py-2 font-bold text-emerald-800">View live listing</button> : <span className="inline-flex items-center text-sm text-slate-500">Not published yet</span>}<button type="button" onClick={() => setPanel('claimed-listing')} className="rounded bg-blue-700 px-4 py-2 font-bold text-white">Edit claimed listing</button></div></section><section className={`rounded-2xl p-6 shadow-sm ${generatedAccess ? 'border border-emerald-200 bg-emerald-50' : 'bg-red-800 text-white'}`}>{generatedAccess && generated ? <><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Product 2</p><h2 className="mt-1 text-2xl font-black">Generated Website</h2><p className="mt-4 text-sm text-emerald-900">Your private website preview is ready. Choose a template, edit it, then proceed to payment and publishing.</p><a href={`/${lang}/dashboard/generated-website?business=${form.id}`} className="mt-6 inline-flex rounded bg-emerald-700 px-4 py-2 font-bold text-white">Open Website</a></> : generated ? <><p className="text-xs font-bold uppercase tracking-wider text-red-200">Product 2</p><h2 className="mt-1 text-2xl font-black">Website preview ready</h2><p className="mt-3 text-sm text-red-100">Your private preview is ready for editing before payment and publishing.</p><button type="button" onClick={() => setPanel('claimed-listing')} className="mt-6 rounded bg-white px-4 py-2 font-bold text-red-800">Open preview</button></> : <><p className="text-xs font-bold uppercase tracking-wider text-red-200">Next step</p><h2 className="mt-1 text-2xl font-black uppercase">Create a website preview</h2><p className="mt-3 text-sm text-red-100">Create a private preview using the information already in your listing. Choose a template before payment and publishing.</p><button type="button" onClick={createPreview} disabled={trialStarting} className="mt-6 rounded bg-white px-4 py-2 font-bold text-red-800 disabled:opacity-70">{trialStarting ? 'Creating preview...' : 'Create my website preview'}</button></>}</section></div><section className="mt-8"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Optional services</p><h2 className="text-3xl font-black">Marketplace</h2></div><div className="space-y-8"><MarketplaceGroup title="PrintLab" items={['Business cards', 'Workwear', 'Stickers', 'Vehicle branding']} /><MarketplaceGroup title="Get online fast" items={['WordPress basic website', 'Current website plans']} /><MarketplaceGroup title="Advertising" items={['Facebook posts', 'Facebook Ads', 'Google Ads', 'LinkedIn Ads']} /></div></section></>;
}

function ClaimedListingPanel(props: { form: DashboardBusiness | null; lang?: string; categoryOptions: Option[]; cityOptions: Option[]; updateField: (field: keyof DashboardBusiness, value: string) => void; updateVisibility: (field: string, value: boolean) => void; setForm: React.Dispatch<React.SetStateAction<DashboardBusiness | null>>; setBusinesses: React.Dispatch<React.SetStateAction<DashboardBusiness[]>>; saveChanges: () => void; publishChanges: () => void; saving: boolean; message: string; error: string; logoUploading: boolean; uploadLogo: (file: File | undefined) => void; removeLogo: () => void; uploadBackground: (file: File | undefined) => void; uploadGallery: (slot: number, file: File | undefined) => void; removeGallery: (slot: number) => void; openListing: () => void; createPreview: () => void; startTrial: () => void; trialStarting: boolean }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const togglePublication = async () => {
    if (!props.form) return;
    const auth = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/auth/`, { credentials: 'include' }).then((response) => response.json()).catch(() => ({}));
    const action = props.form.is_published ? 'unpublish' : 'publish';
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${props.form.id}/claimed-listing/${action}/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': auth.csrfToken || csrfValueOrCookie() } });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const updated = { ...data, visibility: { ...defaultVisibility, ...data.visibility } } as DashboardBusiness;
      props.setForm(updated);
      props.setBusinesses((items) => items.map((item) => item.id === updated.id ? updated : item));
    } else alert(data.detail || `Unable to ${action} the Claimed Listing.`);
  };
  const listing = props.form ? { ...props.form, category: props.categoryOptions.find((option) => option.id === props.form?.category_id) || props.form.category, visibility: props.form.visibility } : null;
  return <>{props.form && <><PostcardEditor value={props.form} categories={props.categoryOptions} cityOptions={props.cityOptions} uploading={props.logoUploading} onLogoUpload={props.uploadLogo} onBackgroundUpload={props.uploadBackground} onGalleryUpload={props.uploadGallery} onGalleryRemove={props.removeGallery} showStyleControls onSave={props.saveChanges} onPublish={props.publishChanges} onRepublish={props.publishChanges} onViewLive={props.openListing} onUnpublish={() => togglePublication()} saving={props.saving} published={hasPublishedClaimedListing(props.form)} onChange={(field, value) => props.form && props.setForm({ ...props.form, ...(field === 'visibility' ? { visibility: value as Record<string, boolean> } : { [field]: value }) } as DashboardBusiness)} /></>}{props.form?.pending_category_suggestion && <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Pending category suggestion: {props.form.pending_category_suggestion}. It is awaiting review and is not yet a canonical category.</p>}</>;
}

function csrfValueOrCookie() { return document.cookie.split(';').map((value) => value.trim().split('=')).find(([key]) => key === 'csrftoken')?.[1] || ''; }

function ClaimedListingPanelFields({ form, categoryOptions, cityOptions, updateField, updateVisibility, setForm, saveChanges, saving, message, error, logoUploading, uploadLogo, removeLogo, uploadBackground, openListing }: { form: DashboardBusiness | null; categoryOptions: Option[]; cityOptions: Option[]; updateField: (field: keyof DashboardBusiness, value: string) => void; updateVisibility: (field: string, value: boolean) => void; setForm: (value: DashboardBusiness) => void; saveChanges: () => void; saving: boolean; message: string; error: string; logoUploading: boolean; uploadLogo: (file: File | undefined) => void; removeLogo: () => void; uploadBackground: (file: File | undefined) => void; openListing: () => void }) {
  if (!form) return null;
return <><header className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Product 1</p><h1 className="mt-1 text-3xl font-black">Claimed Listing</h1><p className="mt-2 text-slate-600">{form.name}</p></div><div className="flex flex-wrap gap-2"><StatusBadge tone={form.claim_status === 'verified' ? 'green' : 'slate'}>{form.claim_status === 'verified' ? 'Claim verified' : 'Verification pending'}</StatusBadge><StatusBadge tone={form.is_published ? 'green' : 'slate'}>{form.is_published ? 'Published' : 'Unpublished'}</StatusBadge></div></header><div className="mb-5 flex flex-wrap gap-3"><button type="button" onClick={openListing} className="rounded border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800">View public listing</button><button type="button" onClick={saveChanges} disabled={saving} className="inline-flex items-center gap-2 rounded bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-60">{saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save changes</>}</button></div><section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="mx-auto max-w-3xl rounded-xl border-4 border-fuchsia-600 bg-slate-50 p-4 sm:p-6"><div className="grid gap-3 sm:grid-cols-[112px_1fr]"><div><div className="flex h-24 items-center justify-center rounded-md bg-red-800 p-2 text-center text-xs font-bold text-white">{form.logo_url ? <img src={form.logo_url} alt="Business logo" className="max-h-full max-w-full object-contain" /> : 'Upload image'}</div><label className="mt-2 block text-xs font-semibold text-slate-700">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={logoUploading} onChange={(event) => uploadLogo(event.target.files?.[0])} className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:font-semibold file:text-blue-700" /></label>{form.logo_url && <button type="button" onClick={removeLogo} disabled={logoUploading} className="mt-2 text-xs font-semibold text-red-700 hover:underline">Remove uploaded logo</button>}</div><div className="space-y-3"><Field label="Business name" value={form.name} onChange={(value) => updateField('name', value)} visibility={form.visibility} /><div className="grid gap-2 sm:grid-cols-2"><SelectField label="Category" value={form.category_id ?? form.category?.id ?? ''} options={categoryOptions} onChange={(value) => setForm({ ...form, category_id: value })} /><Field label="Business type" value={form.business_type} onChange={(value) => updateField('business_type', value)} visibilityField="business_type" visibility={form.visibility} /></div><Field label="Phone" value={form.phone} onChange={(value) => updateField('phone', value)} visibilityField="phone" visibility={form.visibility} /><Field label="WhatsApp" value={form.whatsapp_number || ''} onChange={(value) => updateField('whatsapp_number', value)} visibilityField="whatsapp" visibility={form.visibility} /><Field label="Business contact email" type="email" value={form.contact_email || ''} onChange={(value) => updateField('contact_email', value)} visibilityField="email" visibility={form.visibility} /></div></div><label className="mt-4 block text-xs font-semibold text-slate-700">Description<VisibilityToggle field="Description" value={form.visibility.description !== false} onChange={(value) => updateVisibility('description', value)} /><button type="button" className="ml-2 text-blue-700 hover:underline" onClick={() => undefined}>Help me write it</button><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className="mt-1 w-full resize-y rounded border border-slate-300 p-2 text-sm font-normal" /></label><div className="mt-3 grid gap-2 sm:grid-cols-2"><Field label="Street address" value={form.address_line1 || form.address} onChange={(value) => updateField('address_line1', value)} visibilityField="address" visibility={form.visibility} /><Field label="Post code" value={form.postal_code} onChange={(value) => updateField('postal_code', value)} visibility={form.visibility} /><Field label="Owner name" value={form.owner_name} onChange={(value) => updateField('owner_name', value)} visibilityField="owner_name" visibility={form.visibility} /><Field label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} visibilityField="email" visibility={form.visibility} /><SelectField label="City" value={form.city_id ?? form.city?.id ?? ''} options={cityOptions} onChange={(value) => setForm({ ...form, city_id: value })} visibilityField="city" visibility={form.visibility} onVisibilityChange={(value) => updateVisibility('city', value)} /><Field label="Region" value={form.region} onChange={(value) => updateField('region', value)} visibilityField="region" visibility={form.visibility} /><Field label="Website" value={form.website} onChange={(value) => updateField('website', value)} visibilityField="website" visibility={form.visibility} /><label className="block text-xs font-semibold text-slate-700"><span className="mb-1 flex items-center justify-between">Spoken languages<VisibilityToggle field="Spoken languages" value={form.visibility.languages !== false} onChange={(value) => updateVisibility('languages', value)} /></span><SpokenLanguagePicker value={form.languages || []} onChange={(languages) => setForm({ ...form, languages })} /></label></div></div><section className="mt-6 rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Claimed listing identity</p><h2 className="mt-1 text-lg font-black text-slate-900">Listing color</h2><p className="mt-1 text-sm text-slate-600">Choose the accent used on your public claimed listing.</p></div><div className="flex flex-wrap gap-2">{[["#2563EB","List Across blue"],["#16A34A","Green"],["#0F766E","Teal"],["#7C3AED","Purple"],["#EA580C","Orange"],["#DC2626","Red"],["#0F172A","Dark navy"],["#64748B","Neutral gray"]].map(([color,label]) => <button key={color} type="button" title={label} aria-label={label} onClick={() => setForm({ ...form, accent_color: color })} className="h-8 w-8 rounded-full border-2 border-white ring-1 ring-slate-300" style={{ backgroundColor: color, boxShadow: form.accent_color === color ? `0 0 0 2px ${color}` : undefined }} />)}</div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-700">Background image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={logoUploading} onChange={(event) => uploadBackground(event.target.files?.[0])} className="mt-1 block w-full text-xs text-slate-600" /></label><label className="block text-xs font-semibold text-slate-700">Overlay background color<select value={form.overlay_color || '#0F172A'} onChange={(event) => setForm({ ...form, overlay_color: event.target.value })} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"><option value="#0F172A">Dark navy</option><option value="#111827">Charcoal</option><option value="#1E3A5F">Deep blue</option><option value="#14532D">Deep green</option></select></label><label className="block text-xs font-semibold text-slate-700 sm:col-span-2">Overlay opacity <span>{Math.round((form.overlay_opacity || 0.72) * 100)}%</span><input type="range" min="0.45" max="0.9" step="0.01" value={form.overlay_opacity || 0.72} onChange={(event) => setForm({ ...form, overlay_opacity: Number(event.target.value) })} className="mt-1 w-full" aria-label="Overlay opacity" /></label></div><div id="claimed-listing-preview" className="mt-4"><ClaimedListingRenderer preview listing={{ name: form.name, description: form.description, logo_url: form.logo_url, image_url: form.image_url, background_image: form.background_image, visibility: form.visibility, phone: form.phone, website: form.website, address: form.address, address_line1: form.address_line1, postal_code: form.postal_code, region: form.region, accent_color: form.accent_color, overlay_color: form.overlay_color, overlay_opacity: form.overlay_opacity, contact_email: form.contact_email, whatsapp_number: form.whatsapp_number, languages: form.languages, business_type: form.business_type, category: categoryOptions.find((option) => option.id === form.category_id)?.name ? { name: categoryOptions.find((option) => option.id === form.category_id)?.name || "" } : form.category, city: form.city, country: form.country }} /></div></section>{(message || error) && <p className={`mt-4 text-sm ${error ? 'text-red-700' : 'text-emerald-700'}`}>{error || message}</p>}<p className="mt-4 text-xs text-slate-500">Verified owners can publish or unpublish this Claimed Listing when its category and required details are valid.</p></section></>;
}
