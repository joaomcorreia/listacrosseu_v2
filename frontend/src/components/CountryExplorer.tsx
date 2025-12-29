'use client';

import { useState, useEffect } from 'react';
import { fetchCountries, fetchCategories } from '@/lib/api/listings';

// Add CSS animation for progress bar
const progressAnimation = `
  .progress-bar {
    width: 0%;
    animation: progress 3s linear infinite;
  }
  
  @keyframes progress {
    0% { width: 0%; }
    100% { width: 100%; }
  }
`;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface CountryWithCount {
  id: number;
  name: string;
  slug: string;
  code: string;
  business_count: number;
  color: string;
}

interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  business_count: number;
}

const countryColors: { [key: string]: string } = {
  'AT': 'from-red-400 to-red-500',
  'DE': 'from-blue-400 to-blue-500',
  'FR': 'from-blue-400 to-blue-500',
  'IT': 'from-green-400 to-green-500',
  'ES': 'from-red-400 to-red-500',
  'PL': 'from-red-400 to-red-500',
  'NL': 'from-orange-400 to-orange-500',
  'BE': 'from-yellow-400 to-yellow-500',
  'PT': 'from-green-400 to-green-500',
  'SE': 'from-blue-400 to-blue-500',
  'DK': 'from-red-400 to-red-500',
  'FI': 'from-blue-400 to-blue-500',
  'CZ': 'from-blue-400 to-blue-500',
  'HU': 'from-green-400 to-green-500',
  'SK': 'from-blue-400 to-blue-500',
  'SI': 'from-blue-400 to-blue-500',
  'HR': 'from-red-400 to-red-500',
  'BG': 'from-green-400 to-green-500',
  'RO': 'from-blue-400 to-blue-500',
  'LT': 'from-yellow-400 to-yellow-500',
  'LV': 'from-red-400 to-red-500',
  'EE': 'from-blue-400 to-blue-500',
  'CY': 'from-orange-400 to-orange-500',
  'MT': 'from-red-400 to-red-500',
  'LU': 'from-blue-400 to-blue-500',
  'IE': 'from-green-400 to-green-500',
  'GR': 'from-blue-400 to-blue-500',
};

const categoryIcons: { [key: string]: string } = {
  'restaurants': '🍽️',
  'retail': '🛍️',
  'services': '🔧',
  'healthcare': '🏥',
  'beauty': '💄',
  'automotive': '🚗',
  'construction': '🏗️',
  'technology': '💻',
  'education': '📚',
  'entertainment': '🎭',
  'legal': '⚖️',
  'real estate': '🏠',
  'fitness': '💪',
  'travel': '✈️',
  'agriculture': '🌾',
  'logistics': '📦',
  'manufacturing': '🏭',
  'finance': '💰',
  'fashion': '👗',
  'tourism': '🗺️',
};

function formatBusinessCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(0) + 'K';
  }
  return count.toString();
}



