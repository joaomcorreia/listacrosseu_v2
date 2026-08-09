'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchCities, type City } from '@/lib/api/geo';
import { useTranslations } from '@/i18n/translations';
import { debugWarn } from '@/lib/debug';

interface TopCitiesProps {
  lang: string;
}

const TopCities: React.FC<TopCitiesProps> = ({ lang }) => {
  const t = useTranslations(lang);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopCities() {
      try {
        const data = await fetchCities({ limit: 12 });
        setCities(data);
      } catch (error) {
        debugWarn('Failed to load live cities:', error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    }

    loadTopCities();
  }, [lang]);

  const CityCard: React.FC<{ city: City }> = ({ city }) => (
    <Link 
      href={`/${lang}/cities/${city.slug}`}
      className="group bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 hover:ring-2 hover:ring-blue-300/60 transition-all duration-200 relative overflow-hidden"
    >
      {/* Shape decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-br from-blue-100/60 to-purple-100/40 rounded-full blur-sm" />
        <div className="absolute bottom-2 left-2 w-6 h-6 bg-gradient-to-br from-emerald-100/50 to-blue-100/30 rounded-full blur-sm" />
      </div>
      
      <div className="relative z-10">
        {/* City flag/icon placeholder */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
          <div className="w-5 h-5 bg-white rounded opacity-90" />
        </div>
        
        <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
          {city.name}
        </h3>
        
        <p className="text-sm text-slate-600 mb-3">
          {city.country?.name}
        </p>
        
        {city.business_count && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {t.home.topCities.businessesLabel}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {city.business_count.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            <div className="w-10 h-10 bg-slate-200 rounded-lg mb-4" />
            <div className="h-5 bg-slate-200 rounded w-24 mb-1" />
            <div className="h-4 bg-slate-200 rounded w-16 mb-3" />
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <div className="h-3 bg-slate-200 rounded w-12" />
                <div className="h-4 bg-slate-200 rounded w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          {t.home.topCities.title}
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {t.home.topCities.subtitle}
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cities.slice(0, 8).map((city) => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>
      
      <div className="text-center">
        <Link 
          href={`/${lang}/cities`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {t.home.topCities.viewAll}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default TopCities;

