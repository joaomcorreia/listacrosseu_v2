'use client';

import { useState, useEffect } from 'react';
import BusinessCard from '@/components/BusinessCard';
import ClaimBusinessModal from '@/components/ClaimBusinessModal';
import { useModal } from '@/hooks/useModal';
import { fetchCountries, fetchBusinessesByLocation, Business, Country } from '@/lib/api/listings';

interface SectionSettings {
  source?: 'manual' | 'auto';
  limit?: number;
  layout?: 'grid' | 'columns';
  columns?: number;
  includeTiers?: string[];
  limitPerCountry?: number;
  maxCountries?: number;
}

interface Section {
  id: number;
  key: string;
  type: string;
  title?: string;
  subtitle?: string;
  settings: SectionSettings;
}

interface ListingsMixedSectionProps {
  section: Section;
  lang?: string;
}

interface CountryWithBusinesses {
  country: Country;
  businesses: Business[];
  loading: boolean;
  error: string | null;
}

export default function ListingsMixedSection({ section, lang = 'en' }: ListingsMixedSectionProps) {
  const [countriesWithBusinesses, setCountriesWithBusinesses] = useState<CountryWithBusinesses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const claimModal = useModal();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    async function fetchBusinessesByCountry() {
      try {
        setLoading(true);
        setError(null);

        const settings = section.settings || {};
        const limitPerCountry = settings.limitPerCountry || 6; // 6 businesses per country
        const maxCountries = settings.maxCountries || 10; // Maximum countries to show
        
        // First, fetch countries that have businesses
        const countries = await fetchCountries();
        
        // Take only the first maxCountries to avoid too many API calls
        const selectedCountries = countries.slice(0, maxCountries);
        
        // Initialize state with countries and empty businesses
        const initialState: CountryWithBusinesses[] = selectedCountries.map(country => ({
          country,
          businesses: [],
          loading: true,
          error: null
        }));
        setCountriesWithBusinesses(initialState);

        // Fetch businesses for each country in parallel
        const countryPromises = selectedCountries.map(async (country, index) => {
          try {
            const businessResult = await fetchBusinessesByLocation(
              country.slug,
              undefined,
              { limit: limitPerCountry }
            );
            
            return {
              index,
              businesses: businessResult.results || [],
              error: null
            };
          } catch (err) {
            console.error(`Error fetching businesses for ${country.name}:`, err);
            return {
              index,
              businesses: [],
              error: err instanceof Error ? err.message : 'Failed to load businesses'
            };
          }
        });

        // Wait for all country fetches to complete
        const results = await Promise.all(countryPromises);
        
        // Update state with the fetched businesses
        setCountriesWithBusinesses(prev => 
          prev.map((item, index) => {
            const result = results.find(r => r.index === index);
            return {
              ...item,
              businesses: result?.businesses || [],
              loading: false,
              error: result?.error || null
            };
          })
        );

        if (process.env.NODE_ENV === 'development') {
          const totalBusinesses = results.reduce((sum, r) => sum + r.businesses.length, 0);
          console.log(`[DEV] Country-grouped listings loaded: ${totalBusinesses} businesses across ${selectedCountries.length} countries`);
        }
      } catch (err) {
        console.error('Error fetching countries or businesses:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load businesses';
        setError(errorMessage);
        setCountriesWithBusinesses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBusinessesByCountry();
  }, [section]);

  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {section.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {section.title}
            </h2>
          )}
          {section.subtitle && (
            <p className="text-lg text-gray-600 mb-8">
              {section.subtitle}
            </p>
          )}
          
          {/* Loading skeleton for countries */}
          <div className="space-y-12">
            {[...Array(3)].map((_, countryIndex) => (
              <div key={countryIndex}>
                <div className="h-8 bg-gray-200 animate-pulse rounded mb-6 w-48"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {section.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {section.title}
            </h2>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Unable to load businesses at this time. Please try again later.
            </p>
            <p className="text-sm text-yellow-600 mt-1">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // Filter out countries with no businesses
  const countriesWithData = countriesWithBusinesses.filter(
    item => item.businesses.length > 0 || item.loading
  );

  if (countriesWithData.length === 0) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {section.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {section.title}
            </h2>
          )}
          <div className="text-center py-12">
            <p className="text-gray-600">No businesses found.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {section.title && (
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="text-lg text-gray-600 mb-8">
            {section.subtitle}
          </p>
        )}
        
        {/* Country-grouped listings */}
        <div className="space-y-12">
          {countriesWithData.map((countryData) => (
            <div key={countryData.country.id}>
              {/* Country header with flag emoji */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">
                  {getCountryFlag(countryData.country.slug)}
                </span>
                {countryData.country.name}
              </h2>
              
              {/* Country businesses */}
              {countryData.loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
                  ))}
                </div>
              ) : countryData.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    Unable to load businesses for {countryData.country.name}.
                  </p>
                </div>
              ) : countryData.businesses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {countryData.businesses.map((business) => (
                    <BusinessCard 
                      key={business.id} 
                      business={business as any} 
                      lang={lang}
                      onClaim={() => {
                        setSelectedBusiness(business);
                        claimModal.openModal();
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <ClaimBusinessModal 
        isOpen={claimModal.isOpen} 
        onClose={claimModal.closeModal}
        business={(selectedBusiness as any) || undefined}
        onSubmit={async (data) => {
          console.log('Demo claim submission:', data);
          alert(`Demo: Claim submitted for ${data.business_name}! In production, this would process the claim request.`);
        }}
      />
    </section>
  );
}

// Helper function to get country flag emoji based on country slug
function getCountryFlag(countrySlug: string): string {
  const flagMap: Record<string, string> = {
    'pt': '🇵🇹', // Portugal
    'es': '🇪🇸', // Spain  
    'fr': '🇫🇷', // France
    'it': '🇮🇹', // Italy
    'de': '🇩🇪', // Germany
    'nl': '🇳🇱', // Netherlands
    'be': '🇧🇪', // Belgium
    'at': '🇦🇹', // Austria
    'ch': '🇨🇭', // Switzerland
    'lu': '🇱🇺', // Luxembourg
    'dk': '🇩🇰', // Denmark
    'se': '🇸🇪', // Sweden
    'no': '🇳🇴', // Norway
    'fi': '🇫🇮', // Finland
    'is': '🇮🇸', // Iceland
    'ie': '🇮🇪', // Ireland
    'gb': '🇬🇧', // United Kingdom
    'pl': '🇵🇱', // Poland
    'cz': '🇨🇿', // Czech Republic
    'sk': '🇸🇰', // Slovakia
    'hu': '🇭🇺', // Hungary
    'si': '🇸🇮', // Slovenia
    'hr': '🇭🇷', // Croatia
    'bg': '🇧🇬', // Bulgaria
    'ro': '🇷🇴', // Romania
    'gr': '🇬🇷', // Greece
    'cy': '🇨🇾', // Cyprus
    'mt': '🇲🇹', // Malta
    'ee': '🇪🇪', // Estonia
    'lv': '🇱🇻', // Latvia
    'lt': '🇱🇹', // Lithuania
  };
  
  return flagMap[countrySlug] || '🏳️';
}