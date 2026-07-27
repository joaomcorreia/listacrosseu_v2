import { Building2, MapPin, Phone, Globe, Clock, Star, Check } from 'lucide-react';
import { useTranslations } from '@/i18n/translations';

export interface Business {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: { name: string };
  city?: { name: string };
  town?: { name: string };
  country?: { name: string };
  address?: string;
  phone?: string;
  website?: string;
  keywords?: string[];
  is_premium?: boolean;
  tier?: string;
  premium_layout_width?: "boxed" | "full";
}

interface PremiumPagePreviewProps {
  business: Business;
  className?: string;
  lang?: string;
}

export default function PremiumPagePreview({ business, className = '', lang = "en" }: PremiumPagePreviewProps) {
  const t = useTranslations(lang);
  // Use provided business data or fallback to demo data
  const businessData = {
    name: business.name || t.business.preview.exampleName,
    category: business.category?.name || t.business.preview.exampleCategory,
    address: business.address || `${business.city?.name || t.business.preview.exampleCity}, ${business.country?.name || t.business.preview.exampleCountry}`,
    phone: business.phone || t.business.preview.examplePhone,
    website: business.website || t.business.preview.exampleWebsite,
    description: business.description || t.business.preview.exampleDescription,
    keywords: business.keywords || t.business.preview.exampleKeywords,
  };

  const services = t.business.preview.services;

  const openingHours = t.business.preview.openingHours;

  const layoutWidth = business.premium_layout_width || "boxed";
  const containerClass =
    layoutWidth === "boxed"
      ? "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
      : "";

  return (
    <div className={`bg-gray-50 ${className}`}>
      <div className={containerClass}>
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <div className="inline-flex items-center bg-orange-500 text-orange-100 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4 mr-2" />
              {t.business.preview.heroBadge}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {t.business.preview.heroTitle}
            </h1>
            <p className="text-orange-100">
              {t.business.preview.heroSubtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
            {/* Business Overview */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{businessData.name}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Building2 className="w-4 h-4 mr-2 text-orange-600" />
                  <span>{businessData.category}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-orange-600" />
                  <span>{businessData.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-orange-600" />
                  <span>{businessData.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Globe className="w-4 h-4 mr-2 text-orange-600" />
                  <span className="text-orange-600">{businessData.website}</span>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t.business.preview.aboutTitle}</h3>
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                {businessData.description}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {t.business.preview.aboutExtra}
              </p>
            </div>

            {/* Gallery Section with Shapes */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t.business.preview.galleryTitle}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="aspect-square bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg"></div>
                <div className="aspect-square bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg"></div>
                <div className="aspect-square bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg"></div>
                <div className="aspect-square bg-gradient-to-br from-orange-500 to-red-500 rounded-lg col-span-2"></div>
                <div className="aspect-square bg-gradient-to-br from-amber-300 to-orange-400 rounded-lg"></div>
              </div>
            </div>

            {/* Services Section */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t.business.preview.servicesTitle}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {services.slice(0, 6).map((service, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-orange-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t.business.preview.contactTitle}</h3>
              <form className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t.business.preview.formName}</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={t.business.preview.placeholderName}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{t.business.preview.formEmail}</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={t.business.preview.placeholderEmail}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t.business.preview.formMessage}</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={t.business.preview.placeholderMessage}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  {t.business.preview.sendMessage}
                </button>
              </form>
            </div>
          </div>

            {/* Sidebar */}
            <div className="space-y-4">
            {/* Premium Badge */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg p-4 text-center">
              <h4 className="font-bold mb-2">{t.business.preview.premiumAdFreeTitle}</h4>
              <p className="text-orange-100 text-xs mb-3">
                {t.business.preview.premiumAdFreeBody}
              </p>
              <div className="inline-flex items-center bg-orange-500 text-white px-3 py-1 rounded-full text-xs">
                <Check className="w-3 h-3 mr-1" />
                {t.business.preview.noAdsBadge}
              </div>
            </div>

            {/* Business Highlights */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-bold text-gray-900 mb-3">{t.business.preview.highlightsTitle}</h4>
              <div className="flex flex-wrap gap-2">
                {businessData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-600" />
                {t.business.preview.openingHoursTitle}
              </h4>
              <div className="space-y-1">
                {openingHours.map((hour, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-600">{hour.split(': ')[0]}</span>
                    <span className="text-gray-900 font-medium">{hour.split(': ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h4 className="font-bold text-gray-900 mb-3">{t.business.preview.locationTitle}</h4>
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-orange-600 mx-auto mb-1" />
                  <p className="text-gray-600 text-xs font-medium">{t.business.preview.interactiveMap}</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
