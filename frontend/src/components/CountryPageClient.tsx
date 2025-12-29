"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import {
  fetchBusinessesByLocation,
  fetchCountries,
  fetchCities,
  fetchCategoriesByLocation,
  type Country,
  type City,
  type BusinessSearchResult,
  type Category,
} from "@/lib/api/listings";
import BusinessList from "@/components/BusinessList";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import PopularBusinessTypes from "@/components/PopularBusinessTypes";
import AdPlaceholder from "@/components/ads/AdPlaceholder";

interface CountryPageClientProps {
  countrySlug: string;
}

export default function CountryPageClient({ countrySlug }: CountryPageClientProps) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  
  const [country, setCountry] = useState<Country | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [businesses, setBusinesses] = useState<BusinessSearchResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  const limit = 20;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // First load countries to find the current one
        const [countriesData, businessesData, citiesData, categoriesData] = await Promise.all([
          fetchCountries(),
          fetchBusinessesByLocation(countrySlug, undefined, { 
            limit, 
            offset: currentPage * limit 
          }),
          fetchCities(),
          fetchCategoriesByLocation(countrySlug),
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
        setCategories(categoriesData);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load country data");
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
  }, [countrySlug, currentPage]);

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

  if (loading) {
    return (
      <div>
        {/* Hero Section Skeleton */}
        <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="mx-auto max-w-6xl px-4 py-20">
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
          <div className="mx-auto max-w-6xl px-4">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-48"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
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
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Country Not Found
              </h1>
              <p className="mt-6 text-xl leading-8 text-red-100">
                {error}
              </p>
            </div>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="bg-slate-50 border-b border-slate-200 py-3">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-sm text-slate-600">
              <Breadcrumbs current="Country Not Found" />
            </div>
          </div>
        </div>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <button
              onClick={() => window.history.back()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go Back
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
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {country.name}
            </h1>
            <p className="mt-6 text-xl leading-8 text-blue-100">
              Discover local businesses and services in {country.name}
            </p>
            {businesses && (
              <div className="mt-4 text-blue-100">
                {businesses.total > 0 ? (
                  <span>{businesses.total} businesses found</span>
                ) : (
                  <span>No businesses listed yet</span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b border-slate-200 py-3">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-sm text-slate-600">
            <Breadcrumbs current={country.name} />
          </div>
        </div>
      </div>

      {/* Popular Business Types */}
      {categories.length > 0 && (
        <PopularBusinessTypes
          title={`Popular Business Types in ${country.name}`}
          categories={categories}
          baseUrl={`/${lang}/search?country=${countrySlug}`}
          limit={12}
        />
      )}

      {/* Inline Ad */}
      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4">
          <AdPlaceholder variant="inline" />
        </div>
      </div>

      {/* Main Content */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Main content area */}
            <div className="lg:col-span-3">
              {businesses && (
                <BusinessList
                  businesses={businesses.results}
                  title={`Businesses in ${country.name}`}
                  showPagination={true}
                  total={businesses.total}
                  limit={limit}
                  offset={currentPage * limit}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="mt-12 lg:mt-0">
              <div className="space-y-6">
                {/* Cities in this country */}
                {cities.length > 0 && (
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">
                      Cities in {country.name}
                    </h3>
                    <div className="space-y-2">
                      {cities.slice(0, 10).map((city) => (
                        <a
                          key={city.id}
                          href={`/${lang}/cities/${city.slug}`}
                          className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {city.name}
                        </a>
                      ))}
                      {cities.length > 10 && (
                        <p className="text-xs text-slate-500 mt-2">
                          And {cities.length - 10} more cities...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Country Stats */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">
                    Quick Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Businesses</span>
                      <span className="font-medium">
                        {businesses?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cities</span>
                      <span className="font-medium">{cities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Country Code</span>
                      <span className="font-medium uppercase">{country.slug}</span>
                    </div>
                  </div>
                </div>

                {/* Backend-driven sidebar items */}
                <Sidebar slot="country_page" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}