"use client";

import Link from "next/link";
import { CountryWithStats } from "@/lib/api/listings";

interface CountryExplorerCardProps {
  country: CountryWithStats;
  lang: string;
}

// Country code to flag emoji mapping
const COUNTRY_FLAGS: { [key: string]: string } = {
  'at': '🇦🇹', // Austria
  'be': '🇧🇪', // Belgium  
  'bg': '🇧🇬', // Bulgaria
  'hr': '🇭🇷', // Croatia
  'cy': '🇨🇾', // Cyprus
  'cz': '🇨🇿', // Czech Republic
  'dk': '🇩🇰', // Denmark
  'ee': '🇪🇪', // Estonia
  'fi': '🇫🇮', // Finland
  'fr': '🇫🇷', // France
  'de': '🇩🇪', // Germany
  'gr': '🇬🇷', // Greece
  'hu': '🇭🇺', // Hungary
  'ie': '🇮🇪', // Ireland
  'it': '🇮🇹', // Italy
  'lv': '🇱🇻', // Latvia
  'lt': '🇱🇹', // Lithuania
  'lu': '🇱🇺', // Luxembourg
  'mt': '🇲🇹', // Malta
  'nl': '🇳🇱', // Netherlands
  'pl': '🇵🇱', // Poland
  'pt': '🇵🇹', // Portugal
  'ro': '🇷🇴', // Romania
  'sk': '🇸🇰', // Slovakia
  'si': '🇸🇮', // Slovenia
  'es': '🇪🇸', // Spain
  'se': '🇸🇪', // Sweden
  'is': '🇮🇸', // Iceland
  'li': '🇱🇮', // Liechtenstein
  'no': '🇳🇴', // Norway
  'ch': '🇨🇭', // Switzerland
  'gb': '🇬🇧', // United Kingdom
};

export default function CountryExplorerCard({ country, lang }: CountryExplorerCardProps) {
  const flag = COUNTRY_FLAGS[country.slug] || '🇪🇺'; // Default to EU flag
  
  return (
    <Link
      href={`/${lang}/countries/${country.slug}`}
      className="group block rounded-lg bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-slate-200 hover:border-blue-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl" role="img" aria-label={`${country.name} flag`}>
              {flag}
            </span>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              {country.name}
            </h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Cities</span>
              <span className="font-medium text-slate-900">
                {country.city_count.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Businesses</span>
              <span className="font-medium text-slate-900">
                {country.business_count.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Arrow icon */}
        <div className="text-slate-400 group-hover:text-blue-600 transition-colors ml-4">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Explore CTA */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
          Explore businesses
          <svg className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </Link>
  );
}