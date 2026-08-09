"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { translations, useTranslations } from "@/i18n/translations";
import {
  fetchCategories,
  fetchBusinesses,
  type Category,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import BusinessCard from "@/components/BusinessCard";
import InfoBoxes from "@/components/InfoBoxes";
import { getInfoBoxes } from "@/content/infoboxes";
import BlogPostsSlider from "@/components/blog/BlogPostsSlider";
import DirectoryViewToggle, { type DirectoryView } from "@/components/DirectoryViewToggle";
import DirectoryBusinessList from "@/components/DirectoryBusinessList";

interface CategoryDetailClientProps {
  categorySlug: string;
  lang: string;
}

export default function CategoryDetailClient({ categorySlug, lang }: CategoryDetailClientProps) {
  const t = useTranslations(lang);
  const directory = t.directory ?? translations.en.directory;
  const categoriesText = directory.categories ?? translations.en.directory.categories;
  const [category, setCategory] = useState<Category | null>(null);
  const [businesses, setBusinesses] = useState<BusinessSearchResult | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [view, setView] = useState<DirectoryView>("grid");

  const limit = 24;
  const format = (template: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
      template,
    );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Load categories and businesses in parallel
        const [categoriesData, businessesData] = await Promise.all([
          fetchCategories(),
          fetchBusinesses({ 
            category: categorySlug, 
            limit: limit,
            offset: page * limit 
          }),
        ]);

        if (cancelled) return;

        // Find the current category
        const currentCategory = categoriesData.find(cat => cat.slug === categorySlug);
        setCategory(currentCategory || null);
        setAllCategories(categoriesData);
        
        if (page === 0) {
          setBusinesses(businessesData);
        } else {
          // Append for pagination
          setBusinesses(prev => prev ? {
            ...businessesData,
            results: [...prev.results, ...businessesData.results]
          } : businessesData);
        }

        setHasMore(businessesData.results.length === limit);
        
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(categoriesText.errorLoad);
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
  }, [categorySlug, page, lang]);

  useEffect(() => {
    const saved = window.localStorage.getItem("listacrosseu-directory-view");
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  const changeView = (nextView: DirectoryView) => {
    setView(nextView);
    window.localStorage.setItem("listacrosseu-directory-view", nextView);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const tierOrder: Record<string, number> = { premium: 0, claimed: 1, free: 2 };
  const sortedBusinesses = businesses
    ? [...businesses.results].sort(
        (a: any, b: any) =>
          (tierOrder[a.tier ?? "free"] ?? 2) - (tierOrder[b.tier ?? "free"] ?? 2)
      )
    : [];
  const infoBoxes = getInfoBoxes(lang, categorySlug);

  if (loading && page === 0) {
    return (
      <div>
        {/* Hero Section Skeleton */}
        <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 bg-purple-300 rounded w-64 mx-auto mb-6"></div>
                <div className="h-6 bg-purple-300 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Skeleton */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow-sm">
                  <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-64 mb-3"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-red-600 to-red-700">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {categoriesText.errorTitle}
              </h1>
              <p className="mt-6 text-xl leading-8 text-red-100">
                {error}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!category) {
    return (
      <div>
        <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-slate-600 to-slate-700">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {categoriesText.notFoundTitle}
              </h1>
              <p className="mt-6 text-xl leading-8 text-slate-100">
                {format(categoriesText.notFoundBody, { category: categorySlug })}
              </p>
              <div className="mt-8">
                <Link
                  href={`/${lang}/categories`}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {categoriesText.backToCategories}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-6 text-xl leading-8 text-purple-100">
              {businesses?.total ? 
                format(categoriesText.heroCount, {
                  count: businesses.total.toLocaleString(),
                  category: category.name,
                }) :
                format(categoriesText.heroTitle, { category: category.name })
              }
            </p>
            <div className="mt-8">
              <Link
                href={`/${lang}/categories`}
                className="inline-flex items-center gap-2 rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 transition-colors"
              >
                {categoriesText.allCategories}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Main content area */}
            <div className="lg:col-span-3">
              {infoBoxes && (
                <div className="mb-10">
                  <InfoBoxes
                    title={`About ${category.name} in the EU`}
                    subtitle={infoBoxes.subtitle}
                    items={infoBoxes.items}
                  />
                </div>
              )}
              {businesses && businesses.results.length > 0 ? (
                <div>
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {format(categoriesText.resultsTitle, { category: category.name })}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-600">
                        {format(categoriesText.totalLabel, { count: businesses.total.toLocaleString() })}
                      </span>
                      <DirectoryViewToggle value={view} onChange={changeView} />
                    </div>
                  </div>

                  {view === "grid" ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {sortedBusinesses.map((business) => (
                        <BusinessCard key={business.id} business={business as any} lang={lang} />
                      ))}
                    </div>
                  ) : (
                    <DirectoryBusinessList businesses={sortedBusinesses as any} lang={lang} />
                  )}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="mt-12 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? categoriesText.loading : categoriesText.loadMore}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-white p-12 text-center shadow-sm">
                  <div className="text-slate-400">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    {categoriesText.noBusinessesTitle}
                  </h3>
                  <p className="mt-2 text-slate-600">
                    {categoriesText.noBusinessesBody}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 mt-12 lg:mt-0">
              <div className="sticky top-8 space-y-6">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">
                    {categoriesText.otherCategories}
                  </h3>
                  <div className="space-y-2">
                    {allCategories
                      .filter(cat => cat.slug !== categorySlug)
                      .slice(0, 6)
                      .map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/${lang}/categories/${cat.slug}`}
                        className="block text-sm text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        {cat.name}
                        {cat.business_count && (
                          <span className="text-slate-500 ml-1">
                            ({cat.business_count})
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                  {allCategories.length > 7 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        href={`/${lang}/categories`}
                        className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        {categoriesText.viewAllCategories}
                      </Link>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">
                    {categoriesText.searchBusinessesTitle}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    {categoriesText.searchBusinessesBody}
                  </p>
                  <Link
                    href={`/${lang}/search?category=${categorySlug}`}
                    className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors w-full justify-center"
                  >
                    {categoriesText.advancedSearch}
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BlogPostsSlider lang={lang} mode="eu" />
    </div>
  );
}
