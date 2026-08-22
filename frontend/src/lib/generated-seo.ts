import type { Metadata } from 'next';

async function loadPublishedWebsite(slug: string) {
  const backend = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8020').replace(/\/+$/, '');
  const response = await fetch(`${backend}/api/listings/generated-websites/${encodeURIComponent(slug)}/`, { cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return null;
  return response.json().catch(() => null);
}

export async function generatedWebsiteMetadata(slug: string): Promise<Metadata> {
  const payload = await loadPublishedWebsite(slug);
  if (!payload?.website) {
    return { title: 'Generated Website unavailable | ListAcrossEU', robots: { index: false, follow: false } };
  }
  const website = payload.website;
  const title = website.page_title || payload.business_name || 'Generated Website';
  const description = website.sections?.about?.text || website.sections?.hero?.tagline || `Discover ${payload.business_name || 'this business'} on ListAcrossEU.`;
  return {
    title,
    description,
    alternates: { canonical: `/en/generated/${slug}` },
    robots: { index: true, follow: true },
  };
}
