'use client';

import { BusinessHeader } from './BusinessHeader';
import { BusinessContent } from './BusinessContent';
import { PremiumSidebar } from './PremiumSidebar';
import { ListingAdsBlock } from './ListingAdsBlock';
import { ContactSection } from './ContactSection';

interface Business {
  id: number;
  name: string;
  slug: string;
  tier: 'free' | 'claimed' | 'premium';
  country?: {
    id: number;
    name: string;
    slug: string;
  };
  city?: {
    id: number;
    name: string;
    slug: string;
  };
  town?: {
    id: number;
    name: string;
    slug: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  address?: string;
  address_line1?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone?: string;
  description?: string;
  keywords?: string[];
  logo_url?: string;
  image_url?: string;
  premium_content?: string;
  premium_images?: string[];
  premium_sidebar?: {
    sidebar_highlight?: string;
    services?: string[];
    contact_email?: string;
    opening_hours?: string;
  };
}

interface BusinessDetailPageClientProps {
  business: Business;
  lang?: string;
}

export function BusinessDetailPageClient({ business, lang = 'en' }: BusinessDetailPageClientProps) {
  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'free':
        return {
          borderColor: 'border-gray-200',
          accentColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
      case 'claimed':
        return {
          borderColor: 'border-blue-200',
          accentColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'premium':
        return {
          borderColor: 'border-orange-200',
          accentColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
        };
      default:
        return {
          borderColor: 'border-gray-200',
          accentColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const tierStyles = getTierStyles(business.tier);

  return (
    <div className="min-h-screen bg-white">
      {/* Business Header */}
      <BusinessHeader business={business} tierStyles={tierStyles} />

      <div className="container mx-auto px-4 py-8">
        <div className={`grid gap-8 ${business.tier === 'premium' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Main Content */}
          <div className={business.tier === 'premium' ? 'lg:col-span-2' : 'w-full'}>
            <BusinessContent business={business} tierStyles={tierStyles} />

            {/* Ads Block for Free and Claimed */}
            {(business.tier === 'free' || business.tier === 'claimed') && (
              <div className="mt-8">
                <ListingAdsBlock />
              </div>
            )}

            {/* Premium Contact Section */}
            {business.tier === 'premium' && (
              <div className="mt-12">
                <ContactSection business={business} tierStyles={tierStyles} />
              </div>
            )}
          </div>

          {/* Premium Sidebar */}
          {business.tier === 'premium' && (
            <div className="lg:col-span-1">
              <PremiumSidebar business={business} tierStyles={tierStyles} />
              
              {/* Claimed indicator for claimed businesses */}
              {business.tier === 'claimed' && (
                <div className={`mt-6 p-4 rounded-lg border ${tierStyles.borderColor} ${tierStyles.bgColor}`}>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full bg-blue-500 mr-2`}></div>
                    <p className={`text-sm font-medium ${tierStyles.accentColor}`}>
                      This business is claimed
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: business.name,
            address: {
              "@type": "PostalAddress",
              addressCountry: business.country?.name,
              addressLocality: business.city?.name,
              ...(business.address_line1 && { streetAddress: business.address_line1 }),
              ...(business.postal_code && { postalCode: business.postal_code }),
            },
            ...(business.phone && { telephone: business.phone }),
            ...(business.website && { url: business.website }),
            ...(business.description && { description: business.description }),
            ...(business.latitude && business.longitude && {
              geo: {
                "@type": "GeoCoordinates",
                latitude: business.latitude,
                longitude: business.longitude,
              }
            }),
          }),
        }}
      />
    </div>
  );
}