// Helper function to fetch categories with business counts for a specific country
async function fetchCategoriesWithCounts(countrySlug: string): Promise<CategoryWithCount[]> {
  const url = `${API_BASE_URL}/api/listings/categories/?country=${encodeURIComponent(countrySlug)}&global_top=true`;
  
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

export default function CountryExplorer() {
  const [countries, setCountries] = useState<CountryWithCount[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryWithCount | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const countriesData = await fetchCountries();
        const countriesWithColors = countriesData.map((country: any) => {
          // Use the actual country code from the API if available, otherwise derive from slug
          let countryCode = country.code;
          
          // Fallback if code is missing - derive from slug or name
          if (!countryCode) {
            if (country.slug) {
              countryCode = country.slug.toUpperCase();
            } else if (country.name) {
              // Map common country names to codes
              const countryNameToCode: { [key: string]: string } = {
                'austria': 'AT',
                'germany': 'DE',
                'france': 'FR',
                'italy': 'IT',
                'spain': 'ES',
                'poland': 'PL',
                'netherlands': 'NL',
                'belgium': 'BE',
                'portugal': 'PT',
                'sweden': 'SE',
                'denmark': 'DK',
                'finland': 'FI',
                'czech republic': 'CZ',
                'hungary': 'HU',
                'slovakia': 'SK',
                'slovenia': 'SI',
                'croatia': 'HR',
                'bulgaria': 'BG',
                'romania': 'RO',
                'lithuania': 'LT',
                'latvia': 'LV',
                'estonia': 'EE',
                'cyprus': 'CY',
                'malta': 'MT',
                'luxembourg': 'LU',
                'ireland': 'IE',
                'greece': 'GR'
              };
              countryCode = countryNameToCode[country.name.toLowerCase()] || country.name.substring(0, 2).toUpperCase();
            } else {
              countryCode = 'XX';
            }
          }
          
          return {
            ...country,
            code: countryCode,
            business_count: country.business_count || 0,
            color: countryColors[countryCode] || 'from-gray-400 to-gray-500'
          };
        });
        setCountries(countriesWithColors);
        
        // Set Germany as default selection if available, otherwise first country
        if (countriesWithColors.length > 0) {
          const germany = countriesWithColors.find(c => c.name === 'Germany');
          const initialCountry = germany || countriesWithColors[0];
          setSelectedCountry(initialCountry);
          setCurrentIndex(countriesWithColors.indexOf(initialCountry));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching countries:', error);
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  // Fetch categories when selected country changes
  useEffect(() => {
    if (selectedCountry) {
      const loadCategories = async () => {
        setCategoriesLoading(true);
        try {
          // Add a small delay to make the transition smoother
          await new Promise(resolve => setTimeout(resolve, 100));
          // Use country slug for filtering instead of derived code
          const categoriesData = await fetchCategoriesWithCounts(selectedCountry.slug);
          setCategories(categoriesData.slice(0, 5)); // Show top 5 categories
        } catch (error) {
          console.error('Error fetching categories:', error);
          setCategories([]);
        }
        setCategoriesLoading(false);
      };

      loadCategories();
    }
  }, [selectedCountry]);

  // Auto-cycling effect
  useEffect(() => {
    if (!isAutoPlaying || countries.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % Math.min(countries.length, 16); // Cycle through first 16 countries
        setSelectedCountry(countries[nextIndex]);
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [countries, isAutoPlaying]);

  const handleCountrySelect = (country: CountryWithCount) => {
    setIsAutoPlaying(false); // Pause auto-cycling when user manually selects
    setSelectedCountry(country);
    setCurrentIndex(countries.indexOf(country));
    
    // Resume auto-cycling after 10 seconds of no interaction
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading countries...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <style jsx>{progressAnimation}</style>
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Explore European Markets
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover businesses across all 27 EU member states. From bustling metropolises to charming local
            markets, connect with the heart of European commerce.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Countries Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">
                Select a Country to Explore
              </h3>
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {isAutoPlaying ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                    </svg>
                    Play
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {countries.slice(0, 16).map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`rounded-lg p-4 text-center hover:shadow-md transition-all duration-500 border-2 relative overflow-hidden ${
                    selectedCountry?.code === country.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  {/* Auto-play progress indicator */}
                  {selectedCountry?.code === country.code && isAutoPlaying && (
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 progress-bar"></div>
                  )}
                
                  <div className={`text-2xl font-bold mb-1 ${
                    selectedCountry?.code === country.code ? 'text-blue-600' : 'text-slate-900'
                  }`}>
                    {country.code}
                  </div>
                  <div className={`font-medium ${
                    selectedCountry?.code === country.code ? 'text-blue-700' : 'text-slate-700'
                  }`}>
                    {country.name}
                  </div>
                  <div className={`text-sm ${
                    selectedCountry?.code === country.code ? 'text-blue-600' : 'text-slate-500'
                  }`}>
                    {formatBusinessCount(country.business_count)}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <a href="/en/countries" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                View All {countries.length} EU Countries
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Selected Country Display */}
          <div className="lg:col-span-1">
            {selectedCountry && (
              <div className={`bg-gradient-to-br ${selectedCountry.color} rounded-xl p-6 text-white shadow-lg transition-all duration-700 ease-in-out`}>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{selectedCountry.code}</div>
                  <h4 className="text-xl font-semibold mb-2">{selectedCountry.name}</h4>
                  <p className="text-white/90 mb-4">
                    {formatBusinessCount(selectedCountry.business_count)} Registered Businesses
                  </p>
                  <a 
                    href={`/en/countries/${selectedCountry.code}`} 
                    className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors border border-white/30"
                  >
                    Explore {selectedCountry.name} →
                  </a>
                </div>
              </div>
            )}

            {/* Popular Categories for Selected Country */}
            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-4">Popular Business Categories</h4>
              
              <div className="h-[360px] transition-all duration-300 ease-in-out overflow-hidden">
                {categoriesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-slate-600">Loading categories...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col transition-all duration-300 ease-in-out opacity-100">
                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {categories.map((category) => {
                        const icon = categoryIcons[category.name?.toLowerCase() || ''] || categoryIcons[category.slug || ''] || '📊';
                        
                        return (
                          <a
                            key={category.id}
                            href={`/en/categories/${category.slug}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group min-h-[56px]"
                          >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <span className="text-purple-600">{icon}</span>
                          </div>
                          <span className="font-medium text-slate-700 group-hover:text-slate-900">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900">
                            {formatBusinessCount(category.business_count || 0)} businesses
                          </div>
                          <div className="text-xs text-slate-500">
                            in {selectedCountry?.name}
                          </div>
                        </div>
                      </a>
                          );
                        })}
                        
                        {categories.length === 0 && (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-slate-500 text-center">No categories data available for this country</p>
                          </div>
                        )}
                      </div>
                    </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <a href="/en/categories" className="inline-flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Browse All Categories
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}