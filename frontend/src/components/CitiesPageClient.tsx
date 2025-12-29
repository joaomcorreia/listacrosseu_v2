"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import {
  fetchCountries,
  fetchCities,
  fetchBusinesses,
  type Country,
  type City,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import BusinessList from "@/components/BusinessList";

export default function CitiesPageClient() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  
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
          setError("Failed to load cities data. Please try again.");
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
            Filter by Country
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
            Cities with Businesses
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
        <h3 className="mt-4 text-lg font-medium text-red-900">Error</h3>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Group cities by country
  const citiesByCountry = cities.reduce((acc, city) => {
    const countryName = city.country.name;
    if (!acc[countryName]) {
      acc[countryName] = [];
    }
    acc[countryName].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  return (
    <div className="space-y-12">
      {/* Development debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-yellow-50 border border-yellow-200 p-2 rounded">
          <strong>🐛 Debug:</strong> {cities.length} cities, {countries.length} countries | Filter: "{selectedCountry}" | Recent businesses: {recentBusinesses?.results?.length || 0} of {recentBusinesses?.total || 0} total
        </div>
      )}

      {/* Country Filter */}
      {countries.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Filter by Country
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
              All Countries
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
                {countryCities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/${lang}/cities/${city.slug}`}
                    className="group rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-all hover:scale-105"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {city.name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {city.country.name}
                        </p>
                      </div>
                      <div className="text-slate-400 group-hover:text-emerald-600 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
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
            No cities available
          </h3>
          <p className="mt-2 text-slate-600">
            {selectedCountry 
              ? "No cities found for the selected country." 
              : "We're organizing our city directory. Please check back soon!"
            }
          </p>
          {selectedCountry && (
            <button
              onClick={() => handleCountryFilter("")}
              className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Show all cities
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
                Recent Listings
              </h2>
              <p className="text-slate-600">
                Latest businesses added to our directory.
              </p>
            </div>
            <Link
              href={`/${lang}/search`}
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              View all
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </Link>
          </div>
          <BusinessList businesses={recentBusinesses.results} />
        </div>
      )}
    </div>
  );
}