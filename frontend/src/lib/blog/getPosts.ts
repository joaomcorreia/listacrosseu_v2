import { fetchBlogPosts, type BlogPostListItem } from "@/lib/api";

export type BlogPostItem = {
  id: number;
  title: string;
  excerpt: string;
  slug: string;
  coverImage?: string;
  countrySlugs?: string[];
  tags?: string[];
  publishedAt?: string | null;
};

export async function getPosts(lang: string): Promise<BlogPostItem[]> {
  try {
    const posts = await fetchBlogPosts({ lang });
    return (posts || []).map((post: BlogPostListItem) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      coverImage: post.hero_image_url || undefined,
      tags: ["eu"],
      countrySlugs: undefined,
      publishedAt: post.published_at,
    }));
  } catch (error) {
    console.error("Failed to load blog posts for slider.", error);
    return [];
  }
}
