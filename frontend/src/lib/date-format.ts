const LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: 'en-GB',
  nl: 'nl-NL',
  pt: 'pt-PT',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
};

export function formatLocalizedDate(value: string | null | undefined, language: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language.toLowerCase()] || 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
