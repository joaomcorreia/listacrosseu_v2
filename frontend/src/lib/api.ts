export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type HeroEffectSettings = {
  enabled: boolean;
  opacity: number;
  intensity: "low" | "medium" | "high";
  updated_at: string;
};

export type BusinessCategory = {
  id: number;
  name: string;
  slug: string;
};

export type BusinessLocation = {
  id: number;
  name: string;
  slug: string;
};

export type Business = {
  id: number;
  name: string;
  slug: string;
  country: BusinessLocation;
  city: BusinessLocation | null;
  category: BusinessCategory | null;
  country_slug: string | null;
  city_slug: string | null;
  category_slug: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  phone: string;
  description: string;
  is_micro: boolean;
  employee_count: number | null;
  source: string;
  external_id: string;
};

export type BusinessDetail = {
  id: number;
  name: string;
  slug: string;
  tier: "free" | "claimed" | "premium";
  country: BusinessLocation;
  city: BusinessLocation | null;
  town: BusinessLocation | null;
  category: BusinessCategory | null;
  country_slug: string | null;
  city_slug: string | null;
  category_slug: string | null;
  canonical_path: string;
  address: string;
  address_line1: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  phone: string;
  description: string;
  keywords: string[];
  logo_url: string;
  image_url: string;
  premium_content: string;
  premium_images: string[];
  premium_sidebar: {
    sidebar_highlight?: string;
    services?: string[];
    contact_phone?: string;
    contact_email?: string;
  };
  is_micro: boolean;
  employee_count: number | null;
  source: string;
  external_id: string;
};

export type SearchResponse = {
  total: number;
  limit: number;
  offset: number;
  results: Business[];
};

export async function searchBusinesses(params: {
  q?: string;
  country?: string;
  city?: string;
  category?: string;
  is_micro?: boolean;
  limit?: number;
  offset?: number;
  lang?: string;
}): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.country) searchParams.set("country", params.country);
  if (params.city) searchParams.set("city", params.city);
  if (params.category) searchParams.set("category", params.category);
  if (params.is_micro) searchParams.set("is_micro", "true");
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (typeof params.offset === "number")
    searchParams.set("offset", String(params.offset));
  if (params.lang) searchParams.set("lang", params.lang);

  const res = await fetch(`${API_BASE_URL}/api/businesses/search/?${searchParams.toString()}`);

  if (!res.ok) {
    throw new Error(`Search request failed with status ${res.status}`);
  }

  const data = (await res.json()) as SearchResponse;
  return data;
}

export async function fetchCountries() {
  const res = await fetch(`${API_BASE_URL}/api/countries/`);
  if (!res.ok) throw new Error("Failed to fetch countries");
  return (await res.json()) as { id: number; name: string; slug: string }[];
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE_URL}/api/categories/`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return (await res.json()) as { id: number; name: string; slug: string }[];
}

export async function fetchCities() {
  const res = await fetch(`${API_BASE_URL}/api/cities/`);
  if (!res.ok) throw new Error("Failed to fetch cities");
  return (await res.json()) as {
    id: number;
    name: string;
    slug: string;
    country: { id: number; name: string; slug: string };
  }[];
}

export type UiTextResponse = {
  group: number; // id
  language: string;
  data: Record<string, string>;
  updated_at: string;
};

export async function fetchHeroEffectSettings(): Promise<HeroEffectSettings> {
  const res = await fetch(`${API_BASE_URL}/api/ui/hero-effects/`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error("Failed to fetch hero effect settings");
  }
  return (await res.json()) as HeroEffectSettings;
}

export async function fetchUiText(
  groupKey: string,
  lang: string
): Promise<UiTextResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/ui/texts/${encodeURIComponent(
      groupKey
    )}/?lang=${encodeURIComponent(lang)}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch UI text for group '${groupKey}' and lang '${lang}'`
    );
  }
  return (await res.json()) as UiTextResponse;
}

// BLOG TYPES

export type BlogPostListItem = {
  id: number;
  slug: string;
  status: string;
  published_at: string | null;
  hero_image_url: string;
  title: string;
  excerpt: string;
  language: string;
  seo_title: string;
  seo_description: string;
};

export type BlogPostListResponse = BlogPostListItem[];

