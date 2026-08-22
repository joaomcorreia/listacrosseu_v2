export const PUBLIC_CATEGORY_EXCLUDED_SLUGS = new Set(["uncategorized"]);

export function isPublicCategory(category: { slug?: string; is_public?: boolean }): boolean {
  const slug = String(category.slug || "").toLowerCase();
  return category.is_public !== false && !PUBLIC_CATEGORY_EXCLUDED_SLUGS.has(slug);
}
