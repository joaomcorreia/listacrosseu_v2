'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { normalizeLang } from '@/lib/lang';
import { useTranslations } from '@/i18n/translations';

interface Business {
  id: number;
  name: string;
  address?: string;
  address_line1?: string;
  postal_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: {
    name: string;
  } | null;
  country?: {
    name: string;
  } | null;
}

interface TierStyles {
  borderColor: string;
  accentColor: string;
  bgColor: string;
}

interface ContactSectionProps {
  business: Business;
  tierStyles: TierStyles;
}

export function ContactSection({ business, tierStyles }: ContactSectionProps) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || 'en'));
  const t = useTranslations(lang);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual form submission to API
    // For now, simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Generate Google Maps embed URL
  const getMapEmbedUrl = () => {
    if (business.latitude && business.longitude) {
      return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${business.latitude},${business.longitude}`;
    } else if (business.address_line1 || business.city?.name) {
      const address = [
        business.address_line1,
        business.city?.name,
        business.country?.name
      ].filter(Boolean).join(', ');
      return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(address)}`;
    }
    return null;
  };

  const mapUrl = getMapEmbedUrl();

  return (
    <div id="contact-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Contact Form */}
      <div className={`p-6 rounded-lg border-2 ${tierStyles.borderColor} bg-white`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t.forms.contactForm.titleWithName.replace("{name}", business.name)}
        </h2>
        
        {submitted ? (
          <div className={`p-4 rounded ${tierStyles.bgColor} ${tierStyles.borderColor} border`}>
            <p className={`${tierStyles.accentColor} font-medium`}>
              {t.forms.contactForm.sentMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t.forms.contactForm.name} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${tierStyles.borderColor} focus:ring-orange-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t.forms.contactForm.email} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${tierStyles.borderColor} focus:ring-orange-500 focus:border-transparent`}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                {t.forms.contactForm.message} *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${tierStyles.borderColor} focus:ring-orange-500 focus:border-transparent`}
                placeholder={t.forms.contactForm.messagePlaceholder}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                tierStyles.accentColor.includes('orange')
                  ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
              }`}
            >
              {isSubmitting ? t.forms.contactForm.sending : t.forms.contactForm.send}
            </button>

            <p className="text-xs text-gray-500">
              {t.forms.contactForm.requiredNote}
            </p>
          </form>
        )}
      </div>

      {/* Map */}
      <div className={`p-6 rounded-lg border ${tierStyles.borderColor} bg-white`}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.forms.contactForm.locationTitle}</h2>
        
        {mapUrl ? (
          <div className="h-64 rounded-lg overflow-hidden">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t.forms.contactForm.mapTitle.replace("{name}", business.name)}
            />
          </div>
        ) : (
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500">{t.forms.contactForm.mapUnavailable}</p>
              {(business.address_line1 || business.city?.name) && (
                <p className="text-sm text-gray-400 mt-1">
                  {[business.address_line1, business.city?.name, business.country?.name]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Address display */}
        {(business.address_line1 || business.city?.name) && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-700 mb-2">{t.forms.contactForm.addressTitle}</h3>
            <p className="text-gray-600 text-sm">
              {[
                business.address_line1,
                business.postal_code,
                business.city?.name,
                business.country?.name
              ].filter(Boolean).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
