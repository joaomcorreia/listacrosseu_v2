import Layout from "@/components/Layout";
import CountryPageClient from "@/components/CountryPageClient";
import StructuredData from "@/components/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/schema";
import { generateSEO } from "@/lib/seo";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { PUBLIC_SITE_URL } from "@/lib/env.public";
import { notFound } from "next/navigation";

interface CountryPageProps {
  params: Promise<{
    lang: string;
    countrySlug: string;
  }>;
}

type CountrySummary = {
  id: number;
  name: string;
  slug: string;
  business_count?: number;
};

async function fetchCountry(countrySlug: string): Promise<CountrySummary | null> {
  try {
    const baseUrl = INTERNAL_BACKEND_URL;
    const response = await fetch(`${baseUrl}/api/listings/countries/`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status}`);
    }

    const countries = (await response.json()) as CountrySummary[];
    return countries.find((country) => country.slug === countrySlug) || null;
  } catch (error) {
    console.error("Error fetching country:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; countrySlug: string }>;
}) {
  const { lang, countrySlug } = await params;
  const country = await fetchCountry(countrySlug);
  if (!country) notFound();

  const countryName = country?.name || countrySlug;
  const title = `Businesses in ${countryName}`;
  const description = `Find local businesses and services in ${countryName} on ListAcross EU. Browse listed businesses by city and category.`;

  return generateSEO(
    {
      title,
      description,
      canonical: `/${lang}/countries/${countrySlug}`,
      keywords: [
        "business directory",
        "local businesses",
        "services",
        countryName,
        "ListAcross EU",
      ],
    },
    lang,
  );
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { lang, countrySlug } = await params;
  const country = await fetchCountry(countrySlug);
  if (!country) notFound();

  const baseUrl = PUBLIC_SITE_URL;
  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}/${lang}` },
    { name: "Countries", url: `${baseUrl}/${lang}/countries` },
    {
      name: country?.name || countrySlug,
      url: `${baseUrl}/${lang}/countries/${countrySlug}`,
    },
  ];

  return (
    <Layout>
      <StructuredData data={generateBreadcrumbSchema(breadcrumbs)} />
      <CountryPageClient countrySlug={countrySlug} />
    </Layout>
  );
}

