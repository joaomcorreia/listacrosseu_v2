"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import {
  fetchBlogPost,
  type BlogPostDetail,
  type BlogPostListItem,
} from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import { debugWarn } from "@/lib/debug";

export default function BlogPostPageClient({
  initialPost,
  initialRelatedPosts = [],
  lang: langProp,
}: {
  initialPost?: BlogPostDetail | null;
  initialRelatedPosts?: BlogPostListItem[];
  lang?: string;
}) {
  const params = useParams();

  const slug = String(params?.slug || "");
  const lang = langProp || normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);

  const [post, setPost] = useState<BlogPostDetail | null>(
    initialPost ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post?.id || !slug) return;
    try {
      window.sessionStorage.setItem("blogPostId", String(post.id));
      window.sessionStorage.setItem(
        `blogPostId:${lang}:${slug}`,
        String(post.id)
      );
    } catch (storageError) {
      debugWarn("Unable to store blog post id for language switch.", storageError);
    }
  }, [post?.id, slug, lang]);

  useEffect(() => {
    if (!slug || initialPost) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBlogPost({ slug, lang });
        if (!cancelled) {
          if (!data) {
            setPost(null);
            setError("Post not found.");
          } else {
            setPost(data);
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(t.blog.post.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, lang, initialPost, t.blog.post.error]);

  const relatedPosts = useMemo(() => {
    return (initialRelatedPosts || []).filter((item) => item.slug !== slug);
  }, [initialRelatedPosts, slug]);

  if (loading && !post) {
    return (
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            {t.blog.post.loading}
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
            <div className="mt-2">
              <Link
                href={`/${lang}/blog`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {t.blog.list.title}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Post not found.
            <div className="mt-2">
              <Link
                href={`/${lang}/blog`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {t.blog.list.title}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const translation = post.translation;
  const published = (() => {
    if (!post.published_at) return "";
    const d = new Date(post.published_at);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  })();
  const baseUrl = "https://listacross.eu";
  const shareUrl = `${baseUrl}/${lang}/blog/${encodeURIComponent(slug)}`;
  const shareTitle = encodeURIComponent(translation.title || "");

  const shareLinks = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl,
      )}&text=${shareTitle}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl,
      )}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl,
      )}`,
    },
  ];

  return (
    <div className="bg-slate-50">
      {/* Full-width hero band */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-[#0a3cff] to-[#0041b8] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Breadcrumbs
            items={[
              { label: t.nav.home, href: `/${lang}` },
              { label: t.nav.blog },
            ]}
            variant="dark"
          />
          <div className="mt-3 text-xs uppercase tracking-[0.25em] text-blue-100">
            {t.blog.post.blogLabel}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <article>
          <header className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {translation.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {published && <span>{published}</span>}
              <span>
                {t.blog.post.by} ListAcross EU
              </span>
            </div>
            {post.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.categories.map((cat) => {
                  const tr =
                    cat.translations.find((item) => item.language === lang) ||
                    cat.translations.find((item) => item.language === "en");
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
                  alt={translation.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}
          </header>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            {/* For now, we render body as plain text; later we can support markdown. */}
            <div className="prose prose-sm max-w-none text-slate-800">
              {(translation.body || "").split("\n\n").map((para, idx) => (
                <p key={idx} className="mb-3">
                  {para}
                </p>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t.blog.post.share}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {shareLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">
              {t.blog.post.related}
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.slice(0, 3).map((item) => {
                const href = `/${lang}/blog/${encodeURIComponent(item.slug)}`;

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {item.hero_image_url && (
                      <div className="overflow-hidden rounded-t-xl border-b border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.hero_image_url}
                          alt={item.title}
                          className="h-36 w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-slate-900">
                        <Link href={href} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      {item.excerpt && (
                        <p className="mt-2 text-sm text-slate-700 line-clamp-3">
                          {item.excerpt}
                        </p>
                      )}
                      <div className="mt-3">
                        <Link
                          href={href}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {t.blog.post.readMore}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
