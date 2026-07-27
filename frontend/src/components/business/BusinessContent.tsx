'use client';

import { useTranslations } from "@/i18n/translations";

interface Business {
  id: number;
  name: string;
  tier: 'free' | 'claimed' | 'premium';
  address?: string;
  address_line1?: string;
  postal_code?: string;
  phone?: string;
  website?: string;
  description?: string;
  image_url?: string;
  premium_content?: string;
  premium_images?: string[];
}

interface TierStyles {
  borderColor: string;
  accentColor: string;
  bgColor: string;
}

interface BusinessContentProps {
  business: Business;
  tierStyles: TierStyles;
  lang?: string;
}

export function BusinessContent({ business, tierStyles, lang = "en" }: BusinessContentProps) {
  const t = useTranslations(lang);
  const showContactInfo = business.tier === 'claimed' || business.tier === 'premium';
  const showDescription = business.tier === 'claimed' || business.tier === 'premium';
  const showPremiumContent = business.tier === 'premium';

  return (
    <div className="space-y-6">
      {/* Contact Information (Claimed & Premium) */}
      {showContactInfo && (business.address_line1 || business.phone || business.website) && (
        <div className={`p-6 rounded-lg border ${tierStyles.borderColor} bg-white`}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t.business.contactInfo}
          </h2>
          
          <div className="space-y-3">
            {/* Address */}
            {business.address_line1 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-1">
                  {t.business.addressLabel}
                </h3>
                <p className="text-gray-600">
                  {business.address_line1}
                  {business.postal_code && `, ${business.postal_code}`}
                </p>
              </div>
            )}

            {/* Phone */}
            {business.phone && (
              <div>
                <h3 className="font-medium text-gray-700 mb-1">
                  {t.business.phoneLabel}
                </h3>
                <a 
                  href={`tel:${business.phone}`}
                  className={`${tierStyles.accentColor} hover:underline`}
                >
                  {business.phone}
                </a>
              </div>
            )}

            {/* Website */}
            {business.website && (
              <div>
                <h3 className="font-medium text-gray-700 mb-1">
                  {t.business.websiteLabel}
                </h3>
                <a 
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${tierStyles.accentColor} hover:underline`}
                >
                  {t.business.visitWebsite}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Basic Description (Claimed & Premium) */}
      {showDescription && business.description && (
        <div className={`p-6 rounded-lg border ${tierStyles.borderColor} bg-white`}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t.business.about}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {business.description}
          </p>
        </div>
      )}

      {/* Premium Content & Images */}
      {showPremiumContent && (
        <>
          {/* Premium Images Gallery */}
          {(business.image_url || (business.premium_images && business.premium_images.length > 0)) && (
            <div className={`p-6 rounded-lg border ${tierStyles.borderColor} bg-white`}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t.business.gallery}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Main image */}
                {business.image_url && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-1">
                    <img
                      src={business.image_url}
                      alt={`${business.name} main image`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {/* Premium images */}
                {business.premium_images?.slice(0, business.image_url ? 3 : 4).map((imageUrl, index) => (
                  <div key={index} className="col-span-1">
                    <img
                      src={imageUrl}
                      alt={`${business.name} image ${index + 1}`}
                      className="w-full h-32 lg:h-40 object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Rich Content */}
          {business.premium_content && (
            <div className={`p-6 rounded-lg border ${tierStyles.borderColor} bg-white`}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t.business.productsServices}
              </h2>
              <div className="prose prose-gray max-w-none">
                {business.premium_content.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="text-gray-600 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
