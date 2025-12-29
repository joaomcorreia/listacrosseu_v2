'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Globe, ChevronRight, Tag } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import ListingFlowModal from './modals/ListingFlowModal';

interface Business {
  id: number;
  name: string;
  slug: string;
  tier?: 'free' | 'claimed' | 'premium';
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
  is_micro?: boolean;
  employee_count?: number;
}

interface BusinessCardProps {
  business: Business;
  onClaim?: () => void;
  onViewDetails?: () => void;
  lang?: string;
}

// Main BusinessCard Router - Single source of truth for tier-based rendering
export default function BusinessCard({ business, onClaim, lang }: BusinessCardProps) {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [modalStartStep, setModalStartStep] = useState<'claim' | 'premium'>('claim');
  
  // Tier safety: default to "free" if not set
  const tier = business.tier ?? "free";
  
  const handleClaimClick = () => {
    setModalStartStep('claim');
    openModal();
  };
  
  const handleViewDetailsClick = () => {
    console.log('View Details clicked!', { tier, lang });
    if (tier === 'premium') {
      // Navigate to premium preview page for premium businesses
      const currentLang = lang || 'en';
      console.log('Navigating to:', `/${currentLang}/premium-preview`);
      router.push(`/${currentLang}/premium-preview`);
    } else {
      // Open modal for claimed businesses  
      console.log('Opening modal for claimed business');
      setModalStartStep('claim');
      openModal();
    }
  };

  // Convert business format for modal
  const modalBusiness = {
    id: business.id.toString(),
    slug: business.slug,
    name: business.name,
    description: business.description,
    category: business.category,
    city: business.city,
    town: business.town,
    country: business.country,
    address: business.address || business.address_line1,
    phone: business.phone,
    website: business.website,
    keywords: business.keywords,
    is_premium: tier === 'premium',
    tier: tier,
  };

  const renderCard = () => {
    // Strict tier routing - NO implicit conditions (no logo, initials, etc.)
    switch (tier) {
      case "premium":
        return <PremiumBusinessCard business={business} onClaim={onClaim} onViewDetails={handleViewDetailsClick} />;
      case "claimed":
        return <ClaimedBusinessCard business={business} onClaim={onClaim} onViewDetails={handleViewDetailsClick} />;
      default:
        return <FreeBusinessCard business={business} onClaim={onClaim || handleClaimClick} />;
    }
  };

  return (
    <div className="relative">
      {/* DEBUG MARKER */}
      <div className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-2 py-1 rounded z-10">
        CARD-DEBUG-A
      </div>
      {renderCard()}
      <ListingFlowModal
        open={isOpen}
        onClose={closeModal}
        lang={lang || "en"}
        business={modalBusiness}
        startStep={modalStartStep}
      />
    </div>
  );
}

