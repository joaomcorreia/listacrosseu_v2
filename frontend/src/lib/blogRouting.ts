import { PUBLIC_API_BASE_URL } from "@/lib/env.public";

const API_BASE_URL = PUBLIC_API_BASE_URL;

export async function resolvePostIdBySlug(
  lang: string,
  slug: string
): Promise<number | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/blog/resolve/?lang=${encodeURIComponent(
        lang
      )}&slug=${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: number };
    return typeof data.id === "number" ? data.id : null;
  } catch {
    return null;
  }
}

export async function getSlugByIdAndLang(
  id: number,
  lang: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/blog/posts/${id}/?lang=${encodeURIComponent(lang)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string };
    return typeof data.slug === "string" && data.slug.length > 0
      ? data.slug
      : null;
  } catch {
    return null;
  }
}

export async function resolveBlogDetailTargetUrl(params: {
  currentLang: string;
  currentSlug: string;
  targetLang: string;
  storedId?: number | null;
}): Promise<string> {
  const { currentLang, currentSlug, targetLang, storedId } = params;

  if (!currentSlug) {
    return `/${targetLang}/blog`;
  }

  let postId = storedId ?? null;
  if (!postId) {
    postId = await resolvePostIdBySlug(currentLang, currentSlug);
  }

  if (!postId) {
    return `/${targetLang}/blog`;
  }

  const targetSlug = await getSlugByIdAndLang(postId, targetLang);
  if (!targetSlug) {
    return `/${targetLang}/blog`;
  }

  return `/${targetLang}/blog/${encodeURIComponent(targetSlug)}`;
}


