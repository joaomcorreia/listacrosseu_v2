'use client';

import { useMemo, useState } from 'react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';
import { GENERATED_WEBSITE_PRODUCT } from '@/lib/product-config';
import InlineEditable from './InlineEditable';

export type GeneratedWebsite = {
  business_id: number;
  business_slug: string;
  business_name: string;
  website: {
    status: string;
    layout_mode: 'one_page' | 'multi_page';
    theme: { primary: string; dark: string };
    trial: { status: string; started_at: string | null; ends_at: string | null };
    sections: {
      hero: { enabled: boolean; title: string; tagline: string; image: string };
      services: { enabled: boolean; items: Array<string | { name?: string; description?: string }> };
      about: { enabled: boolean; title: string; text: string };
      gallery: { enabled: boolean; items: string[] };
      contact: { enabled: boolean; phone: string; email: string; website: string; address: string; city: string; region: string; country: string };
    };
  };
};

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

export default function GeneratedWebsiteTemplate({ initial, businessId, lang }: { initial: GeneratedWebsite; businessId: string; lang: string }) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [trialStarting, setTrialStarting] = useState(false);
  const [notice, setNotice] = useState('');
  const [showAppearance, setShowAppearance] = useState(false);
  const [editorEnabled, setEditorEnabled] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [primaryInput, setPrimaryInput] = useState(initial.website.theme.primary);
  const [darkInput, setDarkInput] = useState(initial.website.theme.dark);
  const [colorError, setColorError] = useState('');

  const site = draft.website;
  const primary = site.theme.primary;
  const dark = site.theme.dark;
  const sections = site.sections;
  const services = sections.services.items;
  const contactItems = useMemo(() => [sections.contact.phone, sections.contact.email, sections.contact.website].filter(Boolean), [sections.contact]);

  function markDirty() { setDirty(true); setNotice(''); }
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

  function updateService(index: number, key: 'name' | 'description', value: string) {
    const items = sections.services.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const service = typeof item === 'string' ? { name: item, description: '' } : { ...item };
      service[key] = value;
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

  function resetSuggested() { updateTheme('primary', initial.website.theme.primary); updateTheme('dark', initial.website.theme.dark); }

  async function saveDraft() {
    setSaving(true); setNotice('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/businesses/${businessId}/website/`, {
      method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
      body: JSON.stringify({ theme: site.theme, sections: site.sections }),
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

  const editable = (fieldId: string, value: string, onChange: (value: string) => void, className = '', as: 'span' | 'p' | 'h1' | 'h2' | 'h3' = 'span', multiline = false) => editorEnabled ? (
    <InlineEditable as={as} value={value} fieldId={fieldId} activeField={activeField} onSelect={setActiveField} onChange={onChange} className={className} multiline={multiline} />
  ) : <span className={className}>{value}</span>;

  return <div className="min-h-screen bg-slate-50 text-slate-900" onClick={() => setActiveField(null)}>
    <header className="sticky top-0 z-20 border-b border-white/10" style={{ backgroundColor: dark, color: '#fff' }}><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4"><a href="#top" className="text-lg font-black tracking-tight">{draft.business_name}</a><nav className="hidden items-center gap-6 text-sm font-semibold md:flex"><a href="#about">About</a>{sections.services.enabled && <a href="#services">Services</a>}{sections.gallery.enabled && <a href="#gallery">Gallery</a>}<a href="#contact">Contact</a></nav><a href="#contact" className="rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: primary }}>Contact</a></div></header>
    <main id="top">
      <section className="relative overflow-hidden px-5 py-24 text-white sm:py-32" style={{ backgroundColor: dark, backgroundImage: sections.hero.image ? `linear-gradient(90deg, ${dark}ee, ${dark}aa), url(${sections.hero.image})` : `linear-gradient(135deg, ${dark}, ${primary}99)`, backgroundPosition: 'center', backgroundSize: 'cover' }}>
        <div className="mx-auto max-w-4xl text-center">
          {editable('hero.title.eyebrow', sections.hero.title, (value) => updateSection('hero', { title: value }), 'text-xs font-bold uppercase tracking-[0.3em]', 'p')}
          {editable('hero.title', sections.hero.title, (value) => updateSection('hero', { title: value }), 'mt-5 text-4xl font-black tracking-tight sm:text-6xl', 'h1')}
          {sections.hero.tagline && editable('hero.tagline', sections.hero.tagline, (value) => updateSection('hero', { tagline: value }), 'mx-auto mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg', 'p', true)}
          <a href="#contact" className="mt-8 inline-flex rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg" style={{ backgroundColor: primary }}>Get in touch</a>
        </div>
      </section>

      {sections.services.enabled && services.length > 0 && <section id="services" className="px-5 py-20 sm:py-24"><SectionTitle eyebrow="What we offer" title="Services" primary={primary} /><div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">{services.map((item, index) => { const service = typeof item === 'string' ? { name: item, description: '' } : item; return <article key={`${service.name}-${index}`} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: primary }}>{index + 1}</div>{editable(`services.${index}.name`, service.name || 'Service', (value) => updateService(index, 'name', value), 'text-xl font-bold', 'h3')}{service.description && editable(`services.${index}.description`, service.description, (value) => updateService(index, 'description', value), 'mt-3 text-sm leading-6 text-slate-600', 'p', true)}</article>; })}</div></section>}

      {sections.about.enabled && <section id="about" className="px-5 py-20 text-white sm:py-24" style={{ backgroundColor: dark }}><div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center"><div className="rounded-3xl p-8" style={{ backgroundColor: `${primary}33` }}><p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#fde68a' }}>About the business</p>{editable('about.title', sections.about.title, (value) => updateSection('about', { title: value }), 'mt-4 text-3xl font-black', 'h2')}<div className="mt-6 h-1 w-14 rounded" style={{ backgroundColor: primary }} /></div>{editable('about.text', sections.about.text || 'Add your business story in the Listing module.', (value) => updateSection('about', { text: value }), 'text-base leading-8 text-white/75', 'p', true)}</div></section>}

      {sections.gallery.enabled && sections.gallery.items.length > 0 && <section id="gallery" className="px-5 py-20 sm:py-24"><SectionTitle eyebrow="Selected work" title="Gallery" primary={primary} /><div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">{sections.gallery.items.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${draft.business_name} gallery item ${index + 1}`} className="aspect-[4/3] w-full rounded-2xl object-cover shadow-sm" />)}</div></section>}

      <section id="contact" className="px-5 py-20 sm:py-24" style={{ backgroundColor: '#fff' }}><div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-200 md:grid-cols-2"><div className="p-8 text-white sm:p-12" style={{ backgroundColor: dark }}><p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#fde68a' }}>Contact</p><h2 className="mt-4 text-3xl font-black">Let&apos;s talk</h2><p className="mt-5 leading-7 text-white/70">Reach out to {draft.business_name} using the details below.</p><div className="mt-8 space-y-4 text-sm text-white/85">{sections.contact.address && editable('contact.address', sections.contact.address, (value) => updateSection('contact', { address: value }), '', 'p')}{[sections.contact.city, sections.contact.region, sections.contact.country].filter(Boolean).join(', ') && <p>{[sections.contact.city, sections.contact.region, sections.contact.country].filter(Boolean).join(', ')}</p>}{contactItems.map((item) => <p key={item}>{item}</p>)}</div></div><div className="p-8 sm:p-12"><h3 className="text-2xl font-bold">Contact form</h3><p className="mt-2 text-sm text-slate-600">Contact form activation will be available with website activation.</p><form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}><input className="w-full rounded-lg border border-slate-300 px-4 py-3" placeholder="Your name" disabled /><input className="w-full rounded-lg border border-slate-300 px-4 py-3" placeholder="Email address" type="email" disabled /><textarea className="w-full rounded-lg border border-slate-300 px-4 py-3" rows={4} placeholder="How can we help?" disabled /><button type="button" disabled className="rounded-lg px-5 py-3 text-sm font-bold text-white opacity-50" style={{ backgroundColor: primary }}>Contact form unavailable</button></form></div></div></section>
    </main>

    <footer className="px-5 py-10 text-white" style={{ backgroundColor: dark }}><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm sm:flex-row"><p className="font-bold">{draft.business_name}</p><p className="text-white/60">Generated Website by ListAcrossEU</p></div></footer>

    <aside className="fixed bottom-4 right-4 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Website editor</p><p className="mt-1 text-sm font-semibold">{activeField ? `Editing ${activeField}` : editorEnabled ? 'Click text on the page to edit it.' : 'Preview mode'}</p></div><button type="button" onClick={() => setEditorEnabled(!editorEnabled)} className="text-xs font-bold text-blue-700">{editorEnabled ? 'Preview' : 'Edit'}</button></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setShowAppearance(!showAppearance)} className="rounded border border-slate-200 px-3 py-2 text-xs font-bold">Appearance</button><button type="button" onClick={saveDraft} disabled={saving || Boolean(colorError) || !dirty} className="rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{saving ? 'Saving...' : dirty ? 'Save draft' : 'Saved'}</button></div>
      {showAppearance && <div className="mt-4 space-y-3 border-t pt-3"><p className="text-xs text-slate-600">Choose any color, or enter a color code.</p><div className="grid grid-cols-4 gap-2">{PALETTES.map(([p, d]) => <button key={p} type="button" aria-label={`Use ${p} palette`} onClick={() => { updateTheme('primary', p); updateTheme('dark', d); }} className="h-8 rounded-full border-2 border-white ring-1 ring-slate-300" style={{ background: `linear-gradient(90deg, ${p} 50%, ${d} 50%)` }} />)}</div><div className="grid grid-cols-2 gap-2"><label className="text-xs font-semibold">Accent<input type="color" value={primary} onChange={(event) => updateTheme('primary', event.target.value)} className="mt-1 h-10 w-full cursor-pointer rounded border p-1" /><input type="text" value={primaryInput} onChange={(event) => updateCustomColor('primary', event.target.value)} placeholder="#2563eb" className="mt-1 w-full rounded border px-2 py-1 text-xs font-normal" /></label><label className="text-xs font-semibold">Dark background<input type="color" value={dark} onChange={(event) => updateTheme('dark', event.target.value)} className="mt-1 h-10 w-full cursor-pointer rounded border p-1" /><input type="text" value={darkInput} onChange={(event) => updateCustomColor('dark', event.target.value)} placeholder="#0f172a" className="mt-1 w-full rounded border px-2 py-1 text-xs font-normal" /></label></div>{colorError && <p className="text-xs font-semibold text-red-600">{colorError}</p>}<button type="button" onClick={resetSuggested} className="text-xs font-bold text-slate-600 underline">Reset to suggested color</button></div>}
      <div className="mt-3 space-y-2"><button type="button" onClick={startTrial} disabled={trialStarting || site.trial.status === 'trial'} className="w-full rounded-lg px-3 py-2 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: primary }}>{site.trial.status === 'trial' ? 'Trial active' : trialStarting ? 'Starting...' : `Start ${GENERATED_WEBSITE_PRODUCT.trialLabel}`}</button><a href={`/${lang}/dashboard`} className="block text-center text-xs font-bold text-slate-600">Back to Listing</a>{notice && <p className="text-center text-xs text-slate-600">{notice}</p>}</div>
    </aside>
  </div>;
}
