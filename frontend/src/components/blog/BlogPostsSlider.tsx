"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/i18n/translations";
import { getPosts, type BlogPostItem } from "@/lib/blog/getPosts";

type BlogPostsSliderProps = {
  lang: string;
  countrySlug?: string;
  countryName?: string;
  mode?: "country" | "eu";
  offset?: number;
};

export default function BlogPostsSlider({
  lang,
  countrySlug,
  countryName,
  mode,
  offset = 0,
}: BlogPostsSliderProps) {
  const t = useTranslations(lang);
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const resolvedMode = mode || (countrySlug ? "country" : "eu");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getPosts(lang);
      if (!cancelled) {
        setPosts(data);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const filteredPosts = useMemo(() => {
    if (resolvedMode === "country" && countrySlug) {
      return posts.filter((post) =>
        (post.countrySlugs || []).includes(countrySlug)
      );
    }

    return posts.filter((post) => {
      const tags = post.tags || [];
      const countries = post.countrySlugs;
      return tags.includes("eu") || !countries || countries.length === 0;
    });
  }, [countrySlug, posts, resolvedMode]);

  const visiblePosts = filteredPosts.slice(offset, offset + 12);

  const title =
    resolvedMode === "country" && countryName
      ? t.blog.slider.titleCountry.replace("{country}", countryName)
      : t.blog.slider.titleEu;

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollBy = container.offsetWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollBy : scrollBy,
      behavior: "smooth",
    });
  };

  if (visiblePosts.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <Link
            href={`/${lang}/blog`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            {t.blog.slider.viewAll}
          </Link>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md md:inline-flex"
            aria-label={t.blog.slider.prev}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-4"
          >
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className="min-w-[240px] max-w-[240px] flex-shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-36 w-full rounded-t-xl object-cover"
                  />
                ) : (
                  <div className="h-36 rounded-t-xl bg-gradient-to-br from-slate-50 to-blue-50" />
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/${lang}/blog/${post.slug}`}
                    className="mt-4 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {t.blog.slider.readMore}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md md:inline-flex"
            aria-label={t.blog.slider.next}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
