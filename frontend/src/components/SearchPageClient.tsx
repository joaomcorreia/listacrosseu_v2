"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import {
  fetchBusinesses,
  fetchCountries,
  fetchCountriesWithStats,
  fetchCategories,
  fetchCategoriesByLocation,
  fetchBusinessesByLocation,
  fetchCities,
  type Business,
  type Country,
  type City,
  type Category,
  type CountryWithStats,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import {
  fetchUiText,
  type UiTextResponse,
} from "@/lib/api";
import SnowBackground from "@/components/SnowBackground";
import BusinessCard from "@/components/BusinessCard";
import DirectoryViewToggle, { type DirectoryView } from "@/components/DirectoryViewToggle";
import DirectoryBusinessList from "@/components/DirectoryBusinessList";
import { detectVisitorCountry } from "@/lib/visitor-country";
import { sanitizeSearchValue } from "@/lib/searchValues";

type Option = { label: string; value: string };

const locationLabels: Record<string, string> = {
  en: "City or country",
  fr: "Ville ou pays",
  de: "Stadt oder Land",
  es: "Ciudad o país",
  pt: "Cidade ou país",
  nl: "Stad of land",
};

const defaultUiText: UiTextResponse = {
  group: 0,
  language: "en",
  data: {},
  updated_at: "",
};

