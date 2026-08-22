'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';
import { generatedWebsiteHostUrl } from '@/lib/env.public';
import { GENERATED_WEBSITE_PRODUCT } from '@/lib/product-config';
import InlineEditable from './InlineEditable';
import type { GeneratedWebsite } from './generated-page-schema';

export type { GeneratedWebsite } from './generated-page-schema';

const PALETTES = [
  ['#2563eb', '#0f172a'], ['#0f766e', '#102a2a'], ['#b45309', '#2a1a0f'], ['#be123c', '#2a1018'],
  ['#7c3aed', '#1e1633'], ['#15803d', '#102719'], ['#c2410c', '#29150d'], ['#334155', '#111827'],
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function normalizeHex(value: string) { return value.trim().toLowerCase(); }
function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrastRatio(first: string, second: string) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function csrfToken() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((cookie) => cookie.startsWith('csrftoken='))?.split('=').slice(1).join('=') || '';
}

function SectionTitle({ eyebrow, title, primary }: { eyebrow: string; title: string; primary: string }) {
  return <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: primary }}>{eyebrow}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{title}</h2><div className="mx-auto mt-4 h-1 w-14 rounded" style={{ backgroundColor: primary }} /></div>;
}

export default function GeneratedWebsiteTemplate({ initial, businessId, lang, readOnly = false, privatePreview = false }: { initial: GeneratedWebsite; businessId: string; lang: string; readOnly?: boolean; privatePreview?: boolean }) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [trialStarting, setTrialStarting] = useState(false);
  const [notice, setNotice] = useState('');
  const [showAppearance, setShowAppearance] = useState(false);
  const [editorPanelOpen, setEditorPanelOpen] = useState(true);
  const [editorEnabled, setEditorEnabled] = useState(!readOnly);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [primaryInput, setPrimaryInput] = useState(initial.website.theme.primary);
  const [darkInput, setDarkInput] = useState(initial.website.theme.dark);
  const [colorError, setColorError] = useState('');

  const site = draft.website;
  const attributionEligible = Boolean(site.entitlement?.attribution_visibility_unlocked);
  const attributionVisible = attributionEligible ? site.settings?.attribution_visible !== false : true;
  const primary = site.theme.primary;
  const dark = site.theme.dark;
  const sections = site.sections;
  const contact = site.contact || { phone: '', whatsapp: '', email: '', website: '', visibility: { phone: true, whatsapp: true, email: true, website: true, address: true } };
  const contactVisibility = { phone: true, whatsapp: true, email: true, website: true, address: true, ...(contact.visibility || {}) };
  const content = site.content || { tagline: sections.hero.tagline, description: sections.about.text, logo: '', hero_image: sections.hero.image, category: '', services: sections.services.items, contact: { ...contact, ...sections.contact }, gallery: sections.gallery.items };
  const services = sections.services.items.filter((item) => typeof item === 'string' ? item.trim() : Boolean(item.name?.trim() && !item.private_placeholder));
  const storedPrivateServiceSlots = privatePreview ? sections.services.items.filter((item) => typeof item !== 'string' && item.private_placeholder) : [];
  const privateServiceSlots = privatePreview && services.length === 0 && storedPrivateServiceSlots.length === 0 ? [0, 1, 2] : storedPrivateServiceSlots;
  const heroImage = sections.hero.image || content.hero_image;
  const heroOverlay = Math.min(0.9, Math.max(0.35, Number(sections.hero.overlay ?? 0.75)));
  const heroImagePosition = sections.hero.image_position || 'center';

  useEffect(() => {
    if (readOnly || typeof window === 'undefined') return;
    setEditorPanelOpen(window.localStorage.getItem(`generated-website-editor-collapsed:${businessId}`) !== '1');
  }, [businessId, readOnly]);

  useEffect(() => {
    if (readOnly || typeof window === 'undefined' || !dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty, readOnly]);

  function markDirty() { setDirty(true); setNotice(''); }
  function toggleEditorPanel() {
    setEditorPanelOpen((open) => {
      const next = !open;
      if (typeof window !== 'undefined') window.localStorage.setItem(`generated-website-editor-collapsed:${businessId}`, next ? '0' : '1');
      return next;
    });
  }
  function updateSection<K extends keyof typeof sections>(section: K, patch: Partial<(typeof sections)[K]>) {
    setDraft((current) => ({
      ...current,
      website: {
        ...current.website,
        sections: {
          ...current.website.sections,
          [section]: { ...current.website.sections[section], ...patch },
        },
      },
    }));
    markDirty();
  }

  function updateWebsiteField(field: 'page_title' | 'target_location' | 'service_area', value: string) {
    setDraft((current) => ({ ...current, website: { ...current.website, [field]: value } }));
    markDirty();
  }

  function updateContact(field: 'eyebrow' | 'title' | 'message' | 'phone' | 'whatsapp' | 'email' | 'website', value: string) {
    setDraft((current) => ({ ...current, website: { ...current.website, contact: { ...current.website.contact, [field]: value } } }));
    markDirty();
  }

  function toggleContactVisibility(field: 'phone' | 'whatsapp' | 'email' | 'website' | 'address') {
    setDraft((current) => ({
      ...current,
      website: {
        ...current.website,
        contact: {
          ...current.website.contact,
          visibility: { ...current.website.contact.visibility, [field]: !contactVisibility[field] },
        },
      },
    }));
    markDirty();
  }

  function updateService(index: number, key: 'name' | 'description', value: string) {
    const items = sections.services.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const service = typeof item === 'string' ? { name: item, description: '' } : { ...item };
      service[key] = value;
      if (key === 'name' && value.trim()) delete service.private_placeholder;
      if (key === 'name' && !value.trim()) { service.private_placeholder = true; service.description = ''; }
      return service;
    });
    updateSection('services', { items });
  }

  function updateTheme(key: 'primary' | 'dark', value: string) {
    const normalized = normalizeHex(value);
    if (!HEX_COLOR.test(normalized)) return;
    if (contrastRatio(normalized, '#ffffff') < 4.5) {
      setColorError('Choose a darker color so text and buttons remain readable.');
      return;
    }
    setDraft((current) => ({ ...current, website: { ...current.website, theme: { ...current.website.theme, [key]: normalized } } }));
    if (key === 'primary') setPrimaryInput(normalized); else setDarkInput(normalized);
    setColorError(''); markDirty();
  }

  function updateCustomColor(key: 'primary' | 'dark', value: string) {
    if (key === 'primary') setPrimaryInput(value); else setDarkInput(value);
    const normalized = normalizeHex(value);
    if (!HEX_COLOR.test(normalized)) { setColorError('Enter a valid 6-digit color code, such as #2563eb.'); return; }
    updateTheme(key, normalized);
  }

  function toggleAttribution() {
    if (!attributionEligible) {
      setNotice('Can be hidden after your first paid month.');
      return;
    }
    setDraft((current) => ({
      ...current,
      website: {
        ...current.website,
        settings: {
          ...current.website.settings,
          attribution_visible: !attributionVisible,
        },
      },
    }));
    markDirty();
  }

  function resetSuggested() { updateTheme('primary', initial.website.theme.primary); updateTheme('dark', initial.website.theme.dark); }

  async function saveDraft() {
    setSaving(true); setNotice('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${businessId}/website/`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
      body: JSON.stringify({ page_title: site.sections.hero.title, target_location: site.target_location, target_city: site.target_city, target_region: site.target_region, target_country: site.target_country, service_area: site.service_area, layout_mode: site.layout_mode, theme: site.theme, effects: site.effects, settings: site.settings, contact: site.contact, sections: site.sections }),
    });
    if (response.ok) { setDirty(false); setNotice('Website draft saved.'); }
    else setNotice('Unable to save this draft.');
    setSaving(false);
  }

  async function startTrial() {
    setTrialStarting(true); setNotice('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${businessId}/website/trial/`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrfToken() } });
    const data = await response.json().catch(() => ({}));
    if (response.ok) { setDraft(data); setDirty(false); setNotice(`Your ${GENERATED_WEBSITE_PRODUCT.trialLabel} has started.`); } else setNotice(data.detail || 'Unable to start your trial.');
    setTrialStarting(false);
  }

  function openStandalonePreview() {
    const previewUrl = (draft as GeneratedWebsite).preview_url;
    const parsed = previewUrl ? new URL(previewUrl, window.location.origin) : null;
    const query = parsed?.search || '';
    const target = generatedWebsiteHostUrl(site.website_slug, `/${query}`);
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  const editable = (fieldId: string, value: string, onChange: (value: string) => void, className = '', as: 'span' | 'p' | 'h1' | 'h2' | 'h3' = 'span', multiline = false) => editorEnabled ? (
    <InlineEditable as={as} value={value} fieldId={fieldId} activeField={activeField} onSelect={setActiveField} onChange={onChange} className={className} multiline={multiline} />
  ) : <span className={className}>{value}</span>;

  const contactRow = (field: 'phone' | 'whatsapp' | 'email' | 'website', label: string, fallback: string) => {
    const value = contact[field] || '';
    if (readOnly && (!contactVisibility[field] || !value)) return null;
    return <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 last:border-0"><div className="min-w-0">{editable(`contact.${field}`, value || fallback, (next) => updateContact(field, next), 'block truncate text-sm text-white/85', 'p')}</div>{editorEnabled && !readOnly && <button type="button" onClick={() => toggleContactVisibility(field)} aria-label={`${contactVisibility[field] ? 'Hide' : 'Show'} ${label}`} className="shrink-0 rounded p-1 text-white/70 hover:bg-white/10">{contactVisibility[field] ? <Eye size={16} /> : <EyeOff size={16} />}</button>}</div>;
  };

  const addressValue = [sections.contact.address, sections.contact.city, sections.contact.region, sections.contact.country].filter(Boolean).join(', ');
  const addressRow = (!readOnly || (contactVisibility.address && addressValue)) ? <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3"><p className="text-sm text-white/85">{addressValue || (privatePreview ? 'Add business address' : '')}</p>{editorEnabled && !readOnly && <button type="button" onClick={() => toggleContactVisibility('address')} aria-label={`${contactVisibility.address ? 'Hide' : 'Show'} address`} className="shrink-0 rounded p-1 text-white/70 hover:bg-white/10">{contactVisibility.address ? <Eye size={16} /> : <EyeOff size={16} />}</button>}</div> : null;

  const targetText = site.service_area || site.target_location || [site.target_city, site.target_region, site.target_country].filter(Boolean).join(', ');

  return <div className={`min-h-screen bg-slate-50 text-slate-900 ${site.effects?.reveal ? 'generated-page-reveal' : ''}`} onClick={() => setActiveField(null)}>
    <header className="sticky top-0 z-20 border-b border-white/10" style={{ backgroundColor: dark, color: '#fff' }}><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4"><a href="#top" className="flex min-w-0 items-center gap-3 text-lg font-black tracking-tight">{content.logo && <img src={content.logo} alt="" className="h-10 max-w-14 shrink-0 object-contain sm:h-12" />}{draft.business_name}</a><nav className="hidden items-center gap-6 text-sm font-semibold md:flex"><a href="#about">About</a>{sections.services.enabled && <a href="#services">Services</a>}{sections.gallery.enabled && <a href="#gallery">Gallery</a>}<a href="#contact">Contact</a></nav><a href="#contact" className="rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: primary }}>Contact</a></div></header>
    <main id="top">
      <section className="relative overflow-hidden px-5 py-24 text-white sm:py-32" style={{ backgroundColor: dark, backgroundImage: heroImage ? `linear-gradient(90deg, ${dark}${Math.round(heroOverlay * 255).toString(16).padStart(2, '0')}, ${dark}${Math.round(heroOverlay * 0.55 * 255).toString(16).padStart(2, '0')}), url(${heroImage})` : `linear-gradient(135deg, ${dark}, ${primary}99)`, backgroundPosition: heroImagePosition, backgroundSize: 'cover' }}>
        <div className="mx-auto max-w-4xl text-center">
          {editable('hero.title', sections.hero.title, (value) => updateSection('hero', { title: value }), 'mt-5 text-4xl font-black tracking-tight sm:text-6xl', 'h1')}
          {(sections.hero.tagline || privatePreview) && editable('hero.tagline', sections.hero.tagline || 'Add supporting text', (value) => updateSection('hero', { tagline: value }), 'mx-auto mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg', 'p', true)}
          {targetText && <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold text-white/80">Serving {targetText}</p>}
          <a href={editorEnabled ? undefined : '#contact'} onClick={(event) => { if (editorEnabled) event.preventDefault(); }} className="mt-8 inline-flex rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: primary }}>{editable('hero.cta_label', sections.hero.cta_label || 'Get in touch', (value) => updateSection('hero', { cta_label: value }), '', 'span')}</a>
        </div>
      </section>

      {(sections.about.enabled && sections.about.text || privatePreview) && <section id="about" className="px-5 py-20 text-white sm:py-24" style={{ backgroundColor: dark }}><div className="mx-auto max-w-4xl">{editable('about.eyebrow', sections.about.eyebrow || 'Why choose us', (value) => updateSection('about', { eyebrow: value }), 'text-xs font-bold uppercase tracking-[0.25em]', 'p')} {editable('about.title', sections.about.title || 'Why choose us', (value) => updateSection('about', { title: value }), 'mt-4 text-3xl font-black', 'h2')}<div className="mt-6 h-1 w-14 rounded" style={{ backgroundColor: primary }} />{editable('about.text', sections.about.text || 'Add intro / Why choose us', (value) => updateSection('about', { text: value }), 'mt-6 max-w-3xl text-base leading-8 text-white/75', 'p', true)}</div></section>}
      {sections.services.enabled && (services.length > 0 || privateServiceSlots.length > 0 || privatePreview) && <section id="services" className="px-5 py-20 sm:py-24"><div className="mx-auto max-w-6xl"><div className="text-center">{editable('services.eyebrow', sections.services.eyebrow || 'What we offer', (value) => updateSection('services', { eyebrow: value }), 'text-xs font-bold uppercase tracking-[0.25em]', 'p')} {editable('services.title', sections.services.title || 'Services / Products', (value) => updateSection('services', { title: value }), 'mt-2 text-3xl font-black tracking-tight text-slate-900', 'h2')}<div className="mx-auto mt-4 h-1 w-14 rounded" style={{ backgroundColor: primary }} /></div><div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">{services.map((item, index) => { const service = typeof item === 'string' ? { name: item, description: '' } : item; return <article key={`${service.name}-${index}`} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}>{index + 1}</div>{editable(`services.${index}.name`, service.name || 'Service', (value) => updateService(index, 'name', value), 'text-xl font-bold', 'h3')}{editable(`services.${index}.description`, service.description || '', (value) => updateService(index, 'description', value), 'mt-3 text-sm leading-6 text-slate-600', 'p', true)}</article>; })}{privateServiceSlots.map((_, index) => { const slotIndex = services.length + index; const item = sections.services.items[slotIndex]; const service = typeof item === 'string' ? { name: item, description: '' } : (item || {}); return <article key={`private-service-slot-${index}`} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}>{services.length + index + 1}</div>{editable(`services.${slotIndex}.name`, service.name || '', (value) => updateService(slotIndex, 'name', value), 'text-xl font-bold text-slate-700', 'h3')}{editable(`services.${slotIndex}.description`, service.description || '', (value) => updateService(slotIndex, 'description', value), 'mt-3 text-sm leading-6 text-slate-500', 'p', true)}</article>; })}</div></div></section>}


      {((!readOnly && (sections.contact.address || sections.contact.city || sections.contact.region || sections.contact.country)) || (readOnly && contactVisibility.address && (sections.contact.address || sections.contact.city || sections.contact.region || sections.contact.country)) || privatePreview) && <section id="location" className="px-5 py-14"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">{editable('contact.location_label', sections.contact.location_label || 'Location', (value) => updateSection('contact', { location_label: value }), 'text-xs font-bold uppercase tracking-[0.25em]', 'p')} {editable('contact.location_title', sections.contact.location_title || 'Find the business', (value) => updateSection('contact', { location_title: value }), 'mt-2 text-2xl font-black text-slate-900', 'h2')}{editable('contact.location_intro', sections.contact.location_intro || '', (value) => updateSection('contact', { location_intro: value }), 'mt-3 text-sm text-slate-600', 'p', true)}<div className="mt-5 space-y-1 text-slate-600">{(!readOnly || contactVisibility.address) && sections.contact.address && <p>{sections.contact.address}</p>}{(!readOnly || contactVisibility.address) && <p>{[sections.contact.city, sections.contact.region, sections.contact.country].filter(Boolean).join(', ')}</p>}</div></div></section>}

      {sections.gallery.enabled && sections.gallery.items.length > 0 && <section id="gallery" className="px-5 py-20 sm:py-24"><SectionTitle eyebrow="Selected work" title="Gallery" primary={primary} /><div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">{sections.gallery.items.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${draft.business_name} gallery item ${index + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm" />)}</div></section>}

      <section id="contact" className="px-5 py-16 text-white sm:py-20" style={{ backgroundColor: dark }}><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-8 border-b border-white/15 pb-10 md:flex-row md:items-start md:justify-between"><div className="max-w-xl"><div className="flex items-center gap-3">{content.logo && <img src={content.logo} alt="" className="h-12 w-12 rounded-lg object-contain" />}<h2 className="text-xl font-black">{draft.business_name}</h2></div>{editable('contact.eyebrow', contact.eyebrow || 'Contact', (value) => updateContact('eyebrow', value), 'mt-6 text-xs font-bold uppercase tracking-[0.25em] text-white/60', 'p')}{editable('contact.title', contact.title || 'Get in touch', (value) => updateContact('title', value), 'mt-2 text-3xl font-black', 'h2')}{editable('contact.message', contact.message || 'Add a short contact message', (value) => updateContact('message', value), 'mt-4 max-w-lg text-sm leading-7 text-white/75', 'p', true)}</div><div className="w-full max-w-md space-y-4 text-sm">{contactRow('phone', 'phone number', 'Add phone number')}{contactRow('whatsapp', 'WhatsApp number', 'Add WhatsApp number')}{contactRow('email', 'business email', 'Add business email')}{contactRow('website', 'website URL', 'Add website URL')}{addressRow}</div></div><div className="flex flex-col gap-3 pt-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between"><p>{draft.business_name}</p>{(!attributionEligible || attributionVisible) && <p>Generated Website by ListAcrossEU</p>}</div></div></section>
    </main>

    {!readOnly && !editorPanelOpen && <button type="button" onClick={toggleEditorPanel} aria-label="Expand Website Editor" className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-2xl"><ChevronUp size={16} />Website Editor{dirty && <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="Unsaved changes" />}</button>}

    {!readOnly && editorPanelOpen && <aside className="fixed bottom-4 right-4 z-30 max-h-[min(80vh,42rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Website editor</p><p className="mt-1 text-sm font-semibold">{dirty ? 'Unsaved changes' : notice || 'Saved'}</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => setEditorEnabled(!editorEnabled)} className="text-xs font-bold text-blue-700">{editorEnabled ? 'Preview' : 'Edit'}</button><button type="button" onClick={toggleEditorPanel} aria-label="Collapse Website Editor" className="rounded p-1 text-slate-500 hover:bg-slate-100"><ChevronDown size={18} /></button></div></div>
      <div className="mt-3 grid grid-cols-2 gap-2">{!privatePreview && <button type="button" onClick={openStandalonePreview} className="rounded border border-slate-200 px-3 py-2 text-xs font-bold">Preview</button>}<button type="button" onClick={() => setShowAppearance(!showAppearance)} className="rounded border border-slate-200 px-3 py-2 text-xs font-bold">Appearance</button><button type="button" onClick={saveDraft} disabled={saving || Boolean(colorError)} className="col-span-2 rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{saving ? 'Saving...' : dirty ? 'Save website changes' : 'Saved'}</button></div>{privatePreview && notice && <p className="mt-2 text-center text-xs text-slate-600">{notice}</p>}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div><p className="text-xs font-bold text-slate-700">Footer attribution</p><p className="text-[11px] text-slate-500">{attributionEligible ? 'Choose whether ListAcrossEU is credited.' : 'Can be hidden after your first paid month.'}</p></div><button type="button" onClick={toggleAttribution} disabled={!attributionEligible} aria-label={attributionVisible ? 'Hide footer attribution' : 'Show footer attribution'} className="rounded p-1 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">{attributionVisible ? <Eye size={18} /> : <EyeOff size={18} />}</button></div>
      {showAppearance && <div className="mt-4 space-y-3 border-t pt-3"><p className="text-xs text-slate-600">Choose any color, or enter a color code.</p><div className="grid grid-cols-4 gap-2">{PALETTES.map(([p, d]) => <button key={p} type="button" aria-label={`Use ${p} palette`} onClick={() => { updateTheme('primary', p); updateTheme('dark', d); }} className="h-8 rounded-full border-2 border-white ring-1 ring-slate-300" style={{ background: `linear-gradient(90deg, ${p} 50%, ${d} 50%)` }} />)}</div><div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold">Accent<input type="color" value={primary} onChange={(event) => updateTheme('primary', event.target.value)} className="mt-1 h-10 w-full cursor-pointer rounded border p-1" /><input type="text" value={primaryInput} onChange={(event) => updateCustomColor('primary', event.target.value)} placeholder="#2563eb" className="mt-1 w-full rounded border px-2 py-1 text-xs font-normal" /></label><label className="text-xs font-semibold">Dark background<input type="color" value={dark} onChange={(event) => updateTheme('dark', event.target.value)} className="mt-1 h-10 w-full cursor-pointer rounded border p-1" /><input type="text" value={darkInput} onChange={(event) => updateCustomColor('dark', event.target.value)} placeholder="#0f172a" className="mt-1 w-full rounded border px-2 py-1 text-xs font-normal" /></label></div><label className="block text-xs font-semibold">Hero background image URL<input type="url" value={sections.hero.image} onChange={(event) => updateSection('hero', { image: event.target.value })} placeholder="https://example.com/image.jpg" className="mt-1 w-full rounded border px-2 py-1 text-xs font-normal" /></label><div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold">Image position<select value={heroImagePosition} onChange={(event) => updateSection('hero', { image_position: event.target.value })} className="mt-1 w-full rounded border px-2 py-1 text-xs font-normal"><option>center</option><option>top</option><option>bottom</option><option>left</option><option>right</option></select></label><label className="text-xs font-semibold">Overlay strength<input type="range" min="0.35" max="0.9" step="0.05" value={heroOverlay} onChange={(event) => updateSection('hero', { overlay: Number(event.target.value) })} className="mt-3 w-full" /></label></div>{colorError && <p className="text-xs font-semibold text-red-600">{colorError}</p>}<button type="button" onClick={resetSuggested} className="text-xs font-bold text-slate-600 underline">Reset to suggested color</button></div>}
      {!privatePreview && <div className="mt-3 space-y-2"><button type="button" onClick={startTrial} disabled={trialStarting || site.trial.status === 'trial'} className="w-full rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: primary }}>{site.trial.status === 'trial' ? 'Trial active' : trialStarting ? 'Starting...' : `Start ${GENERATED_WEBSITE_PRODUCT.trialLabel}`}</button><a href={`/${lang}/dashboard/generated-website?business=${businessId}`} className="block text-center text-xs font-bold text-slate-600">Back to Website Dashboard</a>{notice && <p className="text-center text-xs text-slate-600">{notice}</p>}</div>}
    </aside>}
  </div>;
}
