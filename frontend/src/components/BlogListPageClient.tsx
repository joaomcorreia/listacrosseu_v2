"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import {
  fetchBlogPosts,
  fetchBlogCategories,
  type BlogPostListItem,
  type BlogCategory,
} from "@/lib/api";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const PAGE_SIZE = 10;

export default function BlogListPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const lang = normalizeLang(String(params?.lang || "en"));
  const searchQuery = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
  const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [catData, allPosts] = await Promise.all([
          fetchBlogCategories(lang),
          fetchBlogPosts({
            lang,
            category: categorySlug || undefined,
            search: searchQuery || undefined,
          }),
        ]);

        if (cancelled) return;

        // Frontend pagination since backend returns all posts
        const startIndex = offset;
        const endIndex = offset + PAGE_SIZE;
        const paginatedPosts = allPosts.slice(startIndex, endIndex);

        setCategories(catData);
        setPosts(Array.isArray(paginatedPosts) ? paginatedPosts : []);
        setTotal(Array.isArray(allPosts) ? allPosts.length : 0);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load blog posts");
          // Ensure posts is always an array even on error
          setPosts([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang, searchQuery, categorySlug, offset]);

  function updateSearchParams(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === "") sp.delete(key);
      else sp.set(key, value);
    });
    router.push(`/blog?${sp.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const q = String(formData.get("q") || "");
    updateSearchParams({ q, offset: "0" });
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    updateSearchParams({ category: value || undefined, offset: "0" });
  }

  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  function goPage(newOffset: number) {
    updateSearchParams({ offset: String(Math.max(0, newOffset)) });
  }

  // Helper: get category label for current language
  function getCategoryLabel(cat: BlogCategory): string {
    const t =
      cat.translations.find((tr) => tr.language === lang) ||
      cat.translations.find((tr) => tr.language === "en");
    return t?.name || cat.key;
  }

  return (
    <div className="bg-slate-50">
      {/* Full-width hero band */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-[#0a3cff] to-[#0041b8] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-semibold">
            Blog & updates
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            Guides and stories for small & micro businesses across Europe.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        {/* Main content */}
        <div className="flex-1 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <form
              onSubmit={handleSearchSubmit}
              className="mt-4 flex flex-wrap items-center gap-3"
            >
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Search articles..."
                className="w-full flex-1 min-w-[180px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={categorySlug}
                onChange={handleCategoryChange}
                className="min-w-[160px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All categories</option>
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={cat.translations[0]?.slug}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </form>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {loading && posts.length === 0 && (
              <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Loading articles…
              </div>
            )}

            {(posts || []).map((post) => {
              const href = `/${lang}/blog/${encodeURIComponent(post.slug)}`;

              return (
                <article
                  key={post.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-slate-900">
                        <Link href={href} className="hover:underline">
                          {post.title}
                        </Link>
                      </h2>
                      {post.published_at && (
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(post.published_at).toLocaleDateString()}
                        </div>
                      )}
                      {post.excerpt && (
                        <p className="mt-2 text-sm text-slate-700">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    {post.hero_image_url && (
                      <div className="w-full md:w-40 shrink-0 overflow-hidden rounded-lg border border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.hero_image_url}
                          alt={post.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {!loading && posts.length === 0 && !error && (
              <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No articles found. Try a different search or category.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              disabled={!canPrev || loading}
              onClick={() => goPage(offset - PAGE_SIZE)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                canPrev && !loading
                  ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              Previous
            </button>
            <div>
              Page {Math.floor(offset / PAGE_SIZE) + 1} of{" "}
              {total === 0 ? 1 : Math.ceil(total / PAGE_SIZE)}
            </div>
            <button
              type="button"
              disabled={!canNext || loading}
              onClick={() => goPage(offset + PAGE_SIZE)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                canNext && !loading
                  ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="w-full shrink-0 md:w-64">
          <Sidebar slot="blog_sidebar" />
        </div>
      </div>
    </div>
  );
}