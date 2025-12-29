'use client';

import { useState, useEffect } from 'react';
import { Business, Category, fetchCategoriesByLocation } from '@/lib/api/listings';
import { fetchBusinesses } from '@/lib/api/listings';
import BusinessCard from '@/components/BusinessCard';
import PopularBusinessTypes from '@/components/PopularBusinessTypes';
import AdPlaceholder from '@/components/ads/AdPlaceholder';
import { MapPin, Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  lang: string;
  slug: string;
}

interface CityPageData {
  businesses: Business[];
  categories: Category[];
  total: number;
  loading: boolean;
  error: string | null;
  cityName: string;
  offset: number;
}

export default function CityPageClient({ lang, slug }: Props) {
  const [data, setData] = useState<CityPageData>({
    businesses: [],
    categories: [],
    total: 0,
    loading: true,
    error: null,
    cityName: '',
    offset: 0,
  });

  const limit = 20;

  // Convert slug to display name (simple capitalization)
  const getCityDisplayName = (slug: string): string => {
    if (!slug) return '';
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const loadBusinesses = async (newOffset = 0) => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Load both businesses and categories in parallel
      const [businessResponse, categoriesData] = await Promise.all([
        fetch(`/api/cities/${slug}?limit=${limit}&offset=${newOffset}`),
        // Only load categories on first load (newOffset === 0)
        newOffset === 0 ? fetchCategoriesByLocation(undefined, slug) : Promise.resolve(data.categories)
      ]);
      
      if (!businessResponse.ok) {
        throw new Error(`API Error: ${businessResponse.status} - ${businessResponse.statusText}`);
      }
      
      const businessResult = await businessResponse.json();

      setData(prev => ({
        ...prev,
        businesses: businessResult.results || [],
        categories: newOffset === 0 ? (categoriesData as Category[]) : prev.categories,
        total: businessResult.total || 0,
        offset: businessResult.offset || 0,
        loading: false,
        cityName: getCityDisplayName(slug),
      }));
    } catch (err) {
      console.error('Failed to load city data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data. Please try again.',
      }));
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [slug]);

  const handleLoadMore = () => {
    loadBusinesses(data.offset + limit);
  };

  const canLoadMore = data.offset + limit < data.total;

  if (data.loading && data.businesses.length === 0) {
    return (
      <>
        {/* Hero Section Skeleton */}
        <section className="relative isolate bg-gradient-to-r from-[#0a3cff] to-[#0041b8] text-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded w-48 mb-4"></div>
              <div className="h-4 bg-white/20 rounded w-32"></div>
            </div>
          </div>
        </section>

        {/* Content Skeleton */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg p-6 shadow-sm">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-2 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative isolate bg-gradient-to-r from-[#0a3cff] to-[#0041b8] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href={`/${lang}/cities`}
              className="inline-flex items-center text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cities
            </Link>
          </div>

          <div className="flex items-center mb-4">
            <MapPin className="w-8 h-8 mr-3" />
            <h1 className="text-3xl font-bold">
              Businesses in {data.cityName}
            </h1>
          </div>
          
          <div className="flex items-center text-blue-100">
            <Building2 className="w-5 h-5 mr-2" />
            <span>
              {data.total > 0 ? `${data.total} businesses found` : 'Loading businesses...'}
            </span>
          </div>
        </div>
      </section>

      {/* Popular Business Types */}
      {data.categories.length > 0 && !data.loading && (
        <PopularBusinessTypes
          title={`Popular Business Types in ${data.cityName}`}
          categories={data.categories}
          baseUrl={`/${lang}/search?city=${slug}`}
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        {data.error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="text-red-800">
                <p className="font-medium">Error loading businesses</p>
                <p className="text-sm mt-1">{data.error}</p>
              </div>
            </div>
          </div>
        )}

        {data.businesses.length === 0 && !data.loading && !data.error && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No businesses found in {data.cityName}
            </h3>
            <p className="text-slate-600 mb-4">
              Be the first to list your business in this city!
            </p>
            <Link
              href={`/${lang}/list-your-business`}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              List Your Business
            </Link>
          </div>
        )}

        {data.businesses.length > 0 && (
          <>
            {/* Results Summary */}
            <div className="mb-6 text-sm text-slate-600">
              Showing {data.businesses.length} of {data.total} businesses in {data.cityName}
            </div>

            {/* Business Grid - Using CSS columns for mixed heights */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
              {data.businesses.map((business) => (
                <div key={business.id} className="break-inside-avoid mb-6">
                  <BusinessCard
                    business={business as any}
                    lang={lang}
                  />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {canLoadMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={data.loading}
                  className="inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  {data.loading ? 'Loading...' : 'Load More Businesses'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}