'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { GeneratedContactFormConfig, GeneratedHeroSlide, GeneratedSocialLinks, GeneratedWebsiteLocation } from './generated-page-schema';

type Props = {
  socialLinks: GeneratedSocialLinks;
  location: GeneratedWebsiteLocation;
  contactForm: GeneratedContactFormConfig;
  heroSlides: GeneratedHeroSlide[];
  onSocialChange: (next: GeneratedSocialLinks) => void;
  onLocationChange: (next: GeneratedWebsiteLocation) => void;
  onContactFormChange: (next: GeneratedContactFormConfig) => void;
  onSlidesChange: (next: GeneratedHeroSlide[]) => void;
};

export default function GeneratedWebsiteSettingsPanel({ socialLinks, location, contactForm, heroSlides, onSocialChange, onLocationChange, onContactFormChange, onSlidesChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const networks = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'x', 'whatsapp'] as const;

  return <section className="mx-auto mt-4 max-w-7xl px-5" aria-labelledby="website-settings-heading">
    <button type="button" aria-expanded={isOpen} aria-controls="website-settings-content" onClick={() => setIsOpen((open) => !open)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
      <span id="website-settings-heading">Website Settings</span>
      <ChevronDown size={17} aria-hidden="true" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
    {isOpen && <div id="website-settings-content" className="mt-2 space-y-4 rounded-lg border border-slate-200 bg-white p-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Hero slides</p>
        <p className="mt-1 text-[11px] text-slate-500">Up to three localized slides. Edit text directly in the hero.</p>
        <div className="mt-2 space-y-2">{heroSlides.map((slide, index) => <div key={index} className="flex items-center justify-between rounded border border-slate-200 px-2 py-1.5 text-xs"><span className="font-semibold">Slide {index + 1}{slide.enabled === false ? ' (hidden)' : ''}</span><button type="button" onClick={() => onSlidesChange(heroSlides.filter((_, itemIndex) => itemIndex !== index))} disabled={heroSlides.length <= 1} className="font-bold text-slate-500 disabled:opacity-40">Remove</button></div>)}</div>
        <button type="button" onClick={() => onSlidesChange([...heroSlides, { enabled: true, title: '', tagline: '', cta_label: 'Get in touch', order: heroSlides.length }])} disabled={heroSlides.length >= 3} className="mt-2 rounded border border-slate-300 px-2 py-1.5 text-xs font-bold disabled:opacity-40">Add slide</button>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Social links</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{networks.map((network) => <input key={network} aria-label={`${network} URL`} value={socialLinks[network] || ''} onChange={(event) => onSocialChange({ ...socialLinks, [network]: event.target.value })} placeholder={`${network} URL`} className="rounded border border-slate-300 px-2 py-1.5 text-xs" />)}</div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</p>
        <label className="mt-2 block text-xs font-semibold">Map address<input value={location.address || ''} onChange={(event) => onLocationChange({ ...location, address: event.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs" /></label>
        <div className="mt-2 grid grid-cols-2 gap-2"><input type="number" step="any" aria-label="Latitude" value={location.latitude ?? ''} onChange={(event) => onLocationChange({ ...location, latitude: event.target.value ? Number(event.target.value) : null })} placeholder="Latitude" className="rounded border border-slate-300 px-2 py-1.5 text-xs" /><input type="number" step="any" aria-label="Longitude" value={location.longitude ?? ''} onChange={(event) => onLocationChange({ ...location, longitude: event.target.value ? Number(event.target.value) : null })} placeholder="Longitude" className="rounded border border-slate-300 px-2 py-1.5 text-xs" /></div>
        <div className="mt-2 flex gap-4 text-xs"><label><input type="checkbox" checked={location.map_enabled} onChange={(event) => onLocationChange({ ...location, map_enabled: event.target.checked })} /> Map</label><label><input type="checkbox" checked={location.directions_enabled} onChange={(event) => onLocationChange({ ...location, directions_enabled: event.target.checked })} /> Directions</label></div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact form</p>
        <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={contactForm.enabled} onChange={(event) => onContactFormChange({ ...contactForm, enabled: event.target.checked })} /> Enable contact form</label>
        <label className="mt-2 block text-xs font-semibold">Recipient email<input type="email" value={contactForm.recipient_email || ''} onChange={(event) => onContactFormChange({ ...contactForm, recipient_email: event.target.value })} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-xs" /></label>
      </div>
    </div>}
  </section>;
}
