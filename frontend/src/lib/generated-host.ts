export const GENERATED_SITE_BASE_DOMAIN =
  (process.env.NEXT_PUBLIC_GENERATED_SITE_BASE_DOMAIN || "listacross.local").trim().toLowerCase();

export function resolveGeneratedWebsiteHost(hostname: string): string | null {
  const normalized = hostname.split(":")[0].toLowerCase().replace(/\.$/, "");
  const suffix = `.${GENERATED_SITE_BASE_DOMAIN}`;
  if (!normalized.endsWith(suffix)) return null;
  const slug = normalized.slice(0, -suffix.length);
  return slug && !slug.includes(".") ? slug : null;
}

/**
 * Build the internal rewrite destination for a generated-site request.
 * The public request may be HTTPS, but the local Next listener is HTTP-only.
 * Request headers, including the original Host, remain attached by Next's
 * rewrite so public hostname-aware behavior is preserved.
 */
export function generatedWebsiteRewriteUrl(requestUrl: string, slug: string): URL {
  const rewritten = new URL(requestUrl);
  rewritten.protocol = "http:";
  rewritten.pathname = `/_generated-site/${slug}`;
  return rewritten;
}
