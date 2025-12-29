"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { fetchBlogPost, type BlogPostDetail } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function BlogPostPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = String(params?.slug || "");
  const lang = (searchParams.get("lang") || "en").toLowerCase();

  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBlogPost({ slug, lang });
        if (!cancelled) setPost(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load article");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  if (loading && !post) {
    return (
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Loading article…
          </div>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const t = post.translation;
  const published =
    post.published_at && new Date(post.published_at).toLocaleDateString();

  return (
    <div className="bg-slate-50">
      {/* Full-width hero band */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-[#0a3cff] to-[#0041b8] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-xs uppercase tracking-[0.25em] text-blue-100">
            Blog
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        {/* Main content */}
        <article className="flex-1">
          <header className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {t.title}
            </h1>
            {published && (
              <div className="mt-1 text-xs text-slate-500">
                Published on {published}
              </div>
            )}
            {post.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.categories.map((cat) => {
                  const tr =
                    cat.translations.find((c) => c.language === lang) ||
                    cat.translations.find((c) => c.language === "en");
                  const name = tr?.name || cat.key;
                  return (
                    <span
                      key={cat.id}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
            {post.hero_image_url && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.hero_image_url}
                  alt={t.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}
          </header>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            {/* For now, we render body as plain text; later we can support markdown. */}
            <div className="prose prose-sm max-w-none text-slate-800">
              {(t.body || '').split("\n\n").map((para, idx) => (
                <p key={idx} className="mb-3">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <div className="w-full shrink-0 md:w-64">
          <Sidebar slot="blog_sidebar" />
        </div>
      </div>
    </div>
  );
}