export default function SearchPageClient() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsUrl = useSearchParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);

  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [isMicro, setIsMicro] = useState(false);

  const [countries, setCountries] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [uiText, setUiText] = useState<UiTextResponse>(defaultUiText);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [view, setView] = useState<DirectoryView>("grid");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<CountryWithStats | null>(null);
  const [discoveryCountries, setDiscoveryCountries] = useState<CountryWithStats[]>([]);
  const [discoveryCategories, setDiscoveryCategories] = useState<Category[]>([]);
  const [discoveryBusinesses, setDiscoveryBusinesses] = useState<Business[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);

  const hasActiveSearch = Boolean(q || location || country || city || category || isMicro);

  useEffect(() => {
    const saved = window.localStorage.getItem("listacrosseu-directory-view");
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  function changeView(nextView: DirectoryView) {
    setView(nextView);
    window.localStorage.setItem("listacrosseu-directory-view", nextView);
  }



  // Load filters and UI text on mount and when language changes
  useEffect(() => {
    let cancelled = false;

    async function loadFiltersAndText() {
      try {
        const [countryData, categoryData, cityData, textData] = await Promise.all([
          fetchCountries(),
          fetchCategories(),
          fetchCities(),
          fetchUiText("search", lang).catch(() => defaultUiText), // fallback if no translations
        ]);
        if (cancelled) return;

        setCountries(
          countryData.map((c) => ({ label: c.name, value: c.slug }))
        );
        setCategories(
          categoryData.map((c) => ({ label: c.name, value: c.slug }))
        );
        setCities(
          cityData.map((c) => ({
            label: `${c.name}, ${c.country.name}`,
            value: c.slug,
          }))
        );
        setUiText(textData);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(t.forms.search.messages.filterLoadFailed);
      }
    }

    loadFiltersAndText();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (hasActiveSearch) return;
    let cancelled = false;
    setDiscoveryLoading(true);

    async function loadDiscovery() {
      try {
        const [visitorCode, countryData, globalCategories, globalBusinesses] = await Promise.all([
          detectVisitorCountry(),
          fetchCountriesWithStats(),
          fetchCategories(),
          fetchBusinesses({ limit: 6 }),
        ]);
        if (cancelled) return;

        const preferred = visitorCode
          ? countryData.find((item) => item.code?.toUpperCase() === visitorCode || item.slug.toUpperCase() === visitorCode)
          : undefined;
        const otherCountries = countryData
          .filter((item) => item.slug !== preferred?.slug)
          .slice(0, 12);

        if (preferred) {
          const [countryCategories, countryBusinesses] = await Promise.all([
            fetchCategoriesByLocation(preferred.slug),
            fetchBusinessesByLocation(preferred.slug, undefined, { limit: 6 }),
          ]);
          if (cancelled) return;
          setDetectedCountry(preferred);
          setDiscoveryCategories(countryCategories.slice(0, 10));
          setDiscoveryBusinesses(countryBusinesses.results);
        } else {
          setDetectedCountry(null);
          setDiscoveryCategories(globalCategories.slice(0, 10));
          setDiscoveryBusinesses(globalBusinesses.results);
        }
        setDiscoveryCountries(otherCountries);
      } catch (discoveryError) {
        console.error(discoveryError);
        if (!cancelled) {
          setDetectedCountry(null);
          setDiscoveryCategories([]);
          setDiscoveryBusinesses([]);
          setDiscoveryCountries([]);
        }
      } finally {
        if (!cancelled) setDiscoveryLoading(false);
      }
    }

    loadDiscovery();
    return () => {
      cancelled = true;
    };
  }, [lang, hasActiveSearch]);

  type SearchState = {
    q: string;
    location: string;
    country: string;
    city: string;
    category: string;
    isMicro: boolean;
  };

  async function runSearch(newOffset = 0, overrides: Partial<SearchState> = {}) {
    const search = { q, location, country, city, category, isMicro, ...overrides };
    try {
      setLoading(true);
      setError(null);
      const response = await fetchBusinesses({
        q: search.q || undefined,
        location: search.location || undefined,
        country: search.country || undefined,
        city: search.city || undefined,
        category: search.category || undefined,
        is_micro: search.isMicro,
        limit,
        offset: newOffset,
      });

      setBusinesses(response.results);
      setTotal(response.total);
      setOffset(response.offset);
      setFallbackMessage(response.fallback_message || null);
      if (response.normalized_query !== undefined) setQ(response.normalized_query);
      if (response.detected_location) setLocation(response.detected_location);
    } catch (err) {
      console.error(err);
      setError(t.forms.search.messages.failed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const next = {
      q: sanitizeSearchValue(searchParamsUrl.get("q")),
      location: sanitizeSearchValue(searchParamsUrl.get("location")),
      country: sanitizeSearchValue(searchParamsUrl.get("country")),
      city: sanitizeSearchValue(searchParamsUrl.get("city")),
      category: sanitizeSearchValue(searchParamsUrl.get("category")),
      isMicro: searchParamsUrl.get("is_micro") === "true",
    };
    setQ(next.q);
    setLocation(next.location);
    setCountry(next.country);
    setCity(next.city);
    setCategory(next.category);
    setIsMicro(next.isMicro);
    if (Object.values(next).some(Boolean)) runSearch(0, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, searchParamsUrl.toString()]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    const safeQuery = sanitizeSearchValue(q);
    const safeLocation = sanitizeSearchValue(location);
    if (safeQuery) next.set("q", safeQuery);
    if (safeLocation) next.set("location", safeLocation);
    if (country) next.set("country", country);
    if (city) next.set("city", city);
    if (category) next.set("category", category);
    if (isMicro) next.set("is_micro", "true");
    router.push(`${pathname}?${next.toString()}`);
    runSearch(0);
  }

  function countryLabel(countryItem: CountryWithStats) {
    const knownNames: Record<string, string> = {
      pt: t.nav.browseCountries.portugal,
      es: t.nav.browseCountries.spain,
      fr: t.nav.browseCountries.france,
      de: t.nav.browseCountries.germany,
      it: t.nav.browseCountries.italy,
      nl: t.nav.browseCountries.netherlands,
    };
    return knownNames[countryItem.slug] || countryItem.name;
  }

  function categoryLabel(categoryItem: Category) {
    const knownNames: Record<string, string> = {
      restaurants: t.nav.browseCategories.restaurants,
      health: t.nav.browseCategories.health,
      "professional-services": t.nav.browseCategories.professional,
      retail: t.nav.browseCategories.retail,
      "home-services": t.nav.browseCategories.homeServices,
      beauty: t.nav.browseCategories.beauty,
    };
    return knownNames[categoryItem.slug] || categoryItem.name;
  }

  function discoveryHeading(template: string, value: string) {
    return template.replace("{country}", value);
  }

  function openCategory(categorySlug: string) {
    const next = new URLSearchParams();
    if (detectedCountry) next.set("country", detectedCountry.slug);
    next.set("category", categorySlug);
    router.push(`${pathname}?${next.toString()}`);
  }

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="bg-slate-50">
      {/* Full-width hero band */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-[#0a3cff] to-[#0041b8] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-semibold">
            {uiText.data["search_title"] || t.forms.search.title}
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            {uiText.data["search_subtitle"] || t.forms.search.subtitle}
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div>
  
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow-sm md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {lang === "en" ? "What are you looking for?" : t.forms.search.labels.search}
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "en" ? "What are you looking for?" : t.forms.search.placeholders.search}
              className="w-full rounded-md border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {locationLabels[lang] || locationLabels.en}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={locationLabels[lang] || locationLabels.en}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.forms.search.labels.country}
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
            >
              <option value="">{t.forms.search.options.allCountries}</option>
              {countries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.forms.search.labels.category}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
            >
              <option value="">{t.forms.search.options.allCategories}</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.forms.search.labels.city}
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
            >
              <option value="">{t.forms.search.options.allCities}</option>
              {(() => {
                // Deduplicate cities to prevent duplicate React keys
                // Create country-safe unique keys for future scalability
                const uniqueCities = Array.from(
                  new Map(
                    cities.map((c) => {
                      const citySlug = c.value.trim().toLowerCase();
                      // Extract country code from label format "City, Country"
                      const countryName = c.label.split(', ')[1] || '';
                      const countrySlug = countryName.toLowerCase().replace(/\s+/g, '-');
                      const uniqueKey = `${countrySlug}:${citySlug}`;
                      
                      return [uniqueKey, {
                        ...c,
                        value: citySlug,
                      }];
                    })
                  ).values()
                );
                
                return uniqueCities.map((c, index) => {
                  // Use a compound key that includes both country and city for uniqueness
                  const countryName = c.label.split(', ')[1] || '';
                  const countrySlug = countryName.toLowerCase().replace(/\s+/g, '-');
                  const uniqueKey = `${countrySlug}:${c.value}`;
                  
                  return (
                    <option key={uniqueKey} value={c.value}>
                      {c.label}
                    </option>
                  );
                });
              })()}
            </select>
          </div>

          <div className="flex items-center gap-2 md:col-span-1">
            <input
              id="micro"
              type="checkbox"
              checked={isMicro}
              onChange={(e) => setIsMicro(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="micro"
              className="text-sm font-medium text-slate-700"
            >
              {t.forms.search.labels.microOnly}
            </label>
          </div>

          <div className="md:col-span-3 flex items-end justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? t.forms.search.buttons.searching : t.forms.search.buttons.search}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!hasActiveSearch && !error && (
          <section className="space-y-8" aria-label={t.nav.discoveryAllEurope}>
            {discoveryLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                {t.forms.search.messages.loading}
              </div>
            ) : (
              <>
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {detectedCountry
                        ? discoveryHeading(t.nav.popularCategories, countryLabel(detectedCountry))
                        : t.nav.discoveryAllEurope}
                    </h2>
                    <Link href={`/${lang}/categories`} className="text-sm font-semibold text-blue-700 hover:underline">
                      {t.nav.viewAllCategories}
                    </Link>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {discoveryCategories.map((item) => (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => openCategory(item.slug)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                      >
                        {categoryLabel(item)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {detectedCountry
                      ? discoveryHeading(t.nav.businessesIn, countryLabel(detectedCountry))
                      : t.nav.discoveryAllEurope}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {discoveryBusinesses.map((business) => (
                      <BusinessCard key={business.id} business={business as any} lang={lang} />
                    ))}
                  </div>
                </div>

                {discoveryCountries.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{t.nav.exploreOtherCountries}</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {discoveryCountries.map((item) => (
                        <Link
                          key={item.slug}
                          href={`${pathname}?country=${encodeURIComponent(item.slug)}`}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                        >
                          {countryLabel(item)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Results summary */}
        {total > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              {total.toLocaleString()} businesses
              <span className="ml-2 text-xs text-slate-500">
                ({t.forms.search.messages.resultsSummary
                  .replace("{shown}", String(businesses.length))
                  .replace("{total}", String(total))})
              </span>
            </div>
            <DirectoryViewToggle value={view} onChange={changeView} />
          </div>

        )}

        {(q || location) && (
          <p className="mb-4 text-sm text-slate-600">
            {q && <span>“{q}”</span>}
            {q && location && <span className="mx-1">in</span>}
            {location && <span>{location}</span>}
          </p>
        )}

        {fallbackMessage && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {fallbackMessage}
          </div>
        )}

        {hasActiveSearch && loading && businesses.length === 0 && (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            {t.forms.search.messages.loading}
          </div>
        )}

        {hasActiveSearch && (view === "grid" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business as any} lang={lang} />
            ))}
          </div>
        ) : (
          <DirectoryBusinessList businesses={businesses} lang={lang} />
        ))}

        {hasActiveSearch && <div className="space-y-4">
          {!loading && businesses.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="text-4xl mb-4">{t.forms.search.messages.noResultsIcon}</div>
              <div className="text-sm text-slate-500">
                {t.forms.search.messages.noResults}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {t.forms.search.messages.noResultsHint}
              </div>
            </div>
          )}
        </div>}

        {hasActiveSearch && <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={!canPrev || loading}
            onClick={() => runSearch(Math.max(0, offset - limit))}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              canPrev && !loading
                ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {t.forms.search.pagination.previous}
          </button>
          <div className="text-xs text-slate-500">
            {t.forms.search.messages.pageSummary
              .replace("{page}", String(Math.floor(offset / limit) + 1))
              .replace("{total}", String(total === 0 ? 1 : Math.ceil(total / limit)))}
          </div>
          <button
            type="button"
            disabled={!canNext || loading}
            onClick={() => runSearch(offset + limit)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              canNext && !loading
                ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {t.forms.search.pagination.next}
          </button>
        </div>}
        </div>
      </div>
    </div>
  );
}
