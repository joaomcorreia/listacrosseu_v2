import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Layout from "@/components/Layout";
import StructuredData from "@/components/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/schema";
import { generateSEO } from "@/lib/seo";
import CityPageClient from "./CityPageClient";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { PUBLIC_SITE_URL } from "@/lib/env.public";

interface Props {
  params: Promise<{ 
    lang: string; 
    slug: string; 
  }>;
}

type CitySummary = {
  id: number;
  name: string;
  slug: string;
  country?: {
    name: string;
    slug: string;
  };
  businessCount?: number;
};

async function fetchCityBySlug(slug: string): Promise<CitySummary | null> {
  try {
    const baseUrl = INTERNAL_BACKEND_URL;
    const response = await fetch(`${baseUrl}/api/listings/cities/`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`);
    }

    const cities = (await response.json()) as CitySummary[];
    return cities.find((city) => city.slug === slug) || null;
  } catch (error) {
    console.error("Error fetching city:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const city = await fetchCityBySlug(slug);

  if (!city) {
    return {};
  }

  const countryName = city.country?.name || "";
  const businessCount = city.businessCount || "many";

  return generateSEO(
    {
      title: `Businesses in ${city.name}, ${countryName} - Local Directory`,
      description: `Discover ${businessCount} local businesses and services in ${city.name}, ${countryName}. Find verified companies, contact details, and professional services in your area.`,
      canonical: `/${lang}/cities/${slug}`,
      keywords: [
        `businesses ${city.name}`,
        `${city.name} directory`,
        `services ${city.name}`,
        countryName,
        "local business",
        "EU directory",
      ],
    },
    lang,
  );
}

export default async function CityPage({ params }: Props) {
  const { lang, slug } = await params;
  const city = await fetchCityBySlug(slug);
  
  // Known slug corrections for legacy URLs
  const SLUG_FIXES: { [key: string]: string } = {
    'vilanovadegaia': 'vila-nova-de-gaia',
    // Add more as needed
  };
  
  // Check if this is an incorrect slug that needs correction
  if (SLUG_FIXES[slug]) {
    const correctSlug = SLUG_FIXES[slug];
    redirect(`/${lang}/cities/${correctSlug}`);
  }
  
  // Simple validation - ensure slug exists
  if (!slug || slug.length === 0) {
    notFound();
  }

  const baseUrl = PUBLIC_SITE_URL;
  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}/${lang}` },
    { name: "Cities", url: `${baseUrl}/${lang}/cities` },
  ];

  if (city?.country?.name) {
    breadcrumbs.push({
      name: city.country.name,
      url: `${baseUrl}/${lang}/countries/${city.country.slug}`,
    });
  }

  breadcrumbs.push({
    name: city?.name || slug,
    url: `${baseUrl}/${lang}/cities/${slug}`,
  });
  
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema(breadcrumbs)} />
      <Layout headerVariant="overlay">
        <CityPageClient lang={lang} slug={slug} />
      </Layout>
    </>
  );
}