// 🟢 FREE Business Card - Compact, GRATIS badge, Claim button
function FreeBusinessCard({ business, onClaim }: BusinessCardProps) {
  const [imageError, setImageError] = useState(false);
  const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name)}&size=400&background=f3f4f6&color=374151&format=png`;

  const getLocationString = () => {
    const parts = [];
    if (business.town) parts.push(business.town.name);
    if (business.city) parts.push(business.city.name);
    if (business.country) parts.push(business.country.name);
    return parts.join(', ');
  };

  const getAddress = () => {
    if (business.address_line1) {
      const parts = [business.address_line1];
      if (business.postal_code) parts.push(business.postal_code);
      return parts.join(', ');
    }
    return business.address || '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border">
      {/* FREE Card - Compact Layout (NO big image area) */}
      <div className="p-4">
        {/* Top Row: Business name + GRATIS badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1 pr-2">
            {business.name}
          </h3>
          <div className="flex flex-col gap-1 flex-shrink-0">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              GRATIS
            </span>
            {business.is_micro && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                Micro Business
              </span>
            )}
          </div>
        </div>
        {/* Meta: Category + City/Country */}
        <div className="space-y-2 mb-3">
          {business.category && (
            <div className="flex items-center text-sm text-blue-600">
              <Tag className="w-4 h-4 mr-1" />
              <span>{business.category.name}</span>
            </div>
          )}
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
            <div>{getLocationString()}</div>
          </div>
        </div>



        {/* Keywords - Max 3 for compact layout */}
        {business.keywords && business.keywords.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {business.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Claim Button - Green for FREE tier */}
        <div className="mt-3">
          <button
            onClick={() => {
              console.log('🟢 FREE TIER CLAIM BUTTON CLICKED - Component rendered correctly!');
              console.log('Business ID:', business.id, 'Name:', business.name);
              onClaim();
            }}
            className="w-full bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-green-700 transition-colors inline-flex items-center justify-center"
          >
            Claim this business
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔵 CLAIMED Business Card - Enhanced layout, no GRATIS badge
function ClaimedBusinessCard({ business, onClaim, onViewDetails }: BusinessCardProps) {
  const [imageError, setImageError] = useState(false);
  const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name)}&size=400&background=f3f4f6&color=374151&format=png`;

  const getLocationString = () => {
    const parts = [];
    if (business.town) parts.push(business.town.name);
    if (business.city) parts.push(business.city.name);
    if (business.country) parts.push(business.country.name);
    return parts.join(', ');
  };

  const getAddress = () => {
    if (business.address_line1) {
      const parts = [business.address_line1];
      if (business.postal_code) parts.push(business.postal_code);
      return parts.join(', ');
    }
    return business.address || '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-blue-200 ring-1 ring-blue-100">
      {/* Optional small avatar/icon area for CLAIMED */}
      <div className="h-24 bg-gray-100 relative flex items-center justify-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2h8z" clipRule="evenodd"/>
          </svg>
        </div>
        {/* Claimed Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
            CLAIMED
          </span>
        </div>
      </div>

      {/* Business Content */}
      <div className="p-4">
        {/* Business name */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
          {business.name}
        </h3>

        {/* City + Country */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{business.city?.name && business.country?.name ? `${business.city.name}, ${business.country.name}` : getLocationString()}</span>
        </div>

        {/* Location (town OR shopping center) - show only if present */}
        {business.town && (
          <div className="text-sm text-gray-500 mb-2">
            📍 {business.town.name}
          </div>
        )}



        {/* Small description (1-2 lines) */}
        {business.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {business.description}
          </p>
        )}

        {/* View Details Button - Blue for CLAIMED tier */}
        <div>
          <button
            onClick={() => {
              console.log('🔵 CLAIMED TIER VIEW DETAILS CLICKED - Component rendered correctly!');
              console.log('Business ID:', business.id, 'Name:', business.name);
              onViewDetails();
            }}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 🟣 PREMIUM Business Card - Rich layout with large header
function PremiumBusinessCard({ business, onClaim, onViewDetails }: BusinessCardProps) {
  const [imageError, setImageError] = useState(false);
  const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(business.name)}&size=400&background=f3f4f6&color=374151&format=png`;

  const getLocationString = () => {
    const parts = [];
    if (business.town) parts.push(business.town.name);
    if (business.city) parts.push(business.city.name);
    if (business.country) parts.push(business.country.name);
    return parts.join(', ');
  };

  const getAddress = () => {
    if (business.address_line1) {
      const parts = [business.address_line1];
      if (business.postal_code) parts.push(business.postal_code);
      return parts.join(', ');
    }
    return business.address || '';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-2 border-orange-200 ring-2 ring-orange-100">
      {/* Image placeholder area (1 image) */}
      <div className="h-56 bg-gray-100 relative">
        {(business as any).image_url ? (
          <img
            src={(business as any).image_url}
            alt={business.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="text-center">
              <svg className="w-16 h-16 text-orange-300 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              </svg>
              <p className="text-orange-400 text-sm font-medium">Premium Image</p>
            </div>
          </div>
        )}
        
        {/* Optional logo placeholder - small corner */}
        {(business as any).logo_url && (
          <div className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center">
            <img
              src={(business as any).logo_url}
              alt={`${business.name} logo`}
              className="w-10 h-10 object-contain"
            />
          </div>
        )}
        
        {/* Premium Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
            PREMIUM
          </span>
          {business.is_micro && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              Micro Business
            </span>
          )}
        </div>
      </div>

      {/* Business Content - Rich */}
      <div className="p-5">
        {/* Large Business Name Header */}
        <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2">
          {business.name}
        </h3>

        {/* Category */}
        {business.category && (
          <div className="flex items-center text-sm text-blue-600 mb-3">
            <Tag className="w-4 h-4 mr-1" />
            <span className="font-medium">{business.category.name}</span>
          </div>
        )}

        {/* Location */}
        <div className="flex items-start text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">{getLocationString()}</div>
            {getAddress() && (
              <div className="text-xs text-gray-500 mt-1">{getAddress()}</div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {business.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <a href={`tel:${business.phone}`} className="hover:text-blue-600 font-medium">
                {business.phone}
              </a>
            </div>
          )}
          {business.website && (
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 truncate font-medium"
              >
                {business.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
              </a>
            </div>
          )}
        </div>

        {/* Keywords */}
        {business.keywords && business.keywords.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {business.keywords.slice(0, 5).map((keyword, index) => (
                <span
                  key={index}
                  className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full font-medium"
                >
                  {keyword}
                </span>
              ))}
              {business.keywords.length > 5 && (
                <span className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
                  +{business.keywords.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {business.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {business.description}
          </p>
        )}

        {/* Employee Count */}
        {business.employee_count && (
          <div className="text-xs text-gray-500 mb-4">
            <span className="font-medium">{business.employee_count} employees</span>
          </div>
        )}
        {/* View Details Button - Orange for PREMIUM tier */}
        <div>
          <button
            onClick={() => {
              console.log('🟠 PREMIUM TIER VIEW DETAILS CLICKED - Component rendered correctly!');
              console.log('Business ID:', business.id, 'Name:', business.name);
              onViewDetails();
            }}
            className="w-full bg-orange-600 text-white text-sm font-bold py-3 px-4 rounded-md hover:bg-orange-700 transition-colors inline-flex items-center justify-center"
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}