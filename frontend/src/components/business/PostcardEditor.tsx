'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { X } from 'lucide-react';
import ClaimedListingRenderer, { ClaimedListingViewData } from './ClaimedListingRenderer';
import PostcardCanvas from './PostcardCanvas';
import { resolvePresentationStyle } from '@/lib/presentationStyle';

export type PostcardEditorValue = ClaimedListingViewData & { id?: number; canonical_path?: string; category_id?: number | string | null; city_id?: number | string | null; visibility: Record<string, boolean> };
type Props = {
  value: PostcardEditorValue;
  onChange: (field: string, value: string | number | string[] | Record<string, boolean> | File) => void;
  categories?: Array<{ id: number; name: string }>;
  cityOptions?: Array<{ id: number; name: string }>;
  onLogoUpload?: (file: File | undefined) => void;
  onBackgroundUpload?: (file: File | undefined) => void;
  onLogoRemove?: () => void;
  onBackgroundRemove?: () => void;
  onGalleryUpload?: (slot: number, file: File | undefined) => void;
  onGalleryRemove?: (slot: number) => void;
  showMediaControls?: boolean;
  allowMediaUpload?: boolean;
  uploading?: boolean;
  showStyleControls?: boolean;
  showPreviewButton?: boolean;
  canvasMode?: 'editing' | 'preview';
  onSave?: () => void;
  onPublish?: () => void;
  onRepublish?: () => void;
  onUnpublish?: () => void;
  onViewLive?: () => void;
  saving?: boolean;
  published?: boolean;
};

const colors = [['#2563EB', 'Blue'], ['#16A34A', 'Green'], ['#0F766E', 'Teal'], ['#7C3AED', 'Purple'], ['#EA580C', 'Orange'], ['#DC2626', 'Red'], ['#0F172A', 'Dark navy'], ['#64748B', 'Gray']];

