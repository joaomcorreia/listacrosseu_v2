"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import { fetchCountriesWithStats, type CountryWithStats } from "@/lib/api/listings";
import CountryExplorerCard from "@/components/CountryExplorerCard";
import FeaturedCountrySection from "@/components/FeaturedCountrySection";
import CountryExplorerStats from "@/components/CountryExplorerStats";
import { debugLog } from "@/lib/debug";

export default function CountriesPageClient() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  
  const [countries, setCountries] = useState<CountryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  debugLog("Debug: CountriesPageClient (Country Explorer) loaded, lang:", lang);

  useEffect(() => {
    let cancelled = false;

    async function loadCountriesData() {
      try {
        setLoading(true);
        setError(null);

        const countriesData = await fetchCountriesWithStats();

        if (cancelled) return;

        setCountries(countriesData);
      } catch (err) {
        console.error("Error loading countries:", err);
        if (!cancelled) {
          setError(t.directory.countries.errorLoad);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCountriesData();
    return () => {
      cancelled = true;
    };
  }, [lang, t]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Featured Country Skeleton */}
        <div className="animate-pulse rounded-xl bg-slate-200 h-64"></div>
        
        {/* Country Grid Skeleton */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {t.directory.countries.exploreTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-white p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-200 rounded"></div>
                  <div className="h-5 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                    <div className="h-4 bg-slate-200 rounded w-8"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                </div>
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
        <h3 className="mt-4 text-lg font-medium text-red-900">{t.directory.countries.errorTitle}</h3>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {t.directory.common.tryAgain}
        </button>
      </div>
    );
  }

  // Get featured country (Portugal as default, or largest by business count)
  const getFeaturedCountry = () => {
    return countries.find(c => c.slug === 'pt') || countries[0];
  };

  const featuredCountry = countries.length > 0 ? getFeaturedCountry() : null;
  const regularCountries = countries.filter(c => c.id !== featuredCountry?.id);

  return (
    <div className="space-y-8">
          {/* Development debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs bg-yellow-50 border border-yellow-200 p-2 rounded">
              <strong>{t.directory.common.debugLabel}:</strong> {countries.length} countries with stats loaded
            </div>
          )}

          {/* Featured Country Section */}
          {featuredCountry && (
            <FeaturedCountrySection country={featuredCountry} lang={lang} />
          )}

          {/* Country Explorer Grid */}
          {regularCountries.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {t.directory.countries.exploreTitle}
                </h2>
                <p className="text-slate-600">
                  {t.directory.countries.exploreSubtitle}
                </p>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {regularCountries.map((country) => (
                  <CountryExplorerCard
                    key={country.id}
                    country={country}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {countries.length === 0 && !loading && (
            <div className="rounded-lg bg-white p-12 text-center shadow-sm border border-slate-200">
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
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-slate-900">
                {t.directory.countries.noCountriesTitle}
              </h3>
              <p className="mt-2 text-slate-600">
                {t.directory.countries.noCountriesBody}
              </p>
            </div>
          )}
    </div>
  );
}