export type BlogCategoryTranslation = {
  language: string;
  name: string;
  slug: string;
  description: string;
};

export type BlogCategory = {
  id: number;
  key: string;
  translations: BlogCategoryTranslation[];
};

export type BlogPostTranslation = {
  language: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seo_title: string;
  seo_description: string;
  is_published: boolean;
  updated_at: string;
};

export type BlogPostDetail = {
  id: number;
  slug: string;
  status: string;
  published_at: string | null;
  hero_image_url: string;
  translation: BlogPostTranslation;
  categories: BlogCategory[];
};

// SIDEBAR TYPES

export type SidebarItem = {
  id: number;
  slot: string;
  title: string;
  item_type: string;
  content_html: string;
  content_text: string;
  image_url: string;
  link_url: string;
  link_text: string;
  order: number;
  is_active: boolean;
  css_classes: string;
};

// BLOG HELPERS

export async function fetchBlogPosts(params: {
  lang: string;
  category?: string;
  search?: string;
}): Promise<BlogPostListResponse> {
  const sp = new URLSearchParams();
  sp.set("lang", params.lang);
  if (params.category) sp.set("category", params.category);
  if (params.search) sp.set("search", params.search);

  const res = await fetch(
    `${API_BASE_URL}/api/blog/posts/?${sp.toString()}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch blog posts (${res.status})`);
  }
  const json = await res.json();
  
  // Safety guard: ensure we always return an array
  if (!Array.isArray(json)) {
    console.warn("Blog posts API did not return an array, returning empty array instead");
    return [];
  }
  
  return json as BlogPostListResponse;
}

export async function fetchBlogPost(params: {
  slug: string;
  lang: string;
}): Promise<BlogPostDetail> {
  const sp = new URLSearchParams();
  sp.set("lang", params.lang);

  const res = await fetch(
    `${API_BASE_URL}/api/blog/posts/${encodeURIComponent(
      params.slug
    )}/?${sp.toString()}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch blog post (${res.status})`);
  }
  return (await res.json()) as BlogPostDetail;
}

export async function fetchBlogCategories(lang: string = "en"): Promise<BlogCategory[]> {
  const res = await fetch(`${API_BASE_URL}/api/blog/categories/?lang=${encodeURIComponent(lang)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch blog categories (${res.status})`);
  }
  const json = await res.json();
  
  // Safety guard: ensure we always return an array
  if (!Array.isArray(json)) {
    console.warn("Blog categories API did not return an array, returning empty array instead");
    return [];
  }
  
  return json as BlogCategory[];
}

export async function fetchBusinessDetail(params: {
  slug: string;
  lang: string;
}): Promise<BusinessDetail> {
  const sp = new URLSearchParams();
  sp.set("lang", params.lang);

  const res = await fetch(
    `${API_BASE_URL}/api/businesses/${encodeURIComponent(
      params.slug
    )}/?${sp.toString()}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch business detail (${res.status})`);
  }
  return (await res.json()) as BusinessDetail;
}

// SIDEBAR HELPER

export async function fetchSidebarItems(params: {
  slot: string;
  lang: string;
}): Promise<SidebarItem[]> {
  const sp = new URLSearchParams();
  sp.set("slot", params.slot);
  sp.set("lang", params.lang);

  const res = await fetch(
    `${API_BASE_URL}/api/ui/sidebar/?${sp.toString()}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch sidebar items (${res.status})`);
  }
  return (await res.json()) as SidebarItem[];
}

// CMS API Types
export type SectionItem = {
  id: number;
  order: number;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  badge: string;
  meta: Record<string, any>;
};

export type Section = {
  id: number;
  key: string;
  type: string;
  order: number;
  active: boolean;
  settings: Record<string, any>;
  title: string;
  subtitle: string;
  body: string;
  cta_label: string;
  cta_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  items: SectionItem[];
};

export type PageData = {
  key: string;
  active: boolean;
  sections: Section[];
};

// Fetch page content from CMS
export async function fetchPage(key: string, lang?: string): Promise<PageData> {
  const url = `${API_BASE_URL}/api/pages/${key}/`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch page (${res.status})`);
  }
  
  return (await res.json()) as PageData;
}