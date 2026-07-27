"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import {
  fetchCountries,
  fetchCities,
  fetchBusinesses,
  type Country,
  type City,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import BusinessCard from "@/components/BusinessCard";

export default function CitiesPageClient() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [recentBusinesses, setRecentBusinesses] = useState<BusinessSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [countriesData, citiesData, businessesData] = await Promise.all([
          fetchCountries(),
          fetchCities(selectedCountry),
          fetchBusinesses({ limit: 12 }), // Show some recent businesses
        ]);

        if (cancelled) return;

        setCountries(countriesData);
        setCities(citiesData);
        setRecentBusinesses(businessesData);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(t.directory.cities.errorLoad);
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
  }, [lang, selectedCountry]);

  const handleCountryFilter = (countrySlug: string) => {
    setSelectedCountry(countrySlug);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Country Filter Skeleton */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.directory.cities.filterByCountry}
          </h2>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse h-8 bg-slate-200 rounded w-20"></div>
            ))}
          </div>
        </div>

        {/* Cities Grid Skeleton */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.directory.cities.citiesWithBusinesses}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg bg-white p-6 shadow-sm"
              >
                <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-16"></div>
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
        <h3 className="mt-4 text-lg font-medium text-red-900">{t.directory.cities.errorTitle}</h3>
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

  const tierOrder: Record<string, number> = { premium: 0, claimed: 1, free: 2 };
  const sortedRecentBusinesses = recentBusinesses
    ? [...recentBusinesses.results].sort(
        (a: any, b: any) =>
          (tierOrder[a.tier ?? "free"] ?? 2) - (tierOrder[b.tier ?? "free"] ?? 2)
      )
    : [];

  // Group cities by country
  const citiesByCountry = cities.reduce((acc, city) => {
    const countryName = city.country.name;
    if (!acc[countryName]) {
      acc[countryName] = [];
    }
    acc[countryName].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  const getCountryAccent = (country: City["country"]) => {
    const code = (country?.code || country?.slug || "").toUpperCase();
    const map: Record<string, { ring: string; text: string; bar: string; badge: string }> = {
      PT: { ring: "ring-emerald-100", text: "text-emerald-700", bar: "bg-emerald-500", badge: "bg-emerald-50" },
      ES: { ring: "ring-amber-100", text: "text-amber-700", bar: "bg-amber-500", badge: "bg-amber-50" },
      FR: { ring: "ring-indigo-100", text: "text-indigo-700", bar: "bg-indigo-500", badge: "bg-indigo-50" },
      DE: { ring: "ring-slate-100", text: "text-slate-700", bar: "bg-slate-500", badge: "bg-slate-50" },
      IT: { ring: "ring-rose-100", text: "text-rose-700", bar: "bg-rose-500", badge: "bg-rose-50" },
      NL: { ring: "ring-sky-100", text: "text-sky-700", bar: "bg-sky-500", badge: "bg-sky-50" },
      BE: { ring: "ring-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500", badge: "bg-yellow-50" },
      SE: { ring: "ring-blue-100", text: "text-blue-700", bar: "bg-blue-500", badge: "bg-blue-50" },
      DK: { ring: "ring-red-100", text: "text-red-700", bar: "bg-red-500", badge: "bg-red-50" },
      FI: { ring: "ring-cyan-100", text: "text-cyan-700", bar: "bg-cyan-500", badge: "bg-cyan-50" },
    };
    return map[code] || { ring: "ring-slate-100", text: "text-slate-700", bar: "bg-slate-400", badge: "bg-slate-50" };
  };

  return (
    <div className="space-y-12">
      {/* Development debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-yellow-50 border border-yellow-200 p-2 rounded">
          <strong>{t.directory.common.debugLabel}:</strong> {cities.length} cities, {countries.length} countries | Filter: "{selectedCountry}" | Recent businesses: {recentBusinesses?.results?.length || 0} of {recentBusinesses?.total || 0} total
        </div>
      )}

      {/* Country Filter */}
      {countries.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.directory.cities.filterByCountry}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCountryFilter("")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedCountry === ""
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t.directory.cities.allCountries}
            </button>
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => handleCountryFilter(country.slug)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedCountry === country.slug
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {country.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cities by Country */}
      {Object.keys(citiesByCountry).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(citiesByCountry).map(([countryName, countryCities]) => (
            <div key={countryName}>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                {countryName}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {countryCities.map((city) => {
                  const accent = getCountryAccent(city.country);
                  const code = (city.country.code || city.country.slug || "").toUpperCase();
                  return (
                    <Link
                      key={city.id}
                      href={`/${lang}/cities/${city.slug}`}
                      className={`group rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:-translate-y-1 ${accent.ring}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium text-slate-900 transition-colors ${accent.text}`}>
                            {city.name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {city.country.name}
                          </p>
                        </div>
                        <div className={`text-slate-400 transition-colors ${accent.text}`}>
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${accent.badge} ${accent.text}`}>
                          {code || city.country.name}
                        </span>
                      </div>
                      <div className={`mt-3 h-1 w-full rounded-full ${accent.bar}`} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {t.directory.cities.noCitiesTitle}
          </h3>
          <p className="mt-2 text-slate-600">
            {selectedCountry 
              ? t.directory.cities.noCitiesSelected 
              : t.directory.cities.noCitiesGeneral
            }
          </p>
          {selectedCountry && (
            <button
              onClick={() => handleCountryFilter("")}
              className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {t.directory.cities.showAllCities}
            </button>
          )}
        </div>
      )}

      {/* Recent Businesses */}
      {recentBusinesses && recentBusinesses.results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {t.directory.cities.recentListingsTitle}
              </h2>
              <p className="text-slate-600">
                {t.directory.cities.recentListingsSubtitle}
              </p>
            </div>
            <Link
              href={`/${lang}/search`}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              {t.directory.cities.viewAll}
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
    </div>
  );
}
