type BusinessUrlInput = {
  slug: string;
  canonical_path?: string;
  city?: { slug: string } | null;
  town?: { slug: string } | null;
};

/** Build the current location-first detail route for a business listing. */
export function getBusinessCanonicalPath(
  business: BusinessUrlInput,
  lang: string,
): string {
  if (!business.city?.slug) {
    return `/${lang}/business/${business.slug}`;
  }

  const locationParts = [lang, business.city.slug];
  if (business.town?.slug) {
    locationParts.push(business.town.slug);
  }
  locationParts.push(business.slug);
  return `/${locationParts.join("/")}`;
}
