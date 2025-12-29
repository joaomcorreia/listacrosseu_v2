'use client';

interface Business {
  id: number;
  name: string;
  tier: 'free' | 'claimed' | 'premium';
  category?: {
    name: string;
    slug: string;
  };
  city?: {
    name: string;
    slug: string;
  };
  country?: {
    name: string;
    slug: string;
  };
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
}

export function BusinessHeader({ business, tierStyles }: BusinessHeaderProps) {
  // Show up to 3 keywords
  const displayKeywords = business.keywords?.slice(0, 3) || [];

  return (
    <div className={`border-b-2 ${tierStyles.borderColor} ${tierStyles.bgColor}`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Left side - Business info */}
          <div className="flex-1">
            {/* Business name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {business.name}
            </h1>

            {/* Category */}
            {business.category && (
              <div className="mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tierStyles.accentColor} ${tierStyles.bgColor} border ${tierStyles.borderColor}`}>
                  {business.category.name}
                </span>
              </div>
            )}

            {/* Location */}
            <div className="text-gray-600 mb-3">
              {business.city && business.country && (
                <p className="text-lg">
                  {business.city.name}, {business.country.name}
                </p>
              )}
            </div>

            {/* Keywords */}
            {displayKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Logo (Premium only) */}
          {business.tier === 'premium' && business.logo_url && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-lg border-2 border-gray-200 overflow-hidden flex items-center justify-center">
                <img
                  src={business.logo_url}
                  alt={`${business.name} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}