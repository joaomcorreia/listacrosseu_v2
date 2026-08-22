type SupportedCopyLanguage = "en" | "fr" | "de" | "es" | "pt" | "nl";

const CATEGORY_LABELS: Record<string, Partial<Record<SupportedCopyLanguage, string>>> = {
  restaurant: { en: "Restaurants", fr: "restaurants", de: "Restaurants", es: "restaurantes", pt: "restaurantes", nl: "restaurants" },
  restaurants: { en: "Restaurants", fr: "restaurants", de: "Restaurants", es: "restaurantes", pt: "restaurantes", nl: "restaurants" },
  health: { en: "Health", fr: "services de sant\u00e9", de: "Gesundheitsdienste", es: "servicios de salud", pt: "servi\u00e7os de sa\u00fade", nl: "gezondheidsdiensten" },
  retail: { en: "Retail", fr: "commerces", de: "Einzelhandel", es: "comercios", pt: "com\u00e9rcio", nl: "detailhandel" },
  beauty: { en: "Beauty", fr: "services de beaut\u00e9", de: "Beauty", es: "servicios de belleza", pt: "servi\u00e7os de beleza", nl: "beautydiensten" },
  "home-services": {
    en: "Home Services", fr: "services \u00e0 domicile", de: "Haushaltsservices",
    es: "servicios para el hogar", pt: "servi\u00e7os para casa", nl: "diensten aan huis",
  },
  "professional-services": {
    en: "Professional Services", fr: "services professionnels", de: "professionelle Dienstleistungen",
    es: "servicios profesionales", pt: "servi\u00e7os profissionais", nl: "professionele diensten",
  },
};

const COPY = {
  en: {
    title: (category: string, country: string) => `${category} in ${country}`,
    description: (category: string, country: string) => `Browse ${category.toLocaleLowerCase("en")} in ${country} on ListAcross EU.`,
    intro: (category: string, country: string) => `Explore ${category} in ${country}.`,
  },
  fr: {
    title: (category: string, country: string) => `${category} en ${country}`,
    description: (category: string, country: string) => `D\u00e9couvrez les entreprises de la cat\u00e9gorie \u00ab ${category.toLocaleLowerCase("fr")} \u00bb en ${country} sur ListAcross EU.`,
    intro: (category: string, country: string) => `D\u00e9couvrez les entreprises de la cat\u00e9gorie \u00ab ${category.toLocaleLowerCase("fr")} \u00bb en ${country}.`,
  },
  de: {
    title: (category: string, country: string) => `${category} in ${country}`,
    description: (category: string, country: string) => `Entdecken Sie ${category} in ${country} auf ListAcross EU.`,
    intro: (category: string, country: string) => `Entdecken Sie ${category} in ${country}.`,
  },
  es: {
    title: (category: string, country: string) => `${category} en ${country}`,
    description: (category: string, country: string) => `Descubra ${category} en ${country} en ListAcross EU.`,
    intro: (category: string, country: string) => `Descubra ${category} en ${country}.`,
  },
  pt: {
    title: (category: string, country: string) => `${category} ${country}`,
    description: (category: string, country: string) => `Encontre ${category} ${country} no ListAcross EU.`,
    intro: (category: string, country: string) => `Encontre ${category} ${country}.`,
  },
  nl: {
    title: (category: string, country: string) => `${category} in ${country}`,
    description: (category: string, country: string) => `Ontdek ${category} in ${country} op ListAcross EU.`,
    intro: (category: string, country: string) => `Ontdek ${category} in ${country}.`,
  },
} as const;

const PORTUGUESE_COUNTRY_PREPOSITIONS: Record<string, string> = {
  AT: "na", BE: "na", BG: "na", HR: "na", CZ: "na", DK: "na", EE: "na", FI: "na",
  FR: "na", DE: "na", GR: "na", HU: "na", IE: "na", IT: "na", LV: "na", LT: "na",
  NL: "nos", PL: "na", RO: "na", SK: "na", SI: "na", ES: "na", SE: "na", LU: "no",
  PT: "em", CY: "em", MT: "em",
};

function languageOrEnglish(lang: string): SupportedCopyLanguage {
  return lang in COPY ? lang as SupportedCopyLanguage : "en";
}

export function localizedCountryName(country: { name: string; slug: string; code?: string }, lang: string): string {
  const code = country.code || country.slug.toUpperCase();
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(code) || country.name;
  } catch {
    return country.name;
  }
}

export function localizedCategoryName(category: { name: string; slug: string }, lang: string): string {
  const language = languageOrEnglish(lang);
  return CATEGORY_LABELS[category.slug]?.[language] || category.name;
}

function portugueseCountryPhrase(country: { name: string; slug: string; code?: string }, countryName: string): string {
  const code = (country.code || country.slug).toUpperCase();
  return `${PORTUGUESE_COUNTRY_PREPOSITIONS[code] || "em"} ${countryName}`;
}

export function countryCategoryCopy(
  category: { name: string; slug: string },
  country: { name: string; slug: string; code?: string },
  lang: string,
) {
  const language = languageOrEnglish(lang);
  const categoryName = localizedCategoryName(category, language);
  const countryName = localizedCountryName(country, language);
  const countryPhrase = language === "pt" ? portugueseCountryPhrase(country, countryName) : countryName;
  const displayCategoryName = categoryName.charAt(0).toLocaleUpperCase(language) + categoryName.slice(1);
  return {
    categoryName,
    countryName,
    title: COPY[language].title(displayCategoryName, countryPhrase),
    description: COPY[language].description(categoryName, countryPhrase),
    intro: COPY[language].intro(categoryName, countryPhrase),
  };
}
