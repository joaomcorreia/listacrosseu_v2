"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import { fetchBlogPosts, type BlogPostListItem } from "@/lib/api";
import { debugWarn } from "@/lib/debug";

export default function BlogCarousel({ settings: _settings }: { settings?: Record<string, unknown> } = {}) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchBlogPosts({ lang });
        if (!cancelled) {
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        debugWarn("Failed to load blog posts for carousel.", error);
        if (!cancelled) setPosts([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    const maxSlides = Math.max(0, posts.length - 2);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (maxSlides || 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [posts.length]);

  const maxSlides = Math.max(0, posts.length - 2);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % (maxSlides || 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + (maxSlides || 1)) % (maxSlides || 1));
  };

  const goToSlide = (index: number) => {
    const slideLimit = Math.max(0, posts.length - 2);
    setCurrentSlide(Math.min(index, slideLimit - 1));
  };

  const formatPublishedDate = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  };

  if (posts.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {t.blog.carousel.title}
              </h2>
              <p className="text-lg text-slate-600">
                {t.blog.carousel.subtitle}
              </p>
            </div>
            <a
              href={`/${lang}/blog`}
              className="hidden md:inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t.blog.carousel.viewAll}
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {t.blog.carousel.title}
            </h2>
            <p className="text-lg text-slate-600">
              {t.blog.carousel.subtitle}
            </p>
          </div>
          <a
            href={`/${lang}/blog`}
            className="hidden md:inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t.blog.carousel.viewAll}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * (100 / 3)}%)` }}
            >
              {posts.map((post) => (
                <div key={post.id} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-3">
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full">
                    {post.hero_image_url ? (
                      <div className="overflow-hidden border-b border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.hero_image_url}
                          alt={post.title}
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-xl font-semibold text-slate-700 shadow-lg mx-auto">
                          LA
                        </div>
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">
                          {formatPublishedDate(post.published_at)}
                        </span>
                      </div>

                      <h3
                        className="text-xl font-bold text-slate-900 leading-tight"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.title}
                      </h3>

                      <p
                        className="text-sm text-slate-600 leading-relaxed"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4">
                        <a
                          href={`/${lang}/blog/${post.slug}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          {t.blog.carousel.readMore}
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </a>
                        <button className="text-slate-400 hover:text-slate-600 p-1" aria-label={t.blog.carousel.readMore}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
          </button>

          <div className="flex justify-center space-x-2 mt-8">
            {Array.from({ length: Math.max(1, posts.length - 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "bg-blue-600 w-8"
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-8 md:hidden">
          <a
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t.blog.carousel.viewAll}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

