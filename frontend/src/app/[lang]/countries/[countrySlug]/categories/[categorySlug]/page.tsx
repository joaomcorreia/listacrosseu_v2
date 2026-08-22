import { notFound } from "next/navigation";
import Layout from "@/components/Layout";
import CountryCategoryPageClient from "@/components/CountryCategoryPageClient";
import { generateSEO } from "@/lib/seo";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { isSupportedLanguage } from "@/lib/lang";
import { countryCategoryCopy } from "@/lib/country-category-copy";

type Country = { id: number; name: string; slug: string; code?: string };
type Category = { id: number; name: string; slug: string; business_count?: number };

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${INTERNAL_BACKEND_URL}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Directory request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function resolvePageData(countrySlug: string, categorySlug: string) {
  const [countries, categories] = await Promise.all([
    fetchJson<Country[]>("/api/listings/countries/"),
    fetchJson<Category[]>("/api/listings/categories/"),
  ]);
  const country = countries.find((item) => item.slug === countrySlug);
  const category = categories.find((item) => item.slug === categorySlug);
  if (!country || !category) return null;

  const result = await fetchJson<{ total?: number; country_category_indexable?: boolean }>(
    `/api/listings/businesses/search/?country=${encodeURIComponent(country.slug)}&category=${encodeURIComponent(category.slug)}&limit=1`,
  );

  return {
    country,
    category,
    listingCount: Number(result.total || 0),
    indexable: result.country_category_indexable === true,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; countrySlug: string; categorySlug: string }>;
}) {
  const { lang, countrySlug, categorySlug } = await params;
  if (!isSupportedLanguage(lang)) notFound();
  const data = await resolvePageData(countrySlug, categorySlug);
  if (!data) notFound();

  const path = `/countries/${countrySlug}/categories/${categorySlug}`;
  const copy = countryCategoryCopy(data.category, data.country, lang);
  return generateSEO(
    {
      title: copy.title,
      description: copy.description,
      canonical: `/${lang}${path}`,
      hreflangPath: path,
      noindex: !data.indexable,
    },
    lang,
  );
}

export default async function CountryCategoryPage({
  params,
}: {
  params: Promise<{ lang: string; countrySlug: string; categorySlug: string }>;
}) {
  const { lang, countrySlug, categorySlug } = await params;
  if (!isSupportedLanguage(lang)) notFound();
  const data = await resolvePageData(countrySlug, categorySlug);
  if (!data) notFound();

  return (
    <Layout>
      <CountryCategoryPageClient
        lang={lang}
        country={data.country}
        category={data.category}
        listingCount={data.listingCount}
      />
    </Layout>
  );
}
