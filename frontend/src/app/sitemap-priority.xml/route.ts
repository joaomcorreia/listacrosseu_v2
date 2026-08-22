import { NextResponse } from "next/server";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { PUBLIC_SITE_URL } from "@/lib/env.public";

const STATIC_PATHS = [
  "/en/",
  "/en/list-your-business-free",
  "/en/generated-business-website",
  "/en/pricing",
  "/en/how-it-works",
  "/en/get-found-online",
  "/en/free-business-listing-belgium",
  "/en/get-your-business-online-free",
  "/en/get-your-small-business-online-fast",
  "/en/promote-your-business-for-free",
  "/en/advertise-your-business-online-free",
  "/en/free-online-presence-for-small-business",
  "/en/create-a-business-page-free",
  "/en/put-your-business-online",
  "/en/free-business-listing-antwerp",
  "/en/free-business-listing-anderlecht",
  "/en/free-business-listing-brussels",
  "/en/free-business-listing-ghent",
  "/en/free-business-listing-liege",
  "/en/free-business-listing-charleroi",
  "/en/countries/be",
  "/en/cities/antwerp",
  "/en/cities/anderlecht",
];

const PREFERRED_BLOG_SLUGS = [
  "how-to-list-your-business-online-for-free-in-europe",
  "10-ways-to-make-your-small-business-easier-to-find-online",
  "how-a-generated-website-can-help-a-new-business-get-started",
];

type BlogPost = {
  slug?: string;
  status?: string;
  published_at?: string | null;
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character] || character);
}

async function getPriorityBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/blog/?lang=en`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const posts = (await response.json()) as BlogPost[];
    const published = posts.filter((post) => post.status === "published" && post.slug);
    const preferred = PREFERRED_BLOG_SLUGS
      .map((slug) => published.find((post) => post.slug === slug))
      .filter((post): post is BlogPost => Boolean(post));
    return (preferred.length === 3 ? preferred : published.slice(0, 3));
  } catch {
    return [];
  }
}

export async function GET() {
  const posts = await getPriorityBlogPosts();
  const paths = [
    ...STATIC_PATHS,
    ...posts.map((post) => `/en/blog/${post.slug}`),
  ];
  const uniquePaths = [...new Set(paths)];
  const lastmod = new Date().toISOString();
  const urls = uniquePaths.map((path) => `  <url><loc>${escapeXml(`${PUBLIC_SITE_URL}${path}`)}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
