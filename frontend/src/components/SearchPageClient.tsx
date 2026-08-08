"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import {
  fetchBusinesses,
  fetchCountries,
  fetchCategories,
  fetchCities,
  type Business,
  type Country,
  type City,
  type Category,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import {
  fetchUiText,
  type UiTextResponse,
} from "@/lib/api";
import SnowBackground from "@/components/SnowBackground";
import { getBusinessCanonicalPath } from "@/lib/businessUrls";

type Option = { label: string; value: string };

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



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

  async function runSearch(newOffset = 0) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchBusinesses({
        q: q || undefined,
        country: country || undefined,
        city: city || undefined,
        category: category || undefined,
        is_micro: isMicro,
        limit,
        offset: newOffset,
      });

      setBusinesses(response.results);
      setTotal(response.total);
      setOffset(response.offset);
    } catch (err) {
      console.error(err);
      setError(t.forms.search.messages.failed);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(0);
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
          className="mb-6 grid gap-4 rounded-lg bg-white p-4 shadow-sm md:grid-cols-4"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t.forms.search.labels.search}
            </label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.forms.search.placeholders.search}
              className="w-full rounded-md border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
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

        {/* Results summary */}
        {total > 0 && (
          <div className="mb-4 text-xs text-slate-500">
            {t.forms.search.messages.resultsSummary
              .replace("{shown}", String(businesses.length))
              .replace("{total}", String(total))}
          </div>
        )}

        {/* Development debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 text-xs bg-yellow-50 border border-yellow-200 p-2 rounded">
            <strong>{t.forms.search.messages.debugLabel}:</strong>{" "}
            {t.forms.search.messages.debugSummary
              .replace("{total}", String(total))
              .replace("{country}", country || "-")
              .replace("{city}", city || "-")
              .replace("{category}", category || "-")
              .replace("{query}", q || "-")
              .replace("{countries}", String(countries.length))
              .replace("{cities}", String(cities.length))
              .replace("{categories}", String(categories.length))}
          </div>
        )}

        {/* Loading state */}
        {loading && businesses.length === 0 && (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            {t.forms.search.messages.loading}
          </div>
        )}

        {/* Results list */}
        <div className="space-y-4">
          {businesses.map((b) => {
            const location =
              b.city?.name && b.country?.name
                ? `${b.city.name}, ${b.country.name}`
                : b.country?.name || b.city?.name || null;

            const detailHref = getBusinessCanonicalPath(b, lang);

            return (
              <article
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-slate-900">
                      <Link href={detailHref} className="hover:text-blue-600 hover:underline">
                        {b.name}
                      </Link>
                    </h2>

                    {location && (
                      <div className="mt-1 text-xs text-slate-500">{location}</div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {b.is_micro && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          {t.businessCard.microBadge}
                        </span>
                      )}

                      {b.category && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                          {b.category.name}
                        </span>
                      )}
                    </div>

                    {b.description && (
                      <p className="mt-3 text-sm text-slate-700" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                      }}>
                        {b.description}
                      </p>
                    )}

                    {b.address && (
                      <div className="mt-2 text-xs text-slate-500">
                        {t.businessCard.address}: {b.address}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {b.website && (
                      <a
                        href={b.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {t.buttons.visitWebsite}
                      </a>
                    )}

                    <Link
                      href={detailHref}
                      className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800 transition-colors"
                    >
                      {t.buttons.viewDetails}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

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
        </div>

        <div className="mt-6 flex items-center justify-between">
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
        </div>
        </div>
      </div>
    </div>
  );
}
