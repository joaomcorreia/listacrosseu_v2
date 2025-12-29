'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface City {
  id: number;
  name: string;
  slug: string;
  business_count: number;
}

interface Country {
  id: number;
  name: string;
  slug: string;
  business_count: number;
}

interface CountryWithCities {
  country: Country;
  cities: City[];
}

function formatBusinessCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(0) + 'K';
  }
  return count.toString();
}

async function fetchTopCities(): Promise<CountryWithCities[]> {
  const url = `${API_BASE_URL}/api/listings/cities/top/?limit_per_country=3&max_countries=12`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export default function TopCities() {
  const [data, setData] = useState<CountryWithCities[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopCities = async () => {
      try {
        const topCitiesData = await fetchTopCities();
        setData(topCitiesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching top cities:', error);
        setLoading(false);
      }
    };

    loadTopCities();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading top cities...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Top Cities by Business Activity
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover the most active European business cities across different countries.
            Each country shows its top 3 cities by number of registered businesses.
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((item) => (
            <a
              key={item.country.id}
              href={`/en/countries/${item.country.slug}`}
              className="group relative bg-gradient-to-br from-slate-50 to-emerald-50 rounded-lg p-4 hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-emerald-300"
            >
              {/* Country Flag Icon */}
              <div className="absolute top-3 right-3 text-xl opacity-60 group-hover:opacity-100 transition-opacity">
                🏙️
              </div>
              
              <div className="space-y-3">
                {/* Country Header */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                    {item.country.name}
                  </h3>
                  <p className="text-sm text-emerald-600 font-medium">
                    {formatBusinessCount(item.country.business_count)} businesses
                  </p>
                </div>
                
                {/* Top Cities */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Top Cities
                  </h4>
                  <div className="space-y-1.5">
                    {item.cities.map((city, index) => (
                      <div key={city.slug} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 truncate pr-2">
                          {city.name}
                        </span>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {formatBusinessCount(city.business_count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Explore cities</span>
                  <div className="text-emerald-600 group-hover:translate-x-1 transition-transform">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a 
            href="/en/cities" 
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Explore All Cities
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}