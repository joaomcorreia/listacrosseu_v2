'use client';

import type { BusinessDetail } from '@/lib/api';
import type { BusinessDiscovery } from './BusinessDiscoverySections';
import BusinessDiscoverySections from './BusinessDiscoverySections';

import { BusinessHeader } from './BusinessHeader';
import { BusinessContent } from './BusinessContent';
import { ListingAdsBlock } from './ListingAdsBlock';
import { ContactSection } from './ContactSection';
import { FreeBusinessDetailPage, type RelatedBusiness } from './FreeBusinessDetailPage';
import ClaimedListingRenderer from './ClaimedListingRenderer';
import { resolvePresentationStyle } from '@/lib/presentationStyle';

type BusinessDetailPageClientProps = {
  business?: BusinessDetail;
  lang?: string;
  relatedBusinesses?: RelatedBusiness[];
  relatedHeading?: string;
  discovery?: BusinessDiscovery;
};

export function BusinessDetailPageClient({ business, lang = 'en', relatedBusinesses = [], relatedHeading, discovery }: BusinessDetailPageClientProps) {
  if (!business) {
    return null;
  }

  if (business.tier === 'free') {
    return <FreeBusinessDetailPage business={business} discovery={discovery} relatedBusinesses={relatedBusinesses} relatedHeading={relatedHeading} lang={lang} />;
  }

  if (business.tier === 'claimed' && business.claimed_listing_published) {
    const { background } = resolvePresentationStyle(business);
    return <div className="min-h-screen bg-white">
      <section className="w-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} aria-label="Published Claimed Listing">
        <div className="container mx-auto px-4 py-8"><ClaimedListingRenderer listing={business} /></div>
      </section>
      <div className="container mx-auto px-4"><div className="mt-8"><ListingAdsBlock /></div>{discovery && <div className="mt-10"><BusinessDiscoverySections discovery={discovery} lang={lang} cityName={business.city?.name} citySlug={business.city?.slug} countryName={business.country.name} countrySlug={business.country.slug} /></div>}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'LocalBusiness', name: business.name,
        ...(business.description && { description: business.description }),
        ...(business.website && { url: business.website }), ...(business.phone && { telephone: business.phone }),
      }) }} />
    </div>;
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

        {business.tier === 'claimed' && (
          <div className="mt-8">
            <ListingAdsBlock />
          </div>
        )}

        {business.tier === 'premium' && (
          <div className="mt-12">
            <ContactSection business={business as never} tierStyles={tierStyles} />
          </div>
        )}

        {discovery && <div className="mt-10"><BusinessDiscoverySections discovery={discovery} lang={lang} cityName={business.city?.name} citySlug={business.city?.slug} countryName={business.country.name} countrySlug={business.country.slug} /></div>}
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
