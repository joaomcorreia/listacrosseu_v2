"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import {
  fetchCountries,
  fetchCities,
  fetchTowns,
  fetchBusinesses,
  type Country,
  type City,
  type Town,
  type BusinessSearchResult,
} from "@/lib/api/listings";
import BusinessList from "@/components/BusinessList";

export default function LocationsPageClient() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  
  const [towns, setTowns] = useState<Town[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [recentBusinesses, setRecentBusinesses] = useState<BusinessSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // First load countries and recent businesses
        const [countriesData, businessesData] = await Promise.all([
          fetchCountries(),
          fetchBusinesses({ limit: 12 }),
        ]);

        if (cancelled) return;
        setCountries(countriesData);
        setRecentBusinesses(businessesData);

        // If we have a selected country, load cities and towns
        if (selectedCountry) {
          const [citiesData, townsData] = await Promise.all([
            fetchCities(selectedCountry),
            fetchTowns(selectedCountry, selectedCity),
          ]);

          if (cancelled) return;
          setCities(citiesData);
          setTowns(townsData);
        } else {
          setCities([]);
          setTowns([]);
        }

      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Failed to load locations data. Please try again.");
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
  }, [selectedCountry, selectedCity]);

  const handleCountryFilter = (countrySlug: string) => {
    setSelectedCountry(countrySlug);
    setSelectedCity(""); // Reset city when country changes
  };

  const handleCityFilter = (citySlug: string) => {
    setSelectedCity(citySlug);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Country Filter Skeleton */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Select Country
          </h2>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse h-8 bg-slate-200 rounded w-20"></div>
            ))}
          </div>
        </div>

        {/* Towns Grid Skeleton */}
        {selectedCountry && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Towns & Locations
            </h2>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg bg-white p-4 shadow-sm"
                >
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        )}
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

  return (
    <div className="space-y-12">
      {/* Country Filter */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Select Country
        </h2>
        <p className="text-slate-600 mb-6">
          Choose a country to view towns and locations with businesses.
        </p>
        <div className="flex flex-wrap gap-2">
          {countries.map((country) => (
            <button
              key={country.id}
              onClick={() => handleCountryFilter(country.slug)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedCountry === country.slug
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {country.name}
            </button>
          ))}
        </div>
      </div>

      {/* City Filter (if country selected) */}
      {selectedCountry && cities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Filter by City (Optional)
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCityFilter("")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedCity === ""
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Cities
            </button>
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCityFilter(city.slug)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedCity === city.slug
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Towns/Locations */}
      {selectedCountry && (
        <div>
          {towns.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-6">
                Towns & Locations
                {selectedCity && (
                  <span className="text-base font-normal text-slate-600 ml-2">
                    in {cities.find(c => c.slug === selectedCity)?.name}
                  </span>
                )}
              </h3>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {towns.map((town, index) => (
                  <Link
                    key={`${town.name}-${index}`}
                    href={`/${lang}/search?country=${selectedCountry}&town=${encodeURIComponent(town.name)}`}
                    className="group rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-all hover:scale-105"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {town.name}
                        </h4>
                      </div>
                      <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
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
                No locations found
              </h3>
              <p className="mt-2 text-slate-600">
                {selectedCity 
                  ? "No towns found for the selected filters." 
                  : `No towns with businesses found in ${countries.find(c => c.slug === selectedCountry)?.name || selectedCountry}.`
                }
              </p>
              {selectedCity && (
                <button
                  onClick={() => handleCityFilter("")}
                  className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Show all towns
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions when no country selected */}
      {!selectedCountry && (
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
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m-6 3l6-3"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            Select a Country
          </h3>
          <p className="mt-2 text-slate-600">
            Choose a country above to explore towns and locations with business listings.
          </p>
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
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
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