import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryDetailClient from "@/components/CategoryDetailClient";
import { generateSEO } from "@/lib/seo";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";

interface CategoryPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { lang, slug } = await params;
  
  return (
    <Layout headerExtra={<Breadcrumbs current="Categories" />}>
      <CategoryDetailClient categorySlug={slug} lang={lang} />
    </Layout>
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps) {
  const { lang, slug } = await params;
  let isPublic = false;
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/listings/categories/`, { cache: "no-store" });
    if (response.ok) {
      const categories = (await response.json()) as Array<{ slug?: string; is_public?: boolean }>;
      isPublic = categories.some((category) => category.slug === slug && category.is_public !== false);
    }
  } catch {
    isPublic = false;
  }
  if (!isPublic) {
    return generateSEO(
      {
        title: "Category",
        description: "This category is not currently available in the public directory.",
        canonical: `/${lang}/categories/${slug}`,
        noindex: true,
      },
      lang,
    );
  }
  return undefined;
}
