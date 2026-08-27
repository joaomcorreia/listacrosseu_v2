import type { ClaimedListingViewData } from '@/components/business/ClaimedListingRenderer';

export const DEFAULT_BACKGROUND = '/images/eu-map-default-background.png';
export const DEFAULT_ACCENT = '#2563EB';
export const DEFAULT_OVERLAY = '#0F172A';

function usableImageUrl(value?: string) {
  const candidate = (value || '').trim();
  if (!candidate || candidate === 'null' || candidate === 'undefined') return '';
  // Media belongs to the same browser origin as the app. This also prevents
  // an API host/port from leaking into rendered postcard URLs.
  if (/^https?:\/\//i.test(candidate)) {
    try {
      const parsed = new URL(candidate);
      if (parsed.pathname.startsWith('/media/')) return `${parsed.pathname}${parsed.search}`;
    } catch {
      return '';
    }
  }
  if (/^blob:/i.test(candidate) || /^data:image\//i.test(candidate)) return candidate;
  return candidate.startsWith('/') ? candidate : '';
}

export function resolvePresentationStyle(listing: Pick<ClaimedListingViewData, 'accent_color' | 'overlay_color' | 'overlay_opacity' | 'background_image' | 'image_url'>) {
  const accent = /^#[0-9A-F]{6}$/i.test(listing.accent_color || '') ? listing.accent_color! : DEFAULT_ACCENT;
  const overlay = /^#[0-9A-F]{6}$/i.test(listing.overlay_color || '') ? listing.overlay_color! : DEFAULT_OVERLAY;
  const rawOpacity = Number(listing.overlay_opacity);
  const overlayOpacity = Number.isFinite(rawOpacity) ? Math.max(0, Math.min(1, rawOpacity)) : 0.72;
  const background = usableImageUrl(listing.background_image) || usableImageUrl(listing.image_url) || DEFAULT_BACKGROUND;
  return { accent, overlay, overlayOpacity, background };
}
