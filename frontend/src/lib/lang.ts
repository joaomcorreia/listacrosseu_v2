export const SUPPORTED_LANGS = ["en", "nl", "pt", "fr", "es", "de"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export function normalizeLang(raw?: string | null): SupportedLang {
  const lang = (raw || "en").toLowerCase();
  return (SUPPORTED_LANGS.includes(lang as SupportedLang)
    ? lang
    : "en") as SupportedLang;
}

/**
 * Helper functions for managing language state across the application
 */

/**
 * Create a URL with preserved language parameter
 * @param path - The base path (e.g., "/blog", "/search")
 * @param searchParams - Current URL search parameters
 * @returns URL with language parameter preserved
 */
export function langHref(path: string, searchParams: URLSearchParams): string {
  const lang = normalizeLang(searchParams.get("lang"));
  const sp = new URLSearchParams();
  sp.set("lang", lang);
  
  // If there are other params we want to preserve, add them
  // For now, we just preserve the language
  return `${path}?${sp.toString()}`;
}

/**
 * Get the current language from search parameters
 * @param searchParams - Current URL search parameters
 * @returns Language code (defaults to "en")
 */
export function getCurrentLang(searchParams: URLSearchParams): string {
  return normalizeLang(searchParams.get("lang"));
}

/**
 * Add language parameter to a URL if not already present
 * @param url - The URL to modify
 * @param lang - Language code to add
 * @returns URL with language parameter
 */
export function appendLang(url: string, lang: string): string {
  const urlObj = new URL(url, 'http://localhost'); // Use dummy base for relative URLs
  if (!urlObj.searchParams.has('lang')) {
    urlObj.searchParams.set('lang', lang);
  }
  return urlObj.pathname + urlObj.search;
}

/**
 * Supported language codes (deprecated - use SUPPORTED_LANGS)
 */
export const SUPPORTED_LANGUAGES = SUPPORTED_LANGS;

export type SupportedLanguage = SupportedLang;

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLang {
  return SUPPORTED_LANGS.includes(lang as SupportedLang);
}