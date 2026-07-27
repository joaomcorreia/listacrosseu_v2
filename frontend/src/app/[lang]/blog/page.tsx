import Layout from "@/components/Layout";
import BlogListPageClient from "@/components/BlogListPageClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import StructuredData from "@/components/StructuredData";
import { generateBreadcrumbSchema } from "@/lib/schema";
import { generateSEO } from "@/lib/seo";
import type { BlogCategory, BlogPostListItem } from "@/lib/api";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { PUBLIC_SITE_URL } from "@/lib/env.public";

export const revalidate = 3600;

const blogTranslations = {
  en: {
    title: "Blog",
    description:
      "Guides, updates, and insights for small and micro businesses across Europe.",
  },
  fr: {
    title: "Blog",
    description:
      "Guides, actualites et conseils pour les petites entreprises en Europe.",
  },
  de: {
    title: "Blog",
    description:
      "Guides und Updates fur kleine Unternehmen in Europa.",
  },
  es: {
    title: "Blog",
    description:
      "Guias, novedades y consejos para pequenas empresas en Europa.",
  },
  pt: {
    title: "Blog",
    description:
      "Guias, novidades e dicas para pequenas empresas na Europa.",
  },
  nl: {
    title: "Blog",
    description:
      "Gidsen en updates voor kleine bedrijven in Europa.",
  },
};

async function fetchBlogPosts(lang: string): Promise<BlogPostListItem[]> {
  const baseUrl = INTERNAL_BACKEND_URL;
  const res = await fetch(`${baseUrl}/api/blog/?lang=${encodeURIComponent(lang)}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    return [];
  }
  const json = await res.json();
  return Array.isArray(json) ? (json as BlogPostListItem[]) : [];
}

async function fetchBlogCategories(lang: string): Promise<BlogCategory[]> {
  const baseUrl = INTERNAL_BACKEND_URL;
  const res = await fetch(
    `${baseUrl}/api/blog/categories/?lang=${encodeURIComponent(lang)}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    return [];
  }
  const json = await res.json();
  return Array.isArray(json) ? (json as BlogCategory[]) : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang ?? "en";
  const t = blogTranslations[lang as keyof typeof blogTranslations] || blogTranslations.en;

  return generateSEO(
    {
      title: t.title,
      description: t.description,
      canonical: `/${lang}/blog`,
      keywords: [
        "business blog",
        "EU business",
        "small business",
        "micro business",
        "ListAcross EU",
      ],
    },
    lang,
  );
}

export default async function BlogLangPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const lang = resolvedParams?.lang ?? "en";
  const posts = await fetchBlogPosts(lang);
  const categories = await fetchBlogCategories(lang);

  const baseUrl = PUBLIC_SITE_URL;
  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}/${lang}` },
    { name: "Blog", url: `${baseUrl}/${lang}/blog` },
  ];

  return (
    <Layout headerExtra={<Breadcrumbs current="Blog" />}>
      <StructuredData data={generateBreadcrumbSchema(breadcrumbs)} />
      <BlogListPageClient
        lang={lang}
        initialPosts={posts}
        initialCategories={categories}
        initialTotal={posts.length}
      />
    </Layout>
  );
}