export default function PostcardEditor({ value, onChange, categories = [], cityOptions = [], onLogoUpload, onBackgroundUpload, onGalleryUpload, onGalleryRemove, allowMediaUpload = true, uploading = false, showStyleControls = true, showPreviewButton = true, canvasMode = 'editing', onSave, onPublish, onRepublish, onUnpublish, onViewLive, saving = false, published = false }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localLogoUrl, setLocalLogoUrl] = useState('');
  const [localBackgroundUrl, setLocalBackgroundUrl] = useState('');
  const logoObjectUrl = useRef('');
  const backgroundObjectUrl = useRef('');
  useEffect(() => () => {
    if (logoObjectUrl.current) URL.revokeObjectURL(logoObjectUrl.current);
    if (backgroundObjectUrl.current) URL.revokeObjectURL(backgroundObjectUrl.current);
  }, []);
  const localUpload = (file: File | undefined, field: 'logo_file' | 'background_file', setUrl: (url: string) => void, urlField: 'logo_url' | 'background_image', objectUrl: MutableRefObject<string>) => {
    if (!file) return;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    setUrl(url);
    onChange(field, file);
    onChange(urlField, url);
  };
  const handleLogoUpload = onLogoUpload || ((file?: File) => localUpload(file, 'logo_file', setLocalLogoUrl, 'logo_url', logoObjectUrl));
  const handleBackgroundUpload = onBackgroundUpload || ((file?: File) => localUpload(file, 'background_file', setLocalBackgroundUrl, 'background_image', backgroundObjectUrl));
  const listing = {
    ...value,
    logo_url: localLogoUrl || value.logo_url,
    background_image: localBackgroundUrl || value.background_image,
    category: categories.find((item) => item.id === Number(value.category_id)) || value.category,
  };
  const { overlayOpacity } = resolvePresentationStyle(listing);
  const editingCanvas = canvasMode === 'editing';
  return <div className="space-y-4">
    {value.canonical_path && onViewLive && published && <div className="mx-auto flex w-full max-w-5xl justify-end"><a href={value.canonical_path} target="_blank" rel="noopener noreferrer" className="rounded border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800">View listing</a></div>}
    <PostcardCanvas listing={listing} mode={canvasMode} categories={categories} cityOptions={cityOptions} onChange={editingCanvas ? onChange : undefined} onLogoUpload={editingCanvas ? handleLogoUpload : undefined} onBackgroundUpload={editingCanvas ? handleBackgroundUpload : undefined} allowMediaUpload={editingCanvas && allowMediaUpload} uploading={uploading} />
    {editingCanvas && <p className="mx-auto max-w-5xl text-right text-xs text-slate-500" aria-live="polite">{value.description?.length || 0} / 500 characters</p>}
    {canvasMode === 'preview' && <p className="mx-auto max-w-5xl text-right text-xs text-slate-500" aria-live="polite">{value.description?.length || 0} / 500 characters</p>}
    {showStyleControls && <section className="mx-auto grid max-w-5xl gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Border color</p><div className="mt-2 flex flex-wrap gap-2">{colors.map(([color, label]) => <button key={color} type="button" title={label} aria-label={`Border color: ${label}`} onClick={() => onChange('accent_color', color)} className="h-8 w-8 rounded-full border-2 border-white ring-1 ring-slate-300" style={{ backgroundColor: color, boxShadow: value.accent_color === color ? '0 0 0 2px ' + color : undefined }} />)}</div></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Overlay color</p><div className="mt-2 flex flex-wrap gap-2">{colors.map(([color, label]) => <button key={color} type="button" title={label} aria-label={`Overlay color: ${label}`} onClick={() => onChange('overlay_color', color)} className="h-8 w-8 rounded-full border-2 border-white ring-1 ring-slate-300" style={{ backgroundColor: color, boxShadow: (value.overlay_color || '#0F172A').toUpperCase() === color ? '0 0 0 2px ' + color : undefined }} />)}</div></div><label className="text-xs font-bold text-slate-700 sm:col-span-2">Overlay opacity <span>{Math.round(overlayOpacity * 100)}%</span><input type="range" min="0" max="1" step="0.01" value={overlayOpacity} onChange={(event) => onChange('overlay_opacity', Number(event.target.value))} className="mt-2 w-full" aria-label="Overlay opacity" /></label></section>}
    {editingCanvas && (onGalleryUpload || onGalleryRemove) && <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-4"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Business photos</p><p className="mt-1 text-sm text-slate-600">Public photos shown after your description. Add up to 4 images.</p></div><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, slot) => { const image = value.gallery_images?.[slot] || ''; return <div key={slot} className="min-w-0"><div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">{image ? <img src={image} alt={`Business photo ${slot + 1}`} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-500">Photo {slot + 1}</span>}</div><label className="mt-2 block cursor-pointer text-center text-xs font-semibold text-blue-700 hover:underline">{image ? 'Replace' : 'Upload'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => onGalleryUpload?.(slot, event.target.files?.[0])} className="sr-only" /></label>{image && onGalleryRemove && <button type="button" onClick={() => onGalleryRemove(slot)} disabled={uploading} className="mt-1 block w-full text-xs font-semibold text-red-700 hover:underline">Remove</button>}</div>; })}</div></section>}
    {(onSave || onPublish || onRepublish || onUnpublish || onViewLive || showPreviewButton) && <div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">{showPreviewButton && <button type="button" onClick={() => setPreviewOpen(true)} className="rounded border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800">Preview</button>}{onSave && <button type="button" onClick={onSave} disabled={saving} className="rounded border border-blue-700 bg-white px-4 py-3 font-bold text-blue-700 disabled:opacity-60">{saving ? 'Saving draft...' : 'Save draft'}</button>}{!published && onPublish && <button type="button" onClick={onPublish} className="rounded bg-emerald-700 px-5 py-3 font-bold text-white">Publish</button>}{published && (onRepublish || onPublish) && <button type="button" onClick={onRepublish || onPublish} className="rounded bg-emerald-700 px-5 py-3 font-bold text-white">Publish changes</button>}{onViewLive && published && <button type="button" onClick={onViewLive} className="rounded border border-emerald-700 bg-white px-4 py-3 font-bold text-emerald-800">View live listing</button>}{published && onUnpublish && <button type="button" onClick={onUnpublish} className="rounded border border-slate-400 bg-white px-5 py-3 font-bold text-slate-700">Unpublish</button>}</div>}
    {previewOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-4 sm:p-10"><div className="mx-auto max-w-5xl"><button type="button" onClick={() => setPreviewOpen(false)} className="mb-4 inline-flex items-center gap-2 rounded bg-white px-4 py-2 font-bold text-slate-900"><X className="h-4 w-4" />Close preview</button><ClaimedListingRenderer preview listing={listing} /></div></div>}
  </div>;
}
