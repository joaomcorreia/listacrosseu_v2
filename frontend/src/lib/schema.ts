export function generateWebsiteSchema(lang: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://listacross.eu/#website",
        url: "https://listacross.eu",
        name: "ListAcross EU",
        description:
          "European business directory connecting local businesses across all 27 EU countries",
        inLanguage: ["en", "fr", "de", "es", "pt", "nl"],
        publisher: {
          "@id": "https://listacross.eu/#organization",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://listacross.eu/#organization",
        name: "ListAcross EU",
        legalName: "Just Code Works",
        url: "https://listacross.eu",
        logo: {
          "@type": "ImageObject",
          url: "https://listacross.eu/logo.png",
          width: 600,
          height: 60,
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: "info@listacross.eu",
          areaServed: "EU",
          availableLanguage: [
            "English",
            "French",
            "German",
            "Spanish",
            "Portuguese",
            "Dutch",
          ],
        },
        address: {
          "@type": "PostalAddress",
          addressCountry: "NL",
          addressLocality: "Waalwijk",
        },
      },
    ],
  };
}

export function generateBusinessSchema(business: any, lang: string) {
  const baseUrl = "https://listacross.eu";
  const businessUrl = `${baseUrl}/${lang}/business/${business.slug}`;

  let areaServed: any[] = [];

  if (business.tier === "premium") {
    const euCountries = [
      "AT",
      "BE",
      "BG",
      "HR",
      "CY",
      "CZ",
      "DK",
      "EE",
      "FI",
      "FR",
      "DE",
      "GR",
      "HU",
      "IE",
      "IT",
      "LV",
      "LT",
      "LU",
      "MT",
      "NL",
      "PL",
      "PT",
      "RO",
      "SK",
      "SI",
      "ES",
      "SE",
    ];
    areaServed = euCountries.map((code) => ({
      "@type": "Country",
      identifier: code,
    }));
  } else if (business.tier === "claimed" && business.city) {
    areaServed = [
      {
        "@type": "City",
        name: business.city.name,
        ...(business.country?.name && { addressCountry: business.country.name }),
      },
    ];
  } else if (business.country) {
    areaServed = [
      {
        "@type": "Country",
        name: business.country.name,
        identifier: business.country.slug?.toUpperCase(),
      },
    ];
  }

  const address = {
    "@type": "PostalAddress",
    ...(business.address_line1 && { streetAddress: business.address_line1 }),
    ...(!business.address_line1 && business.address && { streetAddress: business.address }),
    ...(business.city?.name && { addressLocality: business.city.name }),
    ...(business.postal_code && { postalCode: business.postal_code }),
    ...(business.country?.name && { addressCountry: business.country.name }),
  };
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${businessUrl}#business`,
    name: business.name,
    description:
      business.description ||
      `${business.name} - ${business.category?.name || "Business"}${
        business.city?.name || business.country?.name ? ` in ${business.city?.name || business.country?.name}` : ""
      }`,
    url: business.website || businessUrl,
    image: business.image_url || business.logo_url,
    ...(Object.keys(address).length > 1 && { address }),
  };

  if (areaServed.length > 0) {
    schema.areaServed = areaServed;
  }

  if (business.phone) schema.telephone = business.phone;
  if (business.latitude && business.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    };
  }

  if (business.tier === "premium") {
    schema.priceRange = "EUR";
    if (business.premium_images?.length > 0) {
      schema.image = business.premium_images;
    }
  }

  return schema;
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateArticleSchema(params: {
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string;
  url: string;
}) {
  const {
    headline,
    description,
    image,
    datePublished,
    dateModified,
    authorName,
    url,
  } = params;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    image: image ? [image] : undefined,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    author: {
      "@type": "Organization",
      name: authorName || "ListAcross EU",
    },
    publisher: {
      "@type": "Organization",
      name: "ListAcross EU",
      logo: {
        "@type": "ImageObject",
        url: "https://listacross.eu/logo.png",
      },
    },
    mainEntityOfPage: url,
  };
}
