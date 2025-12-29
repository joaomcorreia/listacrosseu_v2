'use client';

import { useState, useEffect } from 'react';
import BusinessCard from '@/components/BusinessCard';
import ClaimBusinessModal from '@/components/ClaimBusinessModal';
import { useModal } from '@/hooks/useModal';
import { fetchBusinessesByTier, fetchSectionBusinessPicks, Business } from '@/lib/api/listings';

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
  tier: 'claimed' | 'premium';
  lang?: string;
}

export default function ListingsTierSection({ section, tier, lang = 'en' }: ListingsTierSectionProps) {
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
          console.warn(`${tier} section: Expected array, got:`, typeof businessList);
          businessList = [];
        }
        
        setBusinesses(businessList.slice(0, limit));
        
        // Dev logging for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] ${tier} section loaded: ${businessList.length} businesses (source: ${source})`);
        }
      } catch (err) {
        console.error(`Error fetching ${tier} listings:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load businesses';
        setError(errorMessage);
        
        // For development, provide more detailed error info
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] ${tier} section error details:`, {
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
  }, [section, tier]);

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              Unable to load {tier} businesses at this time. Please try again later.
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
              No {tier} businesses have been selected for this section yet.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Configure this section in the admin panel to select businesses.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Use grid layout for tier-specific sections (claimed/premium)
  const settings = section.settings || {};
  const columns = settings.columns || 3;
  
  const gridClass = `grid gap-6 ${
    columns === 2 ? 'sm:grid-cols-2' : 
    columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' :
    'sm:grid-cols-2 lg:grid-cols-3' // default 3 columns
  }`;

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
        
        {/* Grid layout for tier sections - consistent heights */}
        <div className={gridClass}>
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
        onSubmit={async (data) => {
          console.log('Demo claim submission:', data);
          alert(`Demo: Claim submitted for ${data.business_name}! In production, this would process the claim request.`);
        }}
      />
    </section>
  );
}