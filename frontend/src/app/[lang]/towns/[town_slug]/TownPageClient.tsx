'use client';

import { useState, useCallback } from 'react';
import { MapPin, Building2, Users, ChevronRight, Search } from 'lucide-react';
import BusinessCard from '@/components/BusinessCard';
import ClaimBusinessModal from '@/components/ClaimBusinessModal';
import { useModal } from '@/hooks/useModal';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Town {
  id: number;
  name: string;
  slug: string;
  city: {
    id: number;
    name: string;
    slug: string;
    country: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

interface Business {
  id: number;
  name: string;
  slug: string;
  country?: {
    id: number;
    name: string;
    slug: string;
  };
  city?: {
    id: number;
    name: string;
    slug: string;
    country: {
      id: number;
      name: string;
      slug: string;
    };
  };
  town?: {
    id: number;
    name: string;
    slug: string;
    city: {
      id: number;
      name: string;
      slug: string;
      country: {
        id: number;
        name: string;
        slug: string;
      };
    };
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  address?: string;
  address_line1?: string;
  postal_code?: string;
  website?: string;
  phone?: string;
  description?: string;
  keywords?: string[];
  tier?: 'free' | 'claimed' | 'premium';
  is_micro?: boolean;
  employee_count?: number;
}

interface BusinessesResponse {
  town: Town;
  businesses: Business[];
  total_count: number;
  has_more: boolean;
}

interface TownPageClientProps {
  townData: Town;
  initialBusinessesData: BusinessesResponse | null;
  townSlug: string;
}

export default function TownPageClient({
  townData,
  initialBusinessesData,
  townSlug
}: TownPageClientProps) {
  const [businesses, setBusinesses] = useState<Business[]>(
    initialBusinessesData?.businesses || []
  );
  const [totalCount, setTotalCount] = useState(
    initialBusinessesData?.total_count || 0
  );
  
  // Modal state
  const claimModal = useModal();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [hasMore, setHasMore] = useState(
    initialBusinessesData?.has_more || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Cities', href: '/cities' },
    { 
      label: townData.city.country.name, 
      href: `/countries/${townData.city.country.slug}` 
    },
    { 
      label: townData.city.name, 
      href: `/cities/${townData.city.slug}` 
    },
    { label: townData.name }
  ];

  // Load more businesses
  const loadMoreBusinesses = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/geo/towns/${townSlug}/businesses/?limit=20&offset=${businesses.length}`
      );
      
      if (response.ok) {
        const data: BusinessesResponse = await response.json();
        setBusinesses(prev => [...prev, ...data.businesses]);
        setHasMore(data.has_more);
      }
    } catch (error) {
      console.error('Failed to load more businesses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [townSlug, businesses.length, hasMore, isLoading]);

  // Filter businesses based on search term
  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.keywords?.some(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle business claim (using new modal system)
  const handleClaimBusiness = (business: Business) => {
    setSelectedBusiness(business);
    claimModal.openModal();
  };

  const tierOrder: Record<string, number> = { premium: 0, claimed: 1, free: 2 };
  const sortedBusinesses = [...filteredBusinesses].sort(
    (a, b) =>
      (tierOrder[a.tier ?? "free"] ?? 2) - (tierOrder[b.tier ?? "free"] ?? 2)
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-700 text-white py-12">
          <div className="container mx-auto px-4">
            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumbs items={breadcrumbItems} variant="dark" />
            </div>
            
            <div className="flex flex-col md:flex-row items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Businesses in {townData.name}
                </h1>
                <p className="text-green-100 text-lg mb-6">
                  {townData.city.name}, {townData.city.country.name} • Discover local businesses and services
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center bg-green-500 bg-opacity-30 px-3 py-2 rounded-lg">
                    <Building2 className="w-4 h-4 mr-2" />
                    {totalCount} businesses
                  </div>
                  <div className="flex items-center bg-green-500 bg-opacity-30 px-3 py-2 rounded-lg">
                    <MapPin className="w-4 h-4 mr-2" />
                    {townData.name}, {townData.city.name}, {townData.city.country.name}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 md:mt-0">
                <button
                  onClick={() => {
                    setSelectedBusiness(null);
                    claimModal.openModal();
                  }}
                  className="bg-white text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors inline-flex items-center"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Your Business
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            {searchTerm && (
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredBusinesses.length} of {totalCount} businesses
              </div>
            )}
          </div>

          {/* Business Grid - Using CSS columns for mixed heights */}
          {filteredBusinesses.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                {sortedBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className={business.tier === "premium" ? "col-span-2" : ""}
                  >
                    <BusinessCard
                      business={business as any}
                      onClaim={() => {
                        setSelectedBusiness(business);
                        claimModal.openModal();
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {!searchTerm && hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMoreBusinesses}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 inline-flex items-center"
                  >
                    {isLoading ? 'Loading...' : 'Load More Businesses'}
                    {!isLoading && <ChevronRight className="w-4 h-4 ml-2" />}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No businesses found' : 'No businesses yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No businesses match "${searchTerm}". Try a different search term.`
                  : `Be the first to add a business in ${townData.name}.`
                }
              </p>
              <button
                onClick={() => {
                  setSelectedBusiness(null);
                  claimModal.openModal();
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Add Your Business
              </button>
            </div>
          )}
        </div>

        {/* Claim Business Modal */}
        <ClaimBusinessModal
          business={(selectedBusiness as any) || undefined}
          isOpen={claimModal.isOpen}
          onClose={claimModal.closeModal}
        />
      </div>
    </Layout>
  );
}
