"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import {
  fetchBusinessesByLocation,
  fetchCountries,
  fetchCities,
  type Country,
  type City,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import BusinessCard from "@/components/BusinessCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdPlaceholder from "@/components/ads/AdPlaceholder";
import BlogPostsSlider from "@/components/blog/BlogPostsSlider";

interface CountryPageClientProps {
  countrySlug: string;
}

export default function CountryPageClient({ countrySlug }: CountryPageClientProps) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [country, setCountry] = useState<Country | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [businesses, setBusinesses] = useState<BusinessSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showAllTypes, setShowAllTypes] = useState(false);
  const listingsRef = useRef<HTMLDivElement | null>(null);
  
  const limit = 20;
  const errorMessage = t.directory.country.errorLoad;

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

        // First load countries to find the current one
        const [countriesData, businessesData, citiesData] = await Promise.all([
          fetchCountries(),
          fetchBusinessesByLocation(countrySlug, undefined, { 
            limit, 
            offset: currentPage * limit 
          }),
          fetchCities(),
        ]);

        if (cancelled) return;

        // Find the current country
        const currentCountry = countriesData.find(c => c.slug === countrySlug);
        if (!currentCountry) {
          throw new Error(`Country "${countrySlug}" not found`);
        }

        // Filter cities for this country
        const countryCities = citiesData.filter(city => 
          city.country.slug === countrySlug
        );

        setCountry(currentCountry);
        setCities(countryCities);
        setBusinesses(businessesData);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(errorMessage);
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
  }, [countrySlug, currentPage, errorMessage]);

  useEffect(() => {
    const param = searchParams.get("cat") || "";
    setSelectedCategory((prev) => (prev !== param ? param : prev));
  }, [searchParams]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (businesses && (currentPage + 1) * limit < businesses.total) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tierOrder: Record<string, number> = { premium: 0, claimed: 1, free: 2 };
  const sortedBusinesses = businesses
    ? [...businesses.results].sort(
        (a: any, b: any) =>
          (tierOrder[a.tier ?? "free"] ?? 2) - (tierOrder[b.tier ?? "free"] ?? 2)
      )
    : [];

  const categoryCounts = useMemo(() => {
    const results = businesses?.results || [];
    const map = new Map<
      string,
      { key: string; label: string; count: number }
    >();

    results.forEach((business: any) => {
      const label =
        business.category?.name ||
        business.category_name ||
        business.business_type ||
        business.type ||
        "Uncategorized";
      const key =
        (business.category?.slug || label || "Uncategorized")
          .toString()
          .trim();
      const normalizedKey = key.toLowerCase();
      const existing = map.get(normalizedKey);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(normalizedKey, {
          key,
          label,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    if (!selectedCategory) {
      return sortedBusinesses;
    }
    const normalized = selectedCategory.toLowerCase();
    return sortedBusinesses.filter((business: any) => {
      const label =
        business.category?.name ||
        business.category_name ||
        business.business_type ||
        business.type ||
        "Uncategorized";
      const key = (business.category?.slug || label || "Uncategorized")
        .toString()
        .trim()
        .toLowerCase();
      return key === normalized || label.toLowerCase() === normalized;
    });
  }, [selectedCategory, sortedBusinesses]);

  const updateCategoryParam = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("cat", value);
    } else {
      params.delete("cat");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    updateCategoryParam(value);
    listingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearCategory = () => {
    setSelectedCategory("");
    updateCategoryParam("");
    listingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div>
        {/* Hero Section Skeleton */}
        <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 bg-blue-400 rounded w-64 mx-auto mb-6"></div>
                <div className="h-6 bg-blue-300 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Breadcrumbs Skeleton */}
        <div className="bg-slate-50 border-b border-slate-200 py-3">
          <div className="mx-auto max-w-7xl px-4">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-48"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="lg:grid lg:grid-cols-4 lg:gap-8">
              <div className="lg:col-span-3">
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
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {/* Hero Section with Error */}
        <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-red-600 to-red-700">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {t.directory.country.notFoundTitle}
              </h1>
              <p className="mt-6 text-xl leading-8 text-red-100">
                {error}
              </p>
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="bg-slate-50 border-b border-slate-200 py-3">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-sm text-slate-600">
              <Breadcrumbs current={t.directory.country.notFoundTitle} />
            </div>
          </div>
        </div>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 text-center">
           <button
              onClick={() => window.history.back()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t.directory.country.goBack}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!country) return null;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {country.name}
            </h1>
            <p className="mt-6 text-xl leading-8 text-blue-100">
              {format(t.directory.country.heroSubtitle, { country: country.name })}
            </p>
            {businesses && (
              <div className="mt-4 text-blue-100">
                {businesses.total > 0 ? (
                  <span>
                    {format(t.directory.country.totalFound, {
                      count: businesses.total,
                    })}
                  </span>
                ) : (
                  <span>{t.directory.country.noneListed}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b border-slate-200 py-3">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-sm text-slate-600">
            <Breadcrumbs current={country.name} />
          </div>
        </div>
      </div>

      {/* Popular Business Types */}
      {categoryCounts.length > 0 && (
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {format(t.directory.country.popularTypesTitle, { country: country.name })}
              </h2>
              {selectedCategory && (
                <button
                  onClick={handleClearCategory}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  {t.directory.country.popularTypesClearFilter}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {(showAllTypes ? categoryCounts : categoryCounts.slice(0, 12)).map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => handleCategorySelect(category.key)}
                  className={`group text-left rounded-lg bg-white border p-3 transition-all duration-200 hover:border-blue-300 hover:shadow-sm ${
                    selectedCategory.toLowerCase() === category.key.toLowerCase()
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                    {category.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(t.directory.country.businessesLabel, {
                      count: category.count,
                    })}
                  </div>
                </button>
              ))}
            </div>
            {categoryCounts.length > 12 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowAllTypes((prev) => !prev)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {showAllTypes
                    ? t.directory.country.popularTypesViewLess
                    : t.directory.country.popularTypesViewAll}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Inline Ad */}
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4">
          <AdPlaceholder variant="inline" />
        </div>
      </div>

      {/* Main Content */}
      <section className="py-16" ref={listingsRef}>
        <div className="mx-auto max-w-7xl px-4">
          {businesses && filteredBusinesses.length > 0 ? (
            <>
              <div className="mb-6 text-sm text-slate-600">
                {format(t.directory.country.resultsSummary, {
                  start: currentPage * limit + 1,
                  end: Math.min((currentPage + 1) * limit, businesses.total),
                  total: businesses.total,
                })}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {filteredBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className={business.tier === "premium" ? "col-span-2" : ""}
                  >
                    <BusinessCard business={business as any} lang={lang} />
                  </div>
                ))}
              </div>

              {!selectedCategory && (
                <div className="mt-6 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                  <div className="text-sm text-slate-600">
                    {format(t.directory.country.pageLabel, {
                      page: currentPage + 1,
                      total: Math.max(1, Math.ceil(businesses.total / limit)),
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                    >
                      {t.directory.country.previous}
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={(currentPage + 1) * limit >= businesses.total}
                      className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                    >
                      {t.directory.country.next}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow-sm">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                {t.directory.country.noBusinessesTitle}
              </h3>
              <p className="mt-2 text-slate-600">
                {t.directory.country.noBusinessesBody}
              </p>
            </div>
          )}
        </div>
      </section>

      <BlogPostsSlider
        lang={lang}
        countrySlug={country.slug}
        countryName={country.name}
      />
    </div>
  );
}
