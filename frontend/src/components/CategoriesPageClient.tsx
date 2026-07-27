"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import {
  fetchCategories,
  fetchBusinesses,
  type Category,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import BusinessCard from "@/components/BusinessCard";
import { useTranslations } from "@/i18n/translations";

export default function CategoriesPageClient() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);

  const [categories, setCategories] = useState<Category[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<BusinessSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [categoriesData, businessesData] = await Promise.all([
          fetchCategories(),
          fetchBusinesses({ limit: 12 }),
        ]);

        if (cancelled) return;

        setCategories(categoriesData);
        setRecentBusinesses(businessesData);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(t.messages.categoriesPage.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [lang, t]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.messages.categoriesPage.browseTitle}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.messages.categoriesPage.recentListingsTitle}
          </h2>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-64 mb-3"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <div className="text-red-400">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-red-900">
          {t.errors.title}
        </h3>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {t.buttons.tryAgain}
        </button>
      </div>
    );
  }

  const tierOrder: Record<string, number> = { premium: 0, claimed: 1, free: 2 };
  const sortedRecentBusinesses = recentBusinesses
    ? [...recentBusinesses.results].sort(
        (a: any, b: any) =>
          (tierOrder[a.tier ?? "free"] ?? 2) - (tierOrder[b.tier ?? "free"] ?? 2)
      )
    : [];

  return (
    <div className="space-y-12">
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs bg-yellow-50 border border-yellow-200 p-2 rounded">
          <strong>{t.messages.categoriesPage.debugLabel}:</strong>{" "}
          {t.messages.categoriesPage.debugSummary
            .replace("{categories}", String(categories.length))
            .replace(
              "{recent}",
              String(recentBusinesses?.results?.length || 0)
            )
            .replace("{total}", String(recentBusinesses?.total || 0))}
        </div>
      )}

      {categories.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.messages.categoriesPage.categoriesTitle}
          </h2>
          <p className="text-slate-600 mb-6">
            {t.messages.categoriesPage.categoriesSubtitle}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${lang}/categories/${category.slug}`}
                className="group rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 group-hover:text-purple-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {category.business_count
                        ? t.messages.categoriesPage.businessCount.replace(
                            "{count}",
                            category.business_count.toLocaleString()
                          )
                        : t.messages.categoriesPage.browseListings}
                    </p>
                  </div>
                  <div className="text-slate-400 group-hover:text-purple-600 transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentBusinesses && recentBusinesses.results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {t.messages.categoriesPage.recentListingsTitle}
              </h2>
              <p className="text-slate-600">
                {t.messages.categoriesPage.recentListingsSubtitle}
              </p>
            </div>
            <Link
              href={`/${lang}/search`}
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
            >
              {t.buttons.viewAll}
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {sortedRecentBusinesses.map((business) => (
              <div
                key={business.id}
                className={business.tier === "premium" ? "col-span-2" : ""}
              >
                <BusinessCard business={business as any} lang={lang} />
              </div>
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 && !loading && (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
          <div className="text-slate-400">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {t.messages.categoriesPage.emptyTitle}
          </h3>
          <p className="mt-2 text-slate-600">
            {t.messages.categoriesPage.emptyBody}
          </p>
        </div>
      )}
    </div>
  );
}
