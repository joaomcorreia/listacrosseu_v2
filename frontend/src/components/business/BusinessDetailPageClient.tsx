'use client';

import type { BusinessDetail } from '@/lib/api';

import { BusinessHeader } from './BusinessHeader';
import { BusinessContent } from './BusinessContent';
import { ListingAdsBlock } from './ListingAdsBlock';
import { ContactSection } from './ContactSection';

type BusinessDetailPageClientProps = {
  business?: BusinessDetail;
  lang?: string;
};

export function BusinessDetailPageClient({ business, lang = 'en' }: BusinessDetailPageClientProps) {
  if (!business) {
    return null;
  }

  const getTierStyles = (tier: BusinessDetail['tier']) => {
    switch (tier) {
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
      case 'free':
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
      <BusinessHeader business={business as never} tierStyles={tierStyles} lang={lang} />

      <div className="container mx-auto px-4 py-8">
        <BusinessContent business={business as never} tierStyles={tierStyles} lang={lang} />

        {(business.tier === 'free' || business.tier === 'claimed') && (
          <div className="mt-8">
            <ListingAdsBlock />
          </div>
        )}

        {business.tier === 'premium' && (
          <div className="mt-12">
            <ContactSection business={business as never} tierStyles={tierStyles} />
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: business.name,
            address: {
              '@type': 'PostalAddress',
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
                '@type': 'GeoCoordinates',
                latitude: business.latitude,
                longitude: business.longitude,
              },
            }),
          }),
        }}
      />
    </div>
  );
}

export default BusinessDetailPageClient;
