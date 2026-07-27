import { debugWarn } from "@/lib/debug";

import * as React from 'react';
import { API_BASE_URL } from "./api";

/**
 * Fetch UI text translations from the backend
 * @param group - The UI text group key
 * @param lang - Language code
 * @returns Object with translated text key-value pairs
 */
export async function fetchUiText(group: string, lang: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/ui/texts/${group}/?lang=${lang}`
    );
    if (!res.ok) {
      debugWarn(`Failed to fetch UI text for group ${group} in language ${lang}`);
      return {};
    }
    const json = await res.json();
    return json.data || {};
  } catch (error) {
    console.error("Error fetching UI text:", error);
    return {};
  }
}

/**
 * Hook for fetching UI texts in React components
 */
export function useUiText(group: string, lang: string) {
  const [texts, setTexts] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchUiText(group, lang);
        if (!cancelled) {
          setTexts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load UI texts");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    
    return () => {
      cancelled = true;
    };
  }, [group, lang]);

  return { texts, loading, error };
}
