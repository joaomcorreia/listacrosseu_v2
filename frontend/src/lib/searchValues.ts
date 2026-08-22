const TEMPLATE_VALUE = /^\{[^{}]+\}$/;

export function sanitizeSearchValue(value: string | null | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    // Keep the original value when it is not valid URI encoding.
  }

  return TEMPLATE_VALUE.test(decoded) ? "" : trimmed;
}
