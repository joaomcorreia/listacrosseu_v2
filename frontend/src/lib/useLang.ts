"use client";

import { useSearchParams } from "next/navigation";
import { getCurrentLang, type SupportedLanguage } from "./lang";

/**
 * Hook to get the current language from URL parameters
 * @returns Current language code (defaults to "en")
 */
export function useCurrentLang(): SupportedLanguage {
  const searchParams = useSearchParams();
  return getCurrentLang(searchParams) as SupportedLanguage;
}