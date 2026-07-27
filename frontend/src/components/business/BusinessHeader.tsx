'use client';

interface Business {
  id: number;
  name: string;
  tier: 'free' | 'claimed' | 'premium';
  category?: {
    name: string;
    slug: string;
  } | null;
  city?: {
    name: string;
    slug: string;
  } | null;
  country?: {
    name: string;
    slug: string;
  } | null;
  keywords?: string[];
  logo_url?: string;
}

interface TierStyles {
  borderColor: string;
  accentColor: string;
  bgColor: string;
}

interface BusinessHeaderProps {
  business: Business;
  tierStyles: TierStyles;
  lang?: string;
}

export function BusinessHeader({ business, tierStyles }: BusinessHeaderProps) {
  const displayKeywords = business.keywords?.slice(0, 3) || [];

  return (
    <div className={`border-b-2 ${tierStyles.borderColor} ${tierStyles.bgColor}`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 lg:text-4xl">{business.name}</h1>

            {business.category && (
              <div className="mb-2">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${tierStyles.accentColor} ${tierStyles.bgColor} ${tierStyles.borderColor}`}>
                  {business.category.name}
                </span>
              </div>
            )}

            <div className="mb-3 text-gray-600">
              {business.city && business.country && <p className="text-lg">{business.city.name}, {business.country.name}</p>}
            </div>

            {displayKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayKeywords.map((keyword, index) => (
                  <span key={index} className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {business.tier === 'premium' && business.logo_url && (
            <div className="flex-shrink-0">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-gray-200 bg-white lg:h-32 lg:w-32">
                <img src={business.logo_url} alt={`${business.name} logo`} className="max-h-full max-w-full object-contain" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
