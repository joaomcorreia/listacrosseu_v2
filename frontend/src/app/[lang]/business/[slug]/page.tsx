import { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import { BusinessDetailPageClient } from "@/components/business/BusinessDetailPageClient";
import StructuredData from "@/components/StructuredData";
import { generateBreadcrumbSchema, generateBusinessSchema } from "@/lib/schema";
import { generateSEO } from "@/lib/seo";
import { INTERNAL_BACKEND_URL } from '@/lib/env.server';
import type { BusinessDetail } from '@/lib/api';
import { PUBLIC_SITE_URL } from "@/lib/env.public";
import { getBusinessCanonicalPath } from "@/lib/businessUrls";
import { fetchBusinessDiscovery } from '@/lib/business-discovery';

type Business = BusinessDetail;
const BUSINESS_LANGUAGES = ["en", "fr", "de", "es", "pt", "nl"] as const;

function businessHreflangs(path: string): Record<string, string> {
  return Object.fromEntries(BUSINESS_LANGUAGES.map((language) => [language, path.replace(/^\/[^/]+(?=\/|$)/, `/${language}`)]));
}

async function fetchBusiness(slug: string): Promise<Business | null> {
  try {
    const baseUrl = INTERNAL_BACKEND_URL;
    const response = await fetch(`${baseUrl}/api/listings/businesses/${slug}/`, {
      // Enable ISR (Incremental Static Regeneration)
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch business: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching business:", error);
    return null;
  }
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  const business = await fetchBusiness(slug);

  if (!business) {
    notFound();
  }

  const discovery = await fetchBusinessDiscovery(business, lang);

  const baseUrl = PUBLIC_SITE_URL;
  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}/${lang}` },
    { name: "Countries", url: `${baseUrl}/${lang}/countries` },
  ];

  if (business.country?.name) {
    breadcrumbs.push({
      name: business.country.name,
      url: `${baseUrl}/${lang}/countries/${business.country.slug}`,
    });
  }

  breadcrumbs.push({
    name: business.name,
    url: `${baseUrl}/${lang}/business/${business.slug}`,
  });

  return (
    <>
      <StructuredData data={generateBusinessSchema(business, lang)} />
      <StructuredData data={generateBreadcrumbSchema(breadcrumbs)} />
      <TopHeader />
      <Layout withTopHeader>
        <BusinessDetailPageClient business={business} lang={lang} discovery={discovery} />
      </Layout>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const business = await fetchBusiness(slug);

  if (!business) {
    return {
      title: "Business Not Found | ListAcross EU",
    };
  }

  const cityName = business.city?.name || "";
  const countryName = business.country?.name || "";
  const categoryName = business.category?.name || "Business";

  const titleBase = business.name;
  const description =
    business.description ||
    `${categoryName} in ${cityName || countryName}. Professional services and reliable business information on ListAcross EU.`;

  const canonicalPath = getBusinessCanonicalPath(business, lang);

  const seo = generateSEO({ title: titleBase, description, canonical: canonicalPath, ogImage: business.logo_url || business.image_url, keywords: business.keywords?.length ? business.keywords : ["business directory", "local business", "services", "ListAcross EU", countryName].filter(Boolean) as string[] }, lang);
  return { ...seo, alternates: { ...(seo.alternates || {}), canonical: canonicalPath, languages: businessHreflangs(canonicalPath) } };
}

