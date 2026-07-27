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

type Business = BusinessDetail;

async function fetchBusiness(slug: string): Promise<Business | null> {
  try {
    const baseUrl = INTERNAL_BACKEND_URL;
    const response = await fetch(`${baseUrl}/api/listings/businesses/${slug}/`, {
      // Enable ISR (Incremental Static Regeneration)
      next: { revalidate: 3600 }, // Revalidate every hour
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
        <BusinessDetailPageClient business={business} lang={lang} />
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

  const titleBase = cityName
    ? `${business.name} in ${cityName}`
    : business.name;
  const description =
    business.description ||
    `${categoryName} in ${cityName || countryName}. Professional services and reliable business information on ListAcross EU.`;

  const canonicalPath =
    business.canonical_path || `/${lang}/business/${business.slug}`;

  return generateSEO(
    {
      title: titleBase,
      description,
      canonical: canonicalPath,
      ogImage: business.logo_url || business.image_url,
      keywords: business.keywords?.length
        ? business.keywords
        : [
            "business directory",
            "local business",
            "services",
            "ListAcross EU",
            countryName,
          ].filter(Boolean) as string[],
    },
    lang,
  );
}

