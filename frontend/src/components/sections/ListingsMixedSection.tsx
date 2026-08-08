'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import BusinessCard from '@/components/BusinessCard';
import ClaimBusinessModal from '@/components/ClaimBusinessModal';
import { useModal } from '@/hooks/useModal';
import { fetchCountries, fetchBusinessesByLocation, Business, Country } from '@/lib/api/listings';
import { useTranslations } from '@/i18n/translations';
import AdPlaceholder from '@/components/ads/AdPlaceholder';
import { debugLog } from '@/lib/debug';

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
  const t = useTranslations(lang);
  const formatText = (template: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
      template,
    );

  const [countriesWithBusinesses, setCountriesWithBusinesses] = useState<CountryWithBusinesses[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKey = useRef<string | null>(null);
  
  // Modal state
  const claimModal = useModal();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const premiumOnly =
    (section.settings?.includeTiers?.length || 0) === 1 &&
    section.settings?.includeTiers?.[0] === "premium";
  // Mixed sections include every tier. Premium-only display remains available
  // when the CMS explicitly sets includeTiers to ["premium"].
  const premiumOnlySection = premiumOnly;

  const limitPerCountry = useMemo(
    () => section.settings?.limitPerCountry || 10,
    [section.settings?.limitPerCountry]
  );
  const maxCountries = useMemo(
    () => section.settings?.maxCountries || 10,
    [section.settings?.maxCountries]
  );

  useEffect(() => {
    let cancelled = false;
    const fetchKey = `${section.id}-${limitPerCountry}-${maxCountries}-${lang}`;
    if (lastFetchKey.current === fetchKey) {
      return;
    }
    lastFetchKey.current = fetchKey;

    async function fetchBusinessesByCountry() {
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch countries that have businesses
        const countries = await fetchCountries();
        
        // Premium-only homepage section must show all countries that have premium listings.
        const selectedCountries = premiumOnlySection
          ? countries
          : countries.slice(0, maxCountries);
        
        // Initialize state with countries and empty businesses
        const initialState: CountryWithBusinesses[] = selectedCountries.map(country => ({
          country,
          businesses: [],
          loading: true,
          error: null
        }));
        if (!cancelled) {
          setCountriesWithBusinesses(initialState);
        }

        // Fetch businesses for each country in parallel
        const countryPromises = selectedCountries.map(async (country, index) => {
          try {
            const businessResult = await fetchBusinessesByLocation(
              country.slug,
              undefined,
              premiumOnlySection ? { limit: limitPerCountry, tier: "premium" } : { limit: limitPerCountry }
            );

            const rawBusinesses = businessResult.results || [];
            const premiumBusinesses = premiumOnlySection
              ? rawBusinesses.filter((business) => getBusinessTier(business) === "premium")
              : rawBusinesses;

            return {
              index,
              businesses: premiumBusinesses,
              error: null
            };
          } catch (err) {
            console.warn(`Country listings failed for ${country.name}:`, err);
            return {
              index,
              businesses: [],
              error: formatText(t.home.listingsMixed.errorCountry, { country: country.name })
            };
          }
        });

        // Wait for all country fetches to complete
        const settled = await Promise.allSettled(countryPromises);
        const results = settled.map((item, idx) => {
          if (item.status === "fulfilled") {
            return item.value;
          }
          console.warn(`Country listings promise rejected for ${selectedCountries[idx]?.name || "unknown"}`, item.reason);
          return {
            index: idx,
            businesses: [],
            error: formatText(t.home.listingsMixed.errorCountry, { country: selectedCountries[idx]?.name || "Unknown" })
          };
        });
        
        // Update state with the fetched businesses
        if (!cancelled) {
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
        }

        if (process.env.NODE_ENV === 'development') {
          const totalBusinesses = results.reduce((sum, r) => sum + r.businesses.length, 0);
          debugLog(`[DEV] Country-grouped listings loaded: ${totalBusinesses} businesses across ${selectedCountries.length} countries`);
        }
      } catch (err) {
        console.error('Error fetching countries or businesses:', err);
        if (!cancelled) {
          setError(t.home.listingsMixed.errorBody);
          setCountriesWithBusinesses([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBusinessesByCountry();
    return () => {
      cancelled = true;
    };
  }, [section.id, limitPerCountry, maxCountries, lang]);

  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
        <div className="mx-auto max-w-7xl px-4">
          {section.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {section.title}
            </h2>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              {t.home.listingsMixed.errorBody}
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
        <div className="mx-auto max-w-7xl px-4">
          {(section.title || premiumOnlySection) && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {premiumOnlySection ? t.home.listingsMixed.premiumTitle : section.title}
            </h2>
          )}
          <div className="text-center py-12">
            <p className="text-gray-600">
              {premiumOnlySection ? t.home.listingsMixed.premiumEmpty : t.home.listingsMixed.empty}
            </p>
            {premiumOnlySection && (
              <div className="mt-6">
                <a
                  href={`/${lang}/pricing`}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t.home.listingsMixed.premiumCta}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
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
          {countriesWithData.map((countryData, index) => (
            <div key={countryData.country.id} className="space-y-8">
              {/* Country header with country code */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-2xl mr-3">
                  {getCountryFlag(countryData.country.slug)}
                </span>
                {countryData.country.name}
              </h2>
              
              {/* Country businesses */}
              {countryData.loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
                  ))}
                </div>
              ) : countryData.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">
                    {formatText(t.home.listingsMixed.errorCountry, { country: countryData.country.name })}
                  </p>
                </div>
              ) : countryData.businesses.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {(premiumOnlySection
                    ? countryData.businesses
                    : selectBusinessesForCountry(countryData.businesses)
                  ).map((business) => (
                    <div
                      key={business.id}
                      className={getBusinessTier(business) === "premium" ? "lg:col-span-2" : ""}
                    >
                      <BusinessCard 
                        business={business as any} 
                        lang={lang}
                        onClaim={() => {
                          setSelectedBusiness(business);
                          claimModal.openModal();
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {(index + 1) % 2 === 0 && index < countriesWithData.length - 1 && (
                <div className="py-8">
                  <div className="mx-auto max-w-4xl px-4">
                    <AdPlaceholder variant="banner" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ClaimBusinessModal 
        isOpen={claimModal.isOpen} 
        onClose={claimModal.closeModal}
        business={(selectedBusiness as any) || undefined}
      />
    </section>
  );
}

// Helper function to get a short country label based on country slug
function getCountryFlag(countrySlug: string): string {
  const code = (countrySlug || "").toUpperCase();
  return code.length > 2 ? code.slice(0, 2) : code;
}

function getBusinessTier(business: Business): string {
  return (business.tier || (business as any).plan_type || "free").toString();
}

function selectBusinessesForCountry(businesses: Business[]): Business[] {
  const tiered = businesses.map((business) => ({
    business,
    tier: getBusinessTier(business),
  }));

  const premiums = tiered
    .filter((item) => item.tier === "premium")
    .slice(0, 3)
    .map((item) => item.business);

  const claimed = tiered
    .filter((item) => item.tier === "claimed")
    .map((item) => item.business);

  const free = tiered
    .filter((item) => item.tier !== "premium" && item.tier !== "claimed")
    .map((item) => item.business);

  const combined = [...premiums, ...claimed, ...free];
  return combined.slice(0, 10);
}

