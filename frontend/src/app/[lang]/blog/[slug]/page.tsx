import Layout from "@/components/Layout";
import BlogPostPageClient from "@/components/BlogPostPageClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import StructuredData from "@/components/StructuredData";
import type { BlogPostDetail, BlogPostListItem } from "@/lib/api";
import { notFound, redirect } from "next/navigation";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { PUBLIC_SITE_URL } from "@/lib/env.public";

export const revalidate = 3600;

const BLOG_LANGUAGES = ["en", "fr", "de", "es", "pt", "nl"] as const;

async function fetchBlogPostDetail(
  slug: string,
  lang: string,
): Promise<BlogPostDetail | null> {
  const baseUrl = INTERNAL_BACKEND_URL;
  const res = await fetch(
    `${baseUrl}/api/blog/${encodeURIComponent(slug)}/?lang=${encodeURIComponent(lang)}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as BlogPostDetail;
}

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

async function fetchBlogAlternates(baseSlug: string, siteUrl: string): Promise<Record<string, string>> {
  const entries: Array<[string, string] | null> = await Promise.all(
    BLOG_LANGUAGES.map(async (language) => {
      const posts = await fetchBlogPostsForLanguage(baseSlug, language);
      const translatedSlug = posts[0]?.slug;
      return translatedSlug ? [language, `${siteUrl}/${language}/blog/${translatedSlug}`] : null;
    }),
  );
  return Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry)));
}

async function fetchBlogPostsForLanguage(baseSlug: string, lang: string): Promise<BlogPostListItem[]> {
  const res = await fetch(
    `${INTERNAL_BACKEND_URL}/api/blog/?lang=${encodeURIComponent(lang)}&slugs=${encodeURIComponent(baseSlug)}`,
    { next: { revalidate: 3600 } },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? (json as BlogPostListItem[]) : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const lang =
    typeof resolvedParams?.lang === "string" ? resolvedParams.lang : "en";
  const slug =
    typeof resolvedParams?.slug === "string" ? resolvedParams.slug : null;
  const siteUrl = PUBLIC_SITE_URL.replace(
    /\/+$/g,
    ""
  );
  const canonical = slug
    ? `${siteUrl}/${lang}/blog/${slug}`
    : `${siteUrl}/${lang}/blog`;

  if (!slug) {
    return {
      title: "Post not found",
      description: "ListAcross EU blog post.",
      alternates: {
        canonical,
      },
      openGraph: {
        title: "Post not found",
        description: "ListAcross EU blog post.",
        type: "website",
        url: canonical,
      },
      twitter: {
        card: "summary",
        title: "Post not found",
        description: "ListAcross EU blog post.",
      },
    };
  }

  try {
    const post = await fetchBlogPostDetail(slug, lang);
    if (!post || !post.translation) {
      return {
        title: "Post not found",
        description: "ListAcross EU blog post.",
        alternates: {
          canonical,
        },
        openGraph: {
          title: "Post not found",
          description: "ListAcross EU blog post.",
          type: "website",
          url: canonical,
        },
        twitter: {
          card: "summary",
          title: "Post not found",
          description: "ListAcross EU blog post.",
        },
      };
    }

    const translation = post.translation;
    const metaTitle = translation.seo_title || translation.title;
    const bodyFallback = translation.body ? translation.body.slice(0, 155) : "";
    const metaDesc =
      translation.seo_description || translation.excerpt || bodyFallback || "ListAcross EU blog post.";

    const ogImages = post.hero_image_url ? [{ url: post.hero_image_url }] : undefined;

    const languages = await fetchBlogAlternates(post.slug, siteUrl);
    return {
      title: metaTitle,
      description: metaDesc,
      alternates: {
        canonical,
        languages,
      },
      openGraph: {
        title: metaTitle,
        description: metaDesc,
        type: "article",
        url: canonical,
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description: metaDesc,
        images: ogImages?.map((item) => item.url),
      },
    };
  } catch (error) {
    return {
      title: "Post not found",
      description: "ListAcross EU blog post.",
      alternates: {
        canonical,
      },
      openGraph: {
        title: "Post not found",
        description: "ListAcross EU blog post.",
        type: "website",
        url: canonical,
      },
      twitter: {
        card: "summary",
        title: "Post not found",
        description: "ListAcross EU blog post.",
      },
    };
  }
}

export default async function BlogPostLangPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const lang =
    typeof resolvedParams?.lang === "string" ? resolvedParams.lang : "en";
  const slug =
    typeof resolvedParams?.slug === "string" ? resolvedParams.slug : null;
  const baseUrl = PUBLIC_SITE_URL.replace(
    /\/+$/g,
    ""
  );

  if (!slug) {
    redirect(`/${lang}/blog`);
  }

  if (/^\\d+$/.test(slug)) {
    const posts = await fetchBlogPosts(lang);
    const numericId = Number(slug);
    const match = posts.find(
      (item) =>
        item.id === numericId || (item as unknown as { pk?: number }).pk === numericId
    );

    if (match?.slug) {
      redirect(`/${lang}/blog/${match.slug}`);
    }

    redirect(`/${lang}/blog`);
  }

  const post = await fetchBlogPostDetail(slug, lang);
  let resolvedPost = post;
  if (!resolvedPost) {
    redirect(`/${lang}/blog`);
  }
  const posts = await fetchBlogPosts(lang);
  const relatedPosts = posts.filter((item) => item.slug !== slug).slice(0, 3);

  const canonicalUrl = `${baseUrl}/${lang}/blog/${slug}`;
  const breadcrumbs = [
    { name: "Home", url: `${baseUrl}/${lang}/` },
    { name: "Blog", url: `${baseUrl}/${lang}/blog` },
    {
      name: resolvedPost?.translation?.title || slug,
      url: canonicalUrl,
    },
  ];

  const articleSchema = resolvedPost && resolvedPost.translation
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: resolvedPost.translation.title || slug,
        datePublished: resolvedPost.published_at || undefined,
        dateModified: resolvedPost.translation?.updated_at || undefined,
        image: resolvedPost.hero_image_url ? [resolvedPost.hero_image_url] : undefined,
        inLanguage: lang,
        mainEntityOfPage: canonicalUrl,
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Layout headerExtra={<Breadcrumbs current="Blog" />}>
      <StructuredData data={breadcrumbSchema} />
      {articleSchema && <StructuredData data={articleSchema} />}
      <BlogPostPageClient
        lang={lang}
        initialPost={resolvedPost}
        initialRelatedPosts={relatedPosts}
      />
    </Layout>
  );
}

