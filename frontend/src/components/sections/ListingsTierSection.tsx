'use client';

import { useState, useEffect } from 'react';
import BusinessCard from '@/components/BusinessCard';
import ClaimBusinessModal from '@/components/ClaimBusinessModal';
import { useModal } from '@/hooks/useModal';
import { fetchBusinessesByTier, fetchSectionBusinessPicks, Business } from '@/lib/api/listings';
import { useTranslations } from '@/i18n/translations';
import { debugLog, debugWarn } from '@/lib/debug';

interface SectionSettings {
  source?: 'manual' | 'auto';
  limit?: number;
  layout?: 'grid' | 'columns';
  columns?: number;
}

interface Section {
  id: number;
  key: string;
  type: string;
  title?: string;
  subtitle?: string;
  settings: SectionSettings;
}

interface ListingsTierSectionProps {
  section: Section;
  tier: 'claimed' | 'premium' | 'free';
  lang?: string;
}

export default function ListingsTierSection({ section, tier, lang = 'en' }: ListingsTierSectionProps) {
  const t = useTranslations(lang);
  const formatText = (template: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
      template,
    );

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const claimModal = useModal();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true);
        setError(null);

        const settings = section.settings || {};
        const source = settings.source || 'manual';
        const limit = settings.limit || 6;

        let businessList: Business[] = [];
        
        if (source === 'manual') {
          // Fetch manually picked businesses for this section
          businessList = await fetchSectionBusinessPicks(section.id);
        } else {
          // Auto mode: get businesses by tier
          businessList = await fetchBusinessesByTier(tier, limit);
        }
        
        // Ensure we have an array and limit results
        if (!Array.isArray(businessList)) {
          debugWarn(`${tier} section: Expected array, got:`, typeof businessList);
          businessList = [];
        }
        
        setBusinesses(businessList.slice(0, limit));
        
        // Dev logging for debugging
        if (process.env.NODE_ENV === 'development') {
          debugLog(`[DEV] ${tier} section loaded: ${businessList.length} businesses (source: ${source})`);
        }
      } catch (err) {
        console.error(`Error fetching ${tier} listings:`, err);
        setError(formatText(t.home.listingsTier.errorBody, { tier }));
        
        // For development, provide more detailed error info
        if (process.env.NODE_ENV === 'development') {
          debugLog(`[DEV] ${tier} section error details:`, {
            error: err,
            sectionId: section.id,
            settings: section.settings,
            tier
          });
          setBusinesses([]); // Empty fallback for development
        }
      } finally {
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, [section, tier, t]);

  const gridClasses =
    tier === "premium"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : tier === "claimed"
        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        : "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4";

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
          <div className={gridClasses}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-64"></div>
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
              {formatText(t.home.listingsTier.errorBody, { tier })}
            </p>
            <p className="text-sm text-yellow-600 mt-1">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {section.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {section.title}
            </h2>
          )}
          <div className="text-center py-12">
            <p className="text-gray-600">
              {formatText(t.home.listingsTier.emptyTitle, { tier })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t.home.listingsTier.emptyHint}
            </p>
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
        
        {/* Tier-specific grid layout */}
        <div className={gridClasses}>
          {businesses.map((business) => (
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
      </div>
      <ClaimBusinessModal 
        isOpen={claimModal.isOpen} 
        onClose={claimModal.closeModal}
        business={(selectedBusiness as any) || undefined}
      />
    </section>
  );
}

