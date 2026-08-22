import type { Metadata } from 'next';

import { GLOBAL_NOINDEX_ENABLED, PUBLIC_SITE_URL } from '@/lib/env.public';

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  hreflangPath?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
  schema?: object;
}

function deriveHreflangPath(canonical?: string): string {
  if (!canonical || !canonical.startsWith("/")) return "";
  return canonical.replace(/^\/[^/]+(?=\/|$)/, "");
}

export function generateSEO(config: SEOConfig, lang: string = 'en'): Metadata {
  const siteName = 'ListAcross EU';
  const baseUrl = PUBLIC_SITE_URL;

  const translations = {
    en: {
      tagline: 'European Business Directory - Find Local Businesses Across the EU',
      countries: 'Find businesses in',
    },
    fr: {
      tagline: "Annuaire d'Entreprises Europeen - Trouvez des Entreprises Locales dans l'UE",
      countries: 'Trouver des entreprises en',
    },
    de: {
      tagline: 'Europaisches Unternehmensverzeichnis - Finden Sie lokale Unternehmen in der EU',
      countries: 'Finden Sie Unternehmen in',
    },
    es: {
      tagline: 'Directorio Empresarial Europeo - Encuentre Negocios Locales en la UE',
      countries: 'Encontrar empresas en',
    },
    pt: {
      tagline: 'Diretorio Empresarial Europeu - Encontre Empresas Locais na UE',
      countries: 'Encontrar empresas em',
    },
    nl: {
      tagline: 'Europese Bedrijvengids - Vind Lokale Bedrijven in de EU',
      countries: 'Vind bedrijven in',
    },
  };

  const t = translations[lang as keyof typeof translations] || translations.en;
  const effectiveNoIndex = GLOBAL_NOINDEX_ENABLED || Boolean(config.noindex);
  const fullTitle = `${config.title} | ${siteName}`;
  const fullDescription = config.description || t.tagline;
  const canonical = config.canonical ? `${baseUrl}${config.canonical}` : baseUrl;
  const hreflangPath = config.hreflangPath ?? deriveHreflangPath(config.canonical);
  const ogImage = config.ogImage || `${baseUrl}/og-image.jpg`;
  const robots: Metadata['robots'] = effectiveNoIndex
    ? {
        index: false,
        follow: true,
      }
    : {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      };

  return {
    title: fullTitle,
    description: fullDescription,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: canonical,
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      locale: lang === 'en' ? 'en_US' : `${lang}_${lang.toUpperCase()}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
    },
    alternates: {
      canonical,
      languages: {
        en: `${baseUrl}/en${hreflangPath}`,
        fr: `${baseUrl}/fr${hreflangPath}`,
        de: `${baseUrl}/de${hreflangPath}`,
        es: `${baseUrl}/es${hreflangPath}`,
        pt: `${baseUrl}/pt${hreflangPath}`,
        nl: `${baseUrl}/nl${hreflangPath}`,
      },
    },
    robots,
    keywords: config.keywords?.join(', '),
  };
}
