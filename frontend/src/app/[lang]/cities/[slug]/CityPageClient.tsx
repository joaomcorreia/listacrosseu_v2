'use client';

import { useState, useEffect } from 'react';
import { Business, Category, fetchCategoriesByLocation } from '@/lib/api/listings';
import { fetchBusinesses } from '@/lib/api/listings';
import BusinessCard from '@/components/BusinessCard';
import PopularBusinessTypes from '@/components/PopularBusinessTypes';
import AdPlaceholder from '@/components/ads/AdPlaceholder';
import BlogPostsSlider from '@/components/blog/BlogPostsSlider';
import { MapPin, Building2 } from 'lucide-react';
import { useTranslations } from '@/i18n/translations';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import DirectorySidebarLayout from '@/components/DirectorySidebarLayout';
import Sidebar from '@/components/Sidebar';
import { useDirectoryPageEditor } from '@/components/DirectoryPageEditor';

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
  const t = useTranslations(lang);
  const [data, setData] = useState<CityPageData>({
    businesses: [],
    categories: [],
    total: 0,
    loading: true,
    error: null,
    cityName: '',
    offset: 0,
  });

  // Convert slug to display name (simple capitalization)
  const getCityDisplayName = (citySlug: string): string => {
    if (!citySlug) return '';
    return citySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const directoryEditor = useDirectoryPageEditor({
    scope: 'city',
    slug,
    defaults: {
      hero_image: '',
      title: `Businesses in ${getCityDisplayName(slug)}`,
      subtitle: 'Discover local businesses and services in this city.',
      intro: '',
      cta_label: '',
      cta_href: '',
    },
  });
  const { content, editable, editMode, toolbar } = directoryEditor;

  const limit = 20;
  const format = (template: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
      template,
    );

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
        error: t.directory.cityDetail.errorLoad,
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
  const tierOrder: Record<string, number> = { premium: 0, claimed: 1, free: 2 };
  const sortedBusinesses = [...data.businesses].sort(
    (a: any, b: any) =>
      (tierOrder[a.tier ?? "free"] ?? 2) - (tierOrder[b.tier ?? "free"] ?? 2)
  );

  if (data.loading && data.businesses.length === 0) {
    return (
      <>
        {/* Hero Section Skeleton */}
        <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-[#0a3cff] to-[#0041b8] text-white">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded w-48 mb-4"></div>
              <div className="h-4 bg-white/20 rounded w-32"></div>
            </div>
          </div>
        </section>

        {/* Content Skeleton */}
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
      <section
        className="relative isolate -mt-16 overflow-hidden bg-gradient-to-r from-[#0a3cff] to-[#0041b8] bg-cover bg-center text-white"
        style={content.hero_image ? { backgroundImage: `linear-gradient(90deg, rgba(5, 31, 104, 0.88), rgba(0, 65, 184, 0.68)), url(${content.hero_image})` } : undefined}
      >
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center mb-4">
            <MapPin className="w-8 h-8 mr-3" />
            {editable("title", content.title || format(t.directory.cityDetail.title, { city: data.cityName }), "text-3xl font-bold", "h1")}
          </div>
          {editable("subtitle", content.subtitle, "mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg", "p", true)}
          {content.cta_label && (editMode ? (
            <div className="mt-7 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-800">
              {editable("cta_label", content.cta_label, "", "span")}
            </div>
          ) : (
            <a href={content.cta_href || `/${lang}/list-your-business`} className="mt-7 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50">
              {content.cta_label}
            </a>
          ))}
          
          <div className="flex items-center text-blue-100">
            <Building2 className="w-5 h-5 mr-2" />
            <span>
              {data.total > 0
                ? format(t.directory.cityDetail.totalFound, { count: data.total })
                : t.directory.cityDetail.loadingBusinesses}
            </span>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-slate-50 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs current={data.cityName} />
        </div>
      </div>

      <DirectorySidebarLayout sidebar={<Sidebar content="ads" context={{ citySlug: slug }} />}>
        {content.intro && (
          <section className="pt-8">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {editable("intro", content.intro, "text-base leading-7 text-slate-700", "p", true)}
            </div>
          </section>
        )}
        {/* Popular Business Types */}
        {data.categories.length > 0 && !data.loading && (
          <PopularBusinessTypes
            title={format(t.directory.cityDetail.popularTypesTitle, { city: data.cityName })}
            categories={data.categories}
            baseUrl={`/${lang}/search?city=${slug}`}
            limit={12}
          />
        )}

        {/* Inline Ad */}
        <div className="py-8">
          <div className="w-full">
            <AdPlaceholder variant="inline" />
          </div>
        </div>

        {/* Main Content */}
        <div className="py-8">
        {data.error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="text-red-800">
                <p className="font-medium">{t.directory.cityDetail.errorTitle}</p>
                <p className="text-sm mt-1">{data.error}</p>
              </div>
            </div>
          </div>
        )}

        {data.businesses.length === 0 && !data.loading && !data.error && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {format(t.directory.cityDetail.emptyTitle, { city: data.cityName })}
            </h3>
            <p className="text-slate-600 mb-4">
              {t.directory.cityDetail.emptyBody}
            </p>
            <Link
              href={`/${lang}/list-your-business`}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {t.directory.cityDetail.listYourBusiness}
            </Link>
          </div>
        )}

        {data.businesses.length > 0 && (
          <>
            {/* Results Summary */}
            <div className="mb-6 text-sm text-slate-600">
              {format(t.directory.cityDetail.resultsSummary, { shown: data.businesses.length, total: data.total, city: data.cityName })}
            </div>

            {/* Business Grid - Using CSS columns for mixed heights */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {sortedBusinesses.map((business) => (
                <div
                  key={business.id}
                  className={business.tier === "premium" ? "col-span-2" : ""}
                >
                  <BusinessCard business={business as any} lang={lang} />
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
                  {data.loading ? t.directory.cityDetail.loading : t.directory.cityDetail.loadMore}
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </DirectorySidebarLayout>

      <BlogPostsSlider lang={lang} mode="eu" />
      {toolbar}
    </>
  );
}
