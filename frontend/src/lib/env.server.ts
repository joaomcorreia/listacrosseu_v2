import "server-only";

const isDevelopment = process.env.NODE_ENV !== "production";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/g, "");
}

function requireServerEnv(name: string, developmentFallback: string): string {
  const value = process.env[name];
  if (value && value.trim()) {
    return normalizeBaseUrl(value.trim());
  }
  if (isDevelopment) {
    return developmentFallback;
  }
  throw new Error(`${name} must be configured for production server execution.`);
}

export const INTERNAL_BACKEND_URL = requireServerEnv(
  "BACKEND_URL",
  "http://127.0.0.1:8000",
);

export const VISUAL_EDITOR_ENABLED =
  process.env.ENABLE_VISUAL_HOMEPAGE_EDITOR === "1";
