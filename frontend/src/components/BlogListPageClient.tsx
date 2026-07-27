"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import {
  fetchBlogPosts,
  fetchBlogCategories,
  type BlogPostListItem,
  type BlogCategory,
} from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";

const PAGE_SIZE = 12;

export default function BlogListPageClient({
  initialPosts = [],
  initialCategories = [],
  initialTotal = 0,
  lang: langProp,
}: {
  initialPosts?: BlogPostListItem[];
  initialCategories?: BlogCategory[];
  initialTotal?: number;
  lang?: string;
}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = langProp || normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);

  const searchQuery = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const offsetParam = parseInt(searchParams.get("offset") || "0", 10);
  const offset = isNaN(offsetParam) ? 0 : Math.max(0, offsetParam);

  const [posts, setPosts] = useState<BlogPostListItem[]>(initialPosts);
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories);
  const [total, setTotal] = useState(initialTotal || initialPosts.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldUseInitial =
    !searchQuery && !categorySlug && offset === 0 && initialPosts.length > 0;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (shouldUseInitial) {
        setPosts(initialPosts);
        setCategories(initialCategories);
        setTotal(initialTotal || initialPosts.length);
        return;
      }

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

        const startIndex = offset;
        const endIndex = offset + PAGE_SIZE;
        const paginatedPosts = allPosts.slice(startIndex, endIndex);

        setCategories(catData);
        setPosts(Array.isArray(paginatedPosts) ? paginatedPosts : []);
        setTotal(Array.isArray(allPosts) ? allPosts.length : 0);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(t.blog.list.error);
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
  }, [
    lang,
    searchQuery,
    categorySlug,
    offset,
    shouldUseInitial,
    initialPosts,
    initialCategories,
    initialTotal,
  ]);

  function updateSearchParams(next: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === "") sp.delete(key);
      else sp.set(key, value);
    });
    router.push(`/${lang}/blog?${sp.toString()}`);
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

  function getCategoryLabel(cat: BlogCategory): string {
    const item =
      cat.translations.find((tr) => tr.language === lang) ||
      cat.translations.find((tr) => tr.language === "en");
    return item?.name || cat.key;
  }

  function formatPublishedDate(dateValue: string): string {
    const d = new Date(dateValue);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  }

  return (
    <div className="bg-slate-50">
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Breadcrumbs
            items={[
              { label: t.nav.home, href: `/${lang}` },
              { label: t.nav.blog },
            ]}
            variant="dark"
          />
          <h1 className="mt-4 text-2xl font-semibold">{t.blog.list.title}</h1>
          <p className="mt-1 text-sm text-blue-100">{t.blog.list.subtitle}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <form
              onSubmit={handleSearchSubmit}
              className="grid gap-3 md:grid-cols-4"
            >
              <div className="md:col-span-2">
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder={t.blog.list.searchPlaceholder}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <select
                  value={categorySlug}
                  onChange={handleCategoryChange}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">{t.blog.list.allCategories}</option>
                  {(categories || []).map((cat) => (
                    <option key={cat.id} value={cat.translations[0]?.slug}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t.blog.list.searchButton}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && posts.length === 0 && (
            <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
              {t.blog.list.loading}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(posts || []).map((post) => {
              const href = `/${lang}/blog/${encodeURIComponent(post.slug)}`;

              return (
                <article
                  key={post.id}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {post.hero_image_url && (
                    <div className="overflow-hidden rounded-t-xl border-b border-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.hero_image_url}
                        alt={post.title}
                        className="h-44 w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-base font-semibold text-slate-900">
                      <Link href={href} className="hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                    {post.published_at && (
                      <div className="mt-1 text-xs text-slate-500">
                        {formatPublishedDate(post.published_at)}
                      </div>
                    )}
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-slate-700 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-3">
                      <Link
                        href={href}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {t.blog.list.readMore}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && posts.length === 0 && !error && (
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              {t.blog.list.empty}
            </div>
          )}

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
              {t.blog.list.previous}
            </button>
            <div>
              {t.blog.list.page} {Math.floor(offset / PAGE_SIZE) + 1}{" "}
              {t.blog.list.of}{" "}
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
              {t.blog.list.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
