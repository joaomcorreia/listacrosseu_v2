'use client';

import { useEffect, useState } from 'react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';
import InlineEditable from './InlineEditable';
import { getLocalizedWebsiteView, localizedContentFor, normalizeWebsiteLanguageConfig, SUPPORTED_GENERATED_WEBSITE_LANGUAGES, type GeneratedWebsite, type SupportedLang } from './generated-page-schema';

function csrfToken() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((cookie) => cookie.startsWith('csrftoken='))?.split('=').slice(1).join('=') || '';
}

export default function ServiceProTemplate({ initial, businessId, lang, readOnly = false, privatePreview = false, onTemplateChange }: { initial: GeneratedWebsite; businessId: string; lang: string; readOnly?: boolean; privatePreview?: boolean; onTemplateChange?: (next: GeneratedWebsite) => void }) {
  const [draft, setDraft] = useState(initial);
  const [activeLanguage, setActiveLanguage] = useState<SupportedLang>(() => normalizeWebsiteLanguageConfig(initial.website.language_config, lang).primary);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [editorEnabled, setEditorEnabled] = useState(!readOnly);

  const view = getLocalizedWebsiteView(draft.website, activeLanguage);
  const site = view.website;
  const config = view.config;
  const sections = site.sections;
  const contact = site.contact;
  const primary = site.theme.primary;
  const dark = site.theme.dark;
  const heroImage = sections.hero.image || site.content?.hero_image || '';
  const services = sections.services.items.filter((item) => typeof item === 'string' ? item.trim() : Boolean(item.name?.trim() && !item.private_placeholder));
  const gallery = sections.gallery || { enabled: false, title: 'Projects', items: [] };
  const hours = sections.opening_hours || { enabled: false, title: 'Opening Hours', items: [] };
  const faq = sections.faq || { enabled: false, title: 'Frequently Asked Questions', items: [] };
  const why = sections.why_choose || { enabled: false, title: 'Why choose us', text: '' };

  useEffect(() => {
    if (readOnly) return;
    fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/ai-capabilities/`, { credentials: 'include' }).then((response) => response.ok ? response.json() : null).then((data) => setAiAvailable(Boolean(data?.suggestions))).catch(() => setAiAvailable(false));
  }, [readOnly]);

  function updateSection(section: keyof typeof sections, patch: Record<string, unknown>) {
    setDraft((current) => {
      const currentConfig = normalizeWebsiteLanguageConfig(current.website.language_config, lang);
      const shared = new Set(['enabled']);
      if (section === 'hero' || section === 'about') ['image', 'image_position', 'overlay'].forEach((field) => shared.add(field));
      if (section === 'gallery' || section === 'opening_hours') shared.add('items');
      if (section === 'contact') ['address', 'city', 'region', 'country'].forEach((field) => shared.add(field));
      const sharedPatch = Object.fromEntries(Object.entries(patch).filter(([key]) => shared.has(key)));
      const localizedPatch = Object.fromEntries(Object.entries(patch).filter(([key]) => !shared.has(key)));
      const localized = localizedContentFor(current.website);
      const languageContent = { ...(localized[activeLanguage] || {}) } as Record<string, any>;
      const languageSections = { ...(languageContent.sections || {}) };
      if (Object.keys(localizedPatch).length) languageSections[section] = { ...(languageSections[section] || {}), ...localizedPatch };
      const website = { ...current.website, language_config: currentConfig, localized: { ...localized, [activeLanguage]: { ...languageContent, sections: languageSections } } };
      if (Object.keys(sharedPatch).length) website.sections = { ...current.website.sections, [section]: { ...(current.website.sections[section] || {}), ...sharedPatch } };
      if (activeLanguage === currentConfig.primary) website.sections = { ...website.sections, [section]: { ...(website.sections[section] || {}), ...localizedPatch } };
      return { ...current, website };
    });
    setDirty(true); setNotice('');
  }

  function updateContact(field: 'eyebrow' | 'title' | 'message', value: string) {
    const localized = localizedContentFor(draft.website);
    const current = { ...(localized[activeLanguage] || {}) } as Record<string, any>;
    setDraft((valueDraft) => ({ ...valueDraft, website: { ...valueDraft.website, localized: { ...localized, [activeLanguage]: { ...current, contact: { ...(current.contact || {}), [field]: value } } } } }));
    setDirty(true); setNotice('');
  }

  async function suggest(field: string, value: string) {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${businessId}/website/ai-suggest/`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() }, body: JSON.stringify({ field, current_value: value, language: activeLanguage }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Unable to generate a suggestion.');
    return String(data.suggestion || '');
  }

  const editable = (field: string, value: string, onChange: (value: string) => void, className: string, as: 'p' | 'h1' | 'h2' | 'h3' = 'p') => editorEnabled ? <InlineEditable as={as} value={value} fieldId={field} activeField={activeField} onSelect={setActiveField} onChange={onChange} className={className} multiline={as === 'p'} onSuggest={aiAvailable ? () => suggest(field, value) : undefined} /> : <span className={className}>{value}</span>;
  async function save() {
    setSaving(true); setNotice('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${businessId}/website/`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() }, body: JSON.stringify({ template_id: 'service-pro', theme: site.theme, effects: site.effects, settings: site.settings, contact: site.contact, language_config: site.language_config, localized: site.localized }) });
    setSaving(false);
    if (response.ok) { setDirty(false); setNotice('Website draft saved.'); } else setNotice('Unable to save this draft.');
  }

  return <div className="min-h-screen bg-slate-100 text-slate-900" onClick={() => setActiveField(null)}>
    <header className="sticky top-0 z-20 border-b border-slate-700 bg-slate-950 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4"><a href="#top" className="min-w-0 text-lg font-black tracking-tight">{draft.business_name}</a><nav className="hidden gap-6 text-sm font-bold md:flex"><a href="#services">Services</a><a href="#projects">Projects</a><a href="#contact">Contact</a></nav><a href="#contact" className="rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: primary }}>Request service</a></div></header>
    {config.additional.length > 0 && <div className="flex justify-end border-b border-slate-200 bg-white px-5 py-2"><label className="text-xs font-bold text-slate-600">Language <select value={activeLanguage} onChange={(event) => setActiveLanguage(event.target.value as SupportedLang)} className="rounded border border-slate-300 px-2 py-1">{[config.primary, ...config.additional].map((code) => <option key={code} value={code}>{code.toUpperCase()}</option>)}</select></label></div>}
    <main id="top">
      <section className="relative overflow-hidden bg-slate-950 px-5 py-20 text-white sm:py-28"><div className="absolute inset-0 opacity-30" style={{ backgroundImage: heroImage ? `url(${heroImage})` : undefined, backgroundPosition: 'center', backgroundSize: 'cover' }} /><div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="mb-5 text-sm font-black uppercase tracking-[0.22em]" style={{ color: primary }}>{site.content?.category || 'Professional local service'}</p>{editable('hero.title', sections.hero.title, (value) => updateSection('hero', { title: value }), 'max-w-3xl text-4xl font-black tracking-tight sm:text-6xl', 'h1')}{editable('hero.tagline', sections.hero.tagline, (value) => updateSection('hero', { tagline: value }), 'mt-6 max-w-2xl text-lg leading-8 text-slate-300', 'p')}<a href="#contact" className="mt-8 inline-flex rounded-lg px-5 py-3 font-black text-white" style={{ backgroundColor: primary }}>{sections.hero.cta_label || 'Request a quote'}</a></div><div className="hidden rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur sm:block"><p className="text-sm font-bold text-white/70">Ready to help</p><p className="mt-3 text-2xl font-black">{site.target_location || site.target_city || 'Your local area'}</p><p className="mt-2 text-sm leading-6 text-white/70">Clear service information, practical solutions and a direct way to get in touch.</p></div></div></section>
      <section id="about" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div className="min-h-56 rounded-2xl bg-slate-200" style={{ backgroundImage: sections.about.image ? `url(${sections.about.image})` : undefined, backgroundPosition: 'center', backgroundSize: 'cover' }} /><div><p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: primary }}>{sections.about.eyebrow || 'About the business'}</p>{editable('about.title', sections.about.title, (value) => updateSection('about', { title: value }), 'mt-3 text-3xl font-black', 'h2')}{editable('about.text', sections.about.text, (value) => updateSection('about', { text: value }), 'mt-5 text-lg leading-8 text-slate-600', 'p')}</div></section>
      {sections.services.enabled && <section id="services" className="bg-white px-5 py-16"><div className="mx-auto max-w-7xl"><p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: primary }}>{sections.services.eyebrow || 'What we do'}</p>{editable('services.title', sections.services.title || 'Services', (value) => updateSection('services', { title: value }), 'mt-2 text-3xl font-black', 'h2')}<div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{services.map((item, index) => { const service = typeof item === 'string' ? { name: item, description: '' } : item; return <article key={`${service.name}-${index}`} className="rounded-xl border border-slate-200 border-l-4 bg-slate-50 p-6 shadow-sm" style={{ borderLeftColor: primary }}>{editable(`services.${index}.name`, service.name || 'Service', (value) => { const next = sections.services.items.map((entry, entryIndex) => entryIndex === index ? { ...(typeof entry === 'string' ? {} : entry), name: value } : entry); updateSection('services', { items: next }); }, 'text-xl font-black', 'h3')}{editable(`services.${index}.description`, service.description || '', (value) => { const next = sections.services.items.map((entry, entryIndex) => entryIndex === index ? { ...(typeof entry === 'string' ? { name: entry } : entry), description: value } : entry); updateSection('services', { items: next }); }, 'mt-3 text-sm leading-6 text-slate-600', 'p')}</article>; })}</div></div></section>}
      <section className="px-5 py-10 text-white" style={{ backgroundColor: primary }}><div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-2xl font-black">Need a dependable local service?</h2><a href="#contact" className="w-fit rounded-lg bg-white px-5 py-3 font-black text-slate-900">Get in touch</a></div></section>
      {why.enabled && <section className="mx-auto max-w-4xl px-5 py-16 text-center">{editable('why_choose.title', why.title || 'Why choose us', (value) => updateSection('why_choose', { title: value }), 'text-3xl font-black', 'h2')}{editable('why_choose.text', why.text || '', (value) => updateSection('why_choose', { text: value }), 'mt-4 text-lg leading-8 text-slate-600', 'p')}</section>}
      {gallery.enabled && gallery.items.length > 0 && <section id="projects" className="bg-slate-900 px-5 py-16 text-white"><div className="mx-auto max-w-7xl">{editable('gallery.title', gallery.title || 'Projects', (value) => updateSection('gallery', { title: value }), 'text-3xl font-black', 'h2')}<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{gallery.items.filter(Boolean).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${draft.business_name} project ${index + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div></div></section>}
      {hours.enabled && hours.items.length > 0 && <section className="mx-auto max-w-3xl px-5 py-16">{editable('opening_hours.title', hours.title || 'Opening Hours', (value) => updateSection('opening_hours', { title: value }), 'text-3xl font-black', 'h2')}<div className="mt-6 divide-y divide-slate-200 rounded-xl bg-white px-5">{hours.items.filter((item) => item.day && item.hours).map((item, index) => <div key={`${item.day}-${index}`} className="flex justify-between gap-5 py-4"><span className="font-bold">{item.day}</span><span className="text-slate-600">{item.hours}</span></div>)}</div></section>}
      {faq.enabled && faq.items.length > 0 && <section className="bg-white px-5 py-16"><div className="mx-auto max-w-3xl">{editable('faq.title', faq.title || 'Frequently Asked Questions', (value) => updateSection('faq', { title: value }), 'text-3xl font-black', 'h2')}<div className="mt-6 space-y-3">{faq.items.filter((item) => item.question && item.answer).map((item, index) => <details key={`${item.question}-${index}`} className="rounded-xl border border-slate-200 p-5"><summary className="cursor-pointer font-bold">{item.question}</summary><p className="mt-3 text-slate-600">{item.answer}</p></details>)}</div></div></section>}
      <section id="contact" className="bg-slate-950 px-5 py-16 text-white"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: primary }}>{contact.eyebrow || 'Contact'}</p>{editable('contact.title', contact.title || 'Let us help', updateContact.bind(null, 'title'), 'mt-3 text-4xl font-black', 'h2')}{editable('contact.message', contact.message || 'Tell us what you need.', updateContact.bind(null, 'message'), 'mt-4 text-lg leading-8 text-slate-300', 'p')}</div><div className="rounded-xl border border-white/10 bg-white/5 p-6 text-slate-200"><p>{[sections.contact.address, sections.contact.city, sections.contact.region, sections.contact.country].filter(Boolean).join(', ') || (privatePreview ? 'Add business location' : '')}</p>{contact.phone && <p className="mt-3">{contact.phone}</p>}{contact.email && <p className="mt-3">{contact.email}</p>}</div></div></section>
    </main>
    {!readOnly && <aside className="fixed bottom-4 right-4 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"><div className="flex items-center justify-between gap-3"><label className="text-xs font-bold text-slate-600">Template<select value="service-pro" onChange={(event) => { if (event.target.value === 'classic-business') onTemplateChange?.({ ...draft, template_id: 'classic-business' }); }} className="ml-2 rounded border border-slate-300 px-2 py-1"><option value="service-pro">Service Pro</option><option value="classic-business">Classic Business</option></select></label><button type="button" onClick={() => setEditorEnabled(!editorEnabled)} className="text-xs font-bold text-blue-700">{editorEnabled ? 'Preview' : 'Edit'}</button></div><button type="button" onClick={save} disabled={saving || !dirty} className="mt-3 w-full rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{saving ? 'Saving...' : dirty ? 'Save website changes' : 'Saved'}</button>{notice && <p className="mt-2 text-center text-xs text-slate-600">{notice}</p>}</aside>}
  </div>;
}
