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

export const PUBLIC_API_BASE_URL = requirePublicEnv(
  process.env.NEXT_PUBLIC_API_BASE_URL,
  "NEXT_PUBLIC_API_BASE_URL",
  "http://127.0.0.1:8000",
);

export const GLOBAL_NOINDEX_ENABLED =
  process.env.NEXT_PUBLIC_STAGING_NOINDEX === "1";

export function withPublicApiUrl(path: string): string {
  return `${PUBLIC_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function withPublicSiteUrl(path: string): string {
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

