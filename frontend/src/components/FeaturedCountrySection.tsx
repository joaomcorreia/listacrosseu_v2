"use client";

import Link from "next/link";
import { CountryWithStats } from "@/lib/api/listings";

interface FeaturedCountrySectionProps {
  country: CountryWithStats;
  lang: string;
}

export default function FeaturedCountrySection({ country, lang }: FeaturedCountrySectionProps) {
  // Country specific details for featured display
  const getCountryDetails = (slug: string) => {
    switch (slug) {
      case 'pt':
        return {
          flag: '🇵🇹',
          description: 'Explore vibrant businesses across Portugal, from Lisbon\'s tech startups to Porto\'s traditional crafts.',
          highlights: ['Tech Innovation', 'Tourism', 'Traditional Crafts']
        };
      case 'de':
        return {
          flag: '🇩🇪',
          description: 'Discover Germany\'s industrial excellence and entrepreneurial spirit across major cities.',
          highlights: ['Manufacturing', 'Engineering', 'Automotive']
        };
      case 'fr':
        return {
          flag: '🇫🇷',
          description: 'From Parisian boutiques to regional specialties, explore France\'s diverse business landscape.',
          highlights: ['Fashion', 'Gastronomy', 'Luxury Goods']
        };
      case 'nl':
        return {
          flag: '🇳🇱',
          description: 'Navigate the Netherlands\' innovative business ecosystem from Amsterdam to Rotterdam.',
          highlights: ['Innovation', 'Logistics', 'Sustainability']
        };
      default:
        return {
          flag: '🇪🇺',
          description: `Discover the diverse business opportunities and entrepreneurial spirit of ${country.name}.`,
          highlights: ['Business', 'Commerce', 'Innovation']
        };
    }
  };

  const details = getCountryDetails(country.slug);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 mb-12">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8cGF0aCBkPSJNIDQwIDAgTCAwIDQwIE0gMCAwIEwgNDAgNDAiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz4KICA8L3N2Zz4K')] opacity-20"></div>
      </div>

      <div className="relative">
        <div className="flex items-start gap-6">
          {/* Flag and country info */}
          <div className="flex-shrink-0">
            <div className="text-6xl mb-2" role="img" aria-label={`${country.name} flag`}>
              {details.flag}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="mb-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Featured Country
              </span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              {country.name}
            </h2>
            
            <p className="text-blue-100 text-lg leading-relaxed mb-6">
              {details.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {country.business_count.toLocaleString()}
                </div>
                <div className="text-blue-200 text-sm">
                  Businesses
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {country.city_count.toLocaleString()}
                </div>
                <div className="text-blue-200 text-sm">
                  Cities
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-2 mb-6">
              {details.highlights.map((highlight) => (
                <span 
                  key={highlight}
                  className="px-3 py-1 bg-white/10 text-white rounded-full text-sm border border-white/20"
                >
                  {highlight}
                </span>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={`/${lang}/countries/${country.slug}`}
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors group"
            >
              Explore businesses in {country.name}
              <svg className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}