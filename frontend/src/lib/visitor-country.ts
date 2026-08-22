export async function detectVisitorCountry(): Promise<string | null> {
  try {
    const response = await fetch("/api/visitor-country", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json() as { countryCode?: string | null };
      const countryCode = typeof data.countryCode === "string" ? data.countryCode.toUpperCase() : null;
      if (countryCode) return countryCode;
    }
  } catch {
    // Discovery remains EU-wide when detection is unavailable.
  }
  return null;
}
