'use client';

import { useState, type CSSProperties } from 'react';
import { Globe2, ImagePlus, Mail, MessageCircle, Phone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { normalizeSpokenLanguages, spokenLanguageDetails, spokenLanguageName } from '@/lib/spokenLanguages';
import { resolvePresentationStyle } from '@/lib/presentationStyle';
import type { ClaimedListingViewData } from './ClaimedListingRenderer';

type CanvasValue = ClaimedListingViewData & { category_id?: number | string | null; visibility: Record<string, boolean> };
type Props = {
  listing: CanvasValue;
  mode: 'editing' | 'preview' | 'public';
  categories?: Array<{ id: number; name: string }>;
  onChange?: (field: string, value: string | number | string[] | Record<string, boolean>) => void;
  onLogoUpload?: (file: File | undefined) => void;
  onBackgroundUpload?: (file: File | undefined) => void;
  allowMediaUpload?: boolean;
  uploading?: boolean;
};

// The postcard is designed at this proportion. Responsive instances scale
// this same canvas instead of acquiring a different layout at each width.
export const POSTCARD_CANVAS_WIDTH = 1600;
export const POSTCARD_CANVAS_HEIGHT = 900;

const FLAG_ASSET_CODES = new Set(['at', 'be', 'bg', 'cy', 'cz', 'de', 'dk', 'ee', 'es', 'eu', 'fi', 'fr', 'gr', 'hr', 'hu', 'ie', 'it', 'lt', 'lu', 'lv', 'mt', 'nl', 'pl', 'pt', 'ro', 'se', 'si', 'sk', 'uk']);

function Flag({ countryCode, languageCode, label }: { countryCode?: string; languageCode: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const normalizedCountry = countryCode?.toLowerCase();
  // The existing English asset is named uk.png while its language mapping is GB.
  const assetCode = normalizedCountry === 'gb' ? 'uk' : normalizedCountry;
  const hasAsset = Boolean(assetCode && FLAG_ASSET_CODES.has(assetCode) && !failed);
  if (!hasAsset) return <span className="rounded border border-white/35 bg-white/10 px-1.5 py-1 text-[10px] font-bold uppercase" title={label} aria-label={label}>{languageCode.toUpperCase()}</span>;
  return <span className="inline-flex h-6 min-w-7 items-center justify-center overflow-hidden rounded border border-white/35 bg-white/10" title={label} aria-label={label}><img src={`/images/flags/${assetCode}.png`} alt="" className="h-full w-auto object-cover" onError={() => setFailed(true)} /><span className="sr-only">{label}</span></span>;
}

function Field({ label, value, field, type = 'text', multiline = false, shown, onChange, onVisibilityChange, showDisplayLabel = true }: { label: string; value?: string; field: string; type?: string; multiline?: boolean; shown: boolean; onChange?: Props['onChange']; onVisibilityChange?: (value: boolean) => void; showDisplayLabel?: boolean }) {
  if (!onChange && multiline) return shown ? <div className="postcard-description-field min-w-0 rounded-lg border border-white/20 bg-slate-950/35 p-2 text-left shadow-sm backdrop-blur-[2px]" aria-label={`${label}: ${value || ''}`}><span className={showDisplayLabel ? 'mb-1 block text-[10px] font-black uppercase tracking-wider text-white/75' : 'sr-only'}>{label}</span><p className="line-clamp-3 break-words whitespace-pre-wrap text-sm font-bold leading-5 text-white/90">{value || ''}</p></div> : null;
  if (!onChange) return <div className={`postcard-clean-field min-w-0 rounded-lg border border-white/20 bg-slate-950/35 p-2 text-left shadow-sm backdrop-blur-[2px]${shown ? '' : ' invisible'}`} aria-label={`${label}: ${value || ''}`} aria-hidden={!shown || undefined}><span className={showDisplayLabel ? 'mb-1 block text-[10px] font-black uppercase tracking-wider text-white/75' : 'sr-only'}>{label}</span><p className="truncate text-sm font-bold leading-5 text-white/90">{value || ''}</p></div>;
  return <label className={'postcard-editor-field relative block min-w-0 rounded-lg border border-white/25 bg-slate-950/40 p-1 text-left shadow-sm backdrop-blur-[2px] ' + (!shown ? 'opacity-60' : '')}>
    <span className="sr-only">{label}</span>
    {onVisibilityChange && <button type="button" aria-label={`${shown ? 'Hide' : 'Show'} ${label}`} onClick={() => onVisibilityChange(!shown)} className="absolute right-1 top-1 z-10 text-[9px] leading-none text-white/70 hover:text-white">{shown ? 'Shown' : 'Hidden'}</button>}
    {multiline ? <textarea aria-label={label} placeholder={label} value={value || ''} onChange={(event) => onChange(field, event.target.value)} rows={4} className="postcard-editor-input postcard-description-input block h-full min-h-0 w-full resize-none overflow-y-auto break-words whitespace-pre-wrap border border-white/20 bg-transparent p-1 pr-12 text-sm font-bold leading-5 text-white outline-none placeholder:text-white/50 transition focus:border-white/70 focus:ring-2 focus:ring-white/50" /> : <input aria-label={label} placeholder={label} type={type} value={value || ''} onChange={(event) => onChange(field, event.target.value)} className="postcard-editor-input w-full min-w-0 border border-white/20 bg-transparent p-1 pr-12 text-sm font-bold text-white outline-none placeholder:text-white/50 transition focus:border-white/70 focus:ring-2 focus:ring-white/50" />}
  </label>;
}

function ContactField({ label, value, icon: Icon, href, accent, centered = false }: { label: string; value?: string; icon: LucideIcon; href?: string; accent: string; centered?: boolean }) {
  if (!value) return null;
  return <div className="flex min-w-0 items-start gap-2 rounded-lg border border-white/20 bg-slate-950/35 p-2 text-left shadow-sm backdrop-blur-[2px]" title={label} aria-label={`${label}: ${value}`}>
    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
    {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className={`min-w-0 break-all text-sm font-bold leading-5 text-white underline-offset-2 hover:underline${centered ? ' flex-1 text-center' : ''}`} aria-label={`${label}: ${value}`}>{value}</a> : <span className={`min-w-0 break-all text-sm font-bold leading-5 text-white${centered ? ' flex-1 text-center' : ''}`}>{value}</span>}
    <span className="sr-only">{label}</span>
  </div>;
}

export default function PostcardCanvas({ listing, mode, categories = [], onChange, onLogoUpload, onBackgroundUpload, uploading = false, allowMediaUpload = true }: Props) {
  const editing = mode === 'editing';
  const visibility = listing.visibility || {};
  const shown = (field: string) => visibility[field] !== false;
  const setVisibility = (field: string, value: boolean) => onChange?.('visibility', { ...visibility, [field]: value });
  const address = [listing.address_line1 || listing.address, listing.postal_code].filter(Boolean).join(', ');
  const location = [listing.city?.name, listing.region, listing.country?.name].filter(Boolean).join(', ');
  const category = categories.find((item) => item.id === Number(listing.category_id))?.name || listing.category?.name || '';
  const languageCodes = normalizeSpokenLanguages(listing.languages);
  const languageNames = languageCodes.map(spokenLanguageName).join(', ');
  const visibleLanguages = languageCodes.slice(0, 5);
  const remainingLanguages = Math.max(0, languageCodes.length - visibleLanguages.length);
  const { accent, overlay, overlayOpacity, background } = resolvePresentationStyle(listing);
  return <article className="postcard-canvas relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border-4 bg-slate-900 shadow-xl" style={{ borderColor: accent, aspectRatio: `${POSTCARD_CANVAS_WIDTH} / ${POSTCARD_CANVAS_HEIGHT}`, '--postcard-accent': accent } as CSSProperties} aria-label={editing ? 'Visual postcard editor' : 'Claimed listing postcard'}>
    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
    <div className="absolute inset-0" style={{ backgroundColor: overlay, opacity: overlayOpacity }} />
    {editing && allowMediaUpload && onBackgroundUpload && <label className="absolute right-3 top-3 z-10 inline-flex cursor-pointer items-center gap-1 rounded-full bg-black/45 px-3 py-2 text-xs font-bold text-white backdrop-blur hover:bg-black/65"><ImagePlus className="h-4 w-4" />Change background<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => onBackgroundUpload(event.target.files?.[0])} className="sr-only" /></label>}
    <div className="absolute inset-[6%] flex flex-col rounded-xl border p-[4%] text-white sm:inset-[8%] sm:p-[4%]" style={{ borderColor: accent }}>
      <div className="grid min-h-0 grid-cols-[3.75rem_1fr] items-start gap-3 sm:grid-cols-[5.5rem_1fr] sm:gap-4">
        {editing && allowMediaUpload && onLogoUpload ? <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white/90 text-center text-xs font-black text-slate-700 shadow-lg"><input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => onLogoUpload(event.target.files?.[0])} className="sr-only" />{listing.logo_url ? <img src={listing.logo_url} alt="Business logo" className="h-full w-full object-contain" /> : <span><ImagePlus className="mx-auto h-5 w-5" />Logo</span>}</label> : listing.logo_url ? <img src={listing.logo_url} alt={`${listing.name} logo`} className="aspect-square rounded-xl border-2 border-white bg-white object-contain" /> : <div className="flex aspect-square items-center justify-center rounded-xl border-2 border-white/80 bg-white/15 text-2xl font-black">{listing.name.slice(0, 1).toUpperCase() || 'L'}</div>}
        <div className="min-w-0 space-y-0.5"><Field label="Business name" field="name" value={listing.name} shown={true} onChange={onChange} showDisplayLabel={false} />{address && <p className="truncate text-xs font-semibold text-white/80">{address}</p>}<p className="truncate text-sm font-black text-white">{location || 'City, country'}</p></div>
      </div>
      <div className={`postcard-description-slot mt-[3%] flex-none${editing ? ' postcard-description-editing' : ''}`}><div className="postcard-description-region"><Field label="Description" field="description" value={listing.description} multiline shown={shown('description')} onChange={editing ? onChange : undefined} onVisibilityChange={editing ? (value) => setVisibility('description', value) : undefined} showDisplayLabel={false} /></div></div>
      <div className="postcard-lower-fields mt-[3%] grid min-h-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr] sm:items-start">
        <div className="flex min-w-0 flex-col gap-2">{editing ? <label className="postcard-editor-field relative block min-w-0 rounded-lg border border-white/25 bg-slate-950/40 p-1 text-left shadow-sm backdrop-blur-[2px]"><span className="sr-only">Category</span><select aria-label="Category" value={listing.category_id ?? ''} onChange={(event) => onChange?.('category_id', Number(event.target.value) || '')} className="postcard-editor-input w-full rounded border border-white/25 bg-slate-950/40 px-1 py-1 text-xs font-bold text-white outline-none transition focus:border-white/70 focus:ring-2 focus:ring-white/50"><option value="">{category || 'Select category'}</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : category && <div className="rounded-lg border border-white/20 bg-slate-950/35 p-2 text-left shadow-sm backdrop-blur-[2px]" aria-label={`Category: ${category}`}><span className="sr-only">Category</span><p className="break-words text-sm font-black text-white">{category}</p></div>}<Field label="Business type" field="business_type" value={listing.business_type} shown={shown('business_type')} onChange={onChange} onVisibilityChange={(value) => setVisibility('business_type', value)} showDisplayLabel={false} /></div>
        <div className="postcard-languages min-w-0 text-center"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80">We speak</p><div className="mt-1 flex flex-wrap justify-center gap-1" aria-label={languageNames || 'No spoken languages configured'}>{visibleLanguages.map((code) => <Flag key={code} countryCode={spokenLanguageDetails(code)?.flagCountryCode} languageCode={code} label={spokenLanguageName(code)} />)}{remainingLanguages > 0 && <span className="rounded border border-white/35 bg-white/10 px-1.5 py-1 text-[10px] font-bold" title={languageNames}>+{remainingLanguages}</span>}</div>{!visibleLanguages.some((code) => spokenLanguageDetails(code)?.flagCountryCode && FLAG_ASSET_CODES.has(spokenLanguageDetails(code)?.flagCountryCode?.toLowerCase() === 'gb' ? 'uk' : spokenLanguageDetails(code)?.flagCountryCode?.toLowerCase() || '')) && languageNames && <p className="mt-1 text-[10px] font-semibold text-white/85">{languageNames}</p>}</div>
        <div className="min-w-0 space-y-1">{editing ? <><Field label="Phone" field="phone" value={listing.phone} shown={shown('phone')} onChange={onChange} onVisibilityChange={(value) => setVisibility('phone', value)} /><Field label="WhatsApp" field="whatsapp_number" value={listing.whatsapp_number} shown={shown('whatsapp')} onChange={onChange} onVisibilityChange={(value) => setVisibility('whatsapp', value)} /><Field label="Email" field="contact_email" type="email" value={listing.contact_email} shown={shown('email')} onChange={onChange} onVisibilityChange={(value) => setVisibility('email', value)} /></> : <><ContactField label="Phone" value={shown('phone') ? listing.phone : undefined} icon={Phone} accent={accent} href={listing.phone ? `tel:${listing.phone}` : undefined} /><ContactField label="WhatsApp" value={shown('whatsapp') ? listing.whatsapp_number : undefined} icon={MessageCircle} accent={accent} href={listing.whatsapp_number ? `https://wa.me/${listing.whatsapp_number.replace(/[^\d]/g, '')}` : undefined} /><ContactField label="Email" value={shown('email') ? listing.contact_email : undefined} icon={Mail} accent={accent} href={listing.contact_email ? `mailto:${listing.contact_email}` : undefined} /></>}</div>
      </div>
      <div className="postcard-website-region mt-2 text-center">{editing ? <Field label="Website" field="website" type="url" value={listing.website} shown={shown('website')} onChange={onChange} onVisibilityChange={(value) => setVisibility('website', value)} /> : <ContactField label="Website" value={shown('website') ? listing.website : undefined} icon={Globe2} accent={accent} centered href={listing.website ? (/^https?:\/\//i.test(listing.website) ? listing.website : `https://${listing.website}`) : undefined} />}</div>
    </div>
  </article>;
}
