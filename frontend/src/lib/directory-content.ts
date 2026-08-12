import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

export type DirectorySEOContent = {
  seo_title?: string;
  meta_description?: string;
};

export async function fetchDirectorySEO(scope: string, slug: string): Promise<DirectorySEOContent | null> {
  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/content/directory/${scope}/${encodeURIComponent(slug)}/`, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return data.content || null;
  } catch {
    return null;
  }
}
