const isDevelopment = process.env.NODE_ENV !== "production";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/g, "");
}

function requirePublicEnv(
  value: string | undefined,
  name: string,
  developmentFallback: string,
): string {
  if (value && value.trim()) {
    return normalizeBaseUrl(value.trim());
  }
  if (isDevelopment) {
    return developmentFallback;
  }
  throw new Error(`${name} must be configured for production builds.`);
}

export const PUBLIC_SITE_URL = requirePublicEnv(
  process.env.NEXT_PUBLIC_SITE_URL,
  "NEXT_PUBLIC_SITE_URL",
  "http://127.0.0.1:3000",
);

const CONFIGURED_API_BASE_URL = requirePublicEnv(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "NEXT_PUBLIC_API_BASE_URL",
  "http://127.0.0.1:8000",
);

// Cross-origin public applications, such as Generated Website subdomains,
// must call the central API instead of their own same-origin /api path.
export const PUBLIC_CONFIGURED_API_BASE_URL = CONFIGURED_API_BASE_URL;

// Browser requests use the same-origin Next.js API path. Server-side callers
// retain the configured absolute backend URL.
export const PUBLIC_API_BASE_URL =
  typeof window === "undefined" ? CONFIGURED_API_BASE_URL : "";

export const GENERATED_SITE_BASE_DOMAIN =
  process.env.NEXT_PUBLIC_GENERATED_SITE_BASE_DOMAIN?.trim() || "listacross.local";

export function generatedWebsiteHostUrl(slug: string, path = "") {
  if (typeof window !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(window.location.hostname)) {
    return `${window.location.origin}/en/generated/${slug}${path}`;
  }
  if (typeof window === "undefined") return `http://${slug}.${GENERATED_SITE_BASE_DOMAIN}:3004${path}`;
  return `${window.location.protocol}//${slug}.${GENERATED_SITE_BASE_DOMAIN}${window.location.port ? `:${window.location.port}` : ""}${path}`;
}

export const GLOBAL_NOINDEX_ENABLED =
  process.env.NEXT_PUBLIC_STAGING_NOINDEX === "1";

export const PUBLIC_CLAIM_CTA_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PUBLIC_CLAIM_CTA !== undefined
    ? process.env.NEXT_PUBLIC_ENABLE_PUBLIC_CLAIM_CTA === "1"
    : process.env.NODE_ENV !== "production";

export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || "";

export const STRIPE_GENERATED_WEBSITE_URL =
  process.env.NEXT_PUBLIC_STRIPE_GENERATED_WEBSITE_URL?.trim() || "";

export function withPublicApiUrl(path: string): string {
  return `${PUBLIC_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function withConfiguredPublicApiUrl(path: string): string {
  return `${PUBLIC_CONFIGURED_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function withPublicSiteUrl(path: string): string {
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

