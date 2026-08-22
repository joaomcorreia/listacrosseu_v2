'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { X } from 'lucide-react';
import ClaimedListingRenderer, { ClaimedListingViewData } from './ClaimedListingRenderer';
import PostcardCanvas from './PostcardCanvas';
import { resolvePresentationStyle } from '@/lib/presentationStyle';

export type PostcardEditorValue = ClaimedListingViewData & { id?: number; category_id?: number | string | null; city_id?: number | string | null; visibility: Record<string, boolean> };
type Props = {
  value: PostcardEditorValue;
  onChange: (field: string, value: string | number | string[] | Record<string, boolean> | File) => void;
  categories?: Array<{ id: number; name: string }>;
  onLogoUpload?: (file: File | undefined) => void;
  onBackgroundUpload?: (file: File | undefined) => void;
  onLogoRemove?: () => void;
  onBackgroundRemove?: () => void;
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
  saving?: boolean;
  published?: boolean;
};

const colors = [['#2563EB', 'List Across blue'], ['#16A34A', 'Green'], ['#0F766E', 'Teal'], ['#7C3AED', 'Purple'], ['#EA580C', 'Orange'], ['#DC2626', 'Red'], ['#0F172A', 'Dark navy'], ['#64748B', 'Neutral gray']];

export default function PostcardEditor({ value, onChange, categories = [], onLogoUpload, onBackgroundUpload, onLogoRemove, onBackgroundRemove, showMediaControls = true, allowMediaUpload = true, uploading = false, showStyleControls = true, showPreviewButton = true, canvasMode = 'editing', onSave, onPublish, onRepublish, onUnpublish, saving = false, published = false }: Props) {
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
    <PostcardCanvas listing={listing} mode={canvasMode} categories={categories} onChange={editingCanvas ? onChange : undefined} onLogoUpload={editingCanvas ? handleLogoUpload : undefined} onBackgroundUpload={editingCanvas ? handleBackgroundUpload : undefined} allowMediaUpload={editingCanvas && allowMediaUpload} uploading={uploading} />
    {showStyleControls && <section className="mx-auto grid max-w-5xl gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Border color</p><div className="mt-2 flex flex-wrap gap-2">{colors.map(([color, label]) => <button key={color} type="button" title={label} aria-label={label} onClick={() => onChange('accent_color', color)} className="h-7 w-7 rounded-full border-2 border-white ring-1 ring-slate-300" style={{ backgroundColor: color, boxShadow: value.accent_color === color ? '0 0 0 2px ' + color : undefined }} />)}</div></div><label className="text-xs font-bold text-slate-700">Overlay color<select value={value.overlay_color || '#0F172A'} onChange={(event) => onChange('overlay_color', event.target.value)} className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"><option value="#0F172A">Dark navy</option><option value="#111827">Charcoal</option><option value="#1E3A5F">Deep blue</option><option value="#14532D">Deep green</option></select></label><label className="text-xs font-bold text-slate-700">Overlay opacity <span>{Math.round(overlayOpacity * 100)}%</span><input type="range" min="0.45" max="0.9" step="0.01" value={overlayOpacity} onChange={(event) => onChange('overlay_opacity', Number(event.target.value))} className="mt-2 w-full" /></label></section>}
    {showMediaControls && (onLogoUpload || onBackgroundUpload) && <section className="mx-auto grid max-w-5xl gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Upload logo<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => onLogoUpload?.(event.target.files?.[0])} className="mt-2 block w-full text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700" /></label><label className="text-xs font-bold text-slate-700">Upload postcard background<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => onBackgroundUpload?.(event.target.files?.[0])} className="mt-2 block w-full text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700" /></label>{value.logo_url && onLogoRemove && <button type="button" onClick={onLogoRemove} className="justify-self-start text-xs font-semibold text-red-700 hover:underline">Remove logo</button>}{value.background_image && onBackgroundRemove && <button type="button" onClick={onBackgroundRemove} className="justify-self-start text-xs font-semibold text-red-700 hover:underline">Restore default background</button>}</section>}
    {(onSave || onPublish || onRepublish || onUnpublish || showPreviewButton) && <div className="mx-auto flex max-w-5xl flex-wrap justify-end gap-2">{showPreviewButton && <button type="button" onClick={() => setPreviewOpen(true)} className="rounded border border-slate-300 bg-white px-4 py-3 font-bold text-slate-800">Preview</button>}{onSave && <button type="button" onClick={onSave} disabled={saving} className="rounded border border-blue-700 bg-white px-4 py-3 font-bold text-blue-700 disabled:opacity-60">{saving ? 'Saving draft...' : 'Save draft'}</button>}{!published && onPublish && <button type="button" onClick={onPublish} className="rounded bg-emerald-700 px-5 py-3 font-bold text-white">Publish</button>}{published && (onRepublish || onPublish) && <button type="button" onClick={onRepublish || onPublish} className="rounded bg-emerald-700 px-5 py-3 font-bold text-white">Publish changes</button>}{published && onUnpublish && <button type="button" onClick={onUnpublish} className="rounded border border-slate-400 bg-white px-5 py-3 font-bold text-slate-700">Unpublish</button>}</div>}
    {previewOpen && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 p-4 sm:p-10"><div className="mx-auto max-w-5xl"><button type="button" onClick={() => setPreviewOpen(false)} className="mb-4 inline-flex items-center gap-2 rounded bg-white px-4 py-2 font-bold text-slate-900"><X className="h-4 w-4" />Close preview</button><ClaimedListingRenderer preview listing={listing} /></div></div>}
  </div>;
}
