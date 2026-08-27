"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import DirectorySidebarLayout from "@/components/DirectorySidebarLayout";
import Sidebar from "@/components/Sidebar";
import { useDirectoryPageEditor } from "@/components/DirectoryPageEditor";
import { getBusinessCanonicalPath } from "@/lib/businessUrls";

interface CountryPageClientProps {
  countrySlug: string;
}

function VerifiedBusinessCard({ business, lang }: { business: BusinessSearchResult['results'][number]; lang: string }) {
  const category = business.category?.name || 'Business';
  const location = [business.city?.name, business.country?.name].filter(Boolean).join(', ');
  const website = business.website ? (/^https?:\/\//i.test(business.website) ? business.website : `https://${business.website}`) : '';

  return <article className="flex h-full flex-col rounded-2xl border border-emerald-200 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6"><div className="flex items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-xl font-black text-emerald-700">{business.logo_url ? <img src={business.logo_url} alt={`${business.name} logo`} className="h-full w-full object-contain" /> : business.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black text-slate-900">{business.name}</h3><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Verified</span></div><p className="mt-1 text-sm font-semibold text-slate-600">{category}</p><p className="mt-1 text-sm text-slate-500">{location}</p></div></div>{business.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{business.description}</p>}<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">{business.phone && <span>{business.phone}</span>}{website && <a href={website} target="_blank" rel="noreferrer" className="truncate text-blue-700 hover:underline">{business.website}</a>}</div><Link href={getBusinessCanonicalPath(business, lang)} className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">View listing</Link></article>;
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
  const [verifiedBusinesses, setVerifiedBusinesses] = useState<BusinessSearchResult['results']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showAllTypes, setShowAllTypes] = useState(false);
  const listingsRef = useRef<HTMLDivElement | null>(null);
  const directoryEditor = useDirectoryPageEditor({
    scope: "country",
    slug: countrySlug,
    defaults: {
      hero_image: "",
      title: countrySlug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      subtitle: "Explore local businesses and services across Europe.",
      intro: "",
      cta_label: "",
      cta_href: "",
    },
  });
  const { content, editable, editMode, toolbar } = directoryEditor;
  
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
        const [countriesData, businessesData, claimedData, citiesData] = await Promise.all([
          fetchCountries(),
          fetchBusinessesByLocation(countrySlug, undefined, { 
            tier: 'free',
            limit, 
            offset: currentPage * limit 
          }),
          fetchBusinessesByLocation(countrySlug, undefined, { tier: 'claimed', limit: 50 }),
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
        setVerifiedBusinesses(claimedData.results.filter((business) => business.tier === 'claimed' && business.claimed_listing_published !== false));
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
    const results = [...(businesses?.results || []), ...verifiedBusinesses];
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
  }, [businesses, verifiedBusinesses]);

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
      <section
        className="relative isolate -mt-16 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 bg-cover bg-center"
        style={content.hero_image ? { backgroundImage: `linear-gradient(90deg, rgba(7, 28, 86, 0.88), rgba(12, 66, 154, 0.68)), url(${content.hero_image})` } : undefined}
      >
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="text-center text-white">
            {editable("title", content.title || country.name, "text-4xl font-bold tracking-tight sm:text-5xl", "h1")}
            <div className="mt-6 text-xl leading-8 text-blue-100">
            {editable("subtitle", content.subtitle || format(t.directory.country.heroSubtitle, { country: country.name }), "text-xl leading-8 text-blue-100", "p", true)}
            {content.cta_label && (editMode ? (
              <div className="mt-7 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-800">
                {editable("cta_label", content.cta_label, "", "span")}
              </div>
            ) : (
              <a href={content.cta_href || `/${lang}/list-your-business`} className="mt-7 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50">
                {content.cta_label}
              </a>
            ))}
            </div>
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

      <DirectorySidebarLayout sidebar={<Sidebar content="ads" context={{ countrySlug }} />}>
        {content.intro && (
          <section className="pt-8">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {editable("intro", content.intro, "text-base leading-7 text-slate-700", "p", true)}
            </div>
          </section>
        )}
        {/* Popular Business Types */}
        {categoryCounts.length > 0 && (
          <section className="py-8">
            <div className="w-full">
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

        {verifiedBusinesses.length > 0 && (
          <section className="py-8" aria-labelledby="verified-businesses-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Claimed listings</p>
                <h2 id="verified-businesses-heading" className="mt-1 text-2xl font-semibold text-gray-900">Verified businesses in {country.name}</h2>
              </div>
              <span className="text-sm text-slate-500">{verifiedBusinesses.length} verified {verifiedBusinesses.length === 1 ? 'business' : 'businesses'}</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {verifiedBusinesses.map((business) => <VerifiedBusinessCard key={business.id} business={business} lang={lang} />)}
            </div>
          </section>
        )}

        {/* Inline Ad */}
        <div className="py-8">
          <div className="w-full">
            <AdPlaceholder variant="inline" />
          </div>
        </div>

        {/* Main Content */}
        <section className="py-8" ref={listingsRef}>
          <div className="w-full">
          {businesses && filteredBusinesses.length > 0 ? (
            <>
              <div className="mb-6 text-sm text-slate-600">
                {format(t.directory.country.resultsSummary, {
                  start: currentPage * limit + 1,
                  end: Math.min((currentPage + 1) * limit, businesses.total),
                  total: businesses.total,
                })}
              </div>

              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
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
      </DirectorySidebarLayout>

      <BlogPostsSlider
        lang={lang}
        countrySlug={country.slug}
        countryName={country.name}
      />
      {toolbar}
    </div>
  );
}
