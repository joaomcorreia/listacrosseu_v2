'use client';

import { useState, useEffect } from 'react';
import { X, ArrowLeft, ChevronRight } from 'lucide-react';
import PremiumPagePreview from '../premium/PremiumPagePreview';
import BusinessCard from '../BusinessCard';

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
}

interface ListingFlowModalProps {
  open: boolean;
  onClose: () => void;
  lang: string;
  business: Business;
  startStep?: "claim" | "premium";
}

interface FormData {
  name: string;
  email: string;
  businessName: string;
  businessAddress: string;
  businessPostCode: string;
  phone?: string;
  website?: string;
  keywords?: string;
}

export default function ListingFlowModal({ 
  open, 
  onClose, 
  lang, 
  business, 
  startStep = "claim" 
}: ListingFlowModalProps) {
  const [step, setStep] = useState<"claim" | "premium">(startStep);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    businessName: business.name || '',
    businessAddress: business.address || '',
    businessPostCode: '',
    phone: business.phone || '',
    website: business.website || '',
    keywords: business.keywords?.join(', ') || '',
  });

  // Reset step when startStep changes
  useEffect(() => {
    setStep(startStep);
  }, [startStep]);

  // Create merged business data for preview
  const mergedBusiness = {
    id: parseInt(business.id) || 1,
    slug: business.slug,
    name: formData.businessName || business.name,
    address: formData.businessAddress || business.address,
    phone: formData.phone || business.phone,
    website: formData.website || business.website,
    keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 3) : business.keywords,
    description: business.description,
    category: business.category,
    city: business.city,
    town: business.town,
    country: business.country,
    tier: business.tier as 'free' | 'claimed' | 'premium',
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo submission
    console.log('Claim submitted (demo)', formData);
    
    // Show toast notification (simple alert for demo)
    alert('Claim submitted (demo)');
    
    // Close modal
    onClose();
  };

  const handleUpgrade = () => {
    // Demo upgrade
    console.log('Upgrade to Premium (demo)');
    alert('Upgrade to Premium (demo)');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            {step === "premium" && (
              <button
                onClick={() => setStep("claim")}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back to claim
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {step === "claim" ? "Claim Your Business" : "Premium Preview"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {step === "claim" ? (
            /* Step 1: Claim Form */
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Left: Live Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <BusinessCard 
                    business={mergedBusiness as any}
                  />
                </div>
              </div>

              {/* Right: Claim Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Details</h3>
                <form onSubmit={handleSubmitClaim} className="space-y-4">
                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Business Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => handleFormChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Business name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessAddress}
                      onChange={(e) => handleFormChange('businessAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessPostCode}
                      onChange={(e) => handleFormChange('businessPostCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Postal code"
                    />
                  </div>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+31 20 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleFormChange('website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="www.example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (max 3, comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.keywords || ''}
                      onChange={(e) => handleFormChange('keywords', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="restaurant, italian, pizza"
                    />
                  </div>

                  {/* Premium Upsell */}
                  <div className="bg-gradient-to-r from-green-50 to-orange-50 border border-orange-200 rounded-lg p-4 mt-6">
                    <h4 className="font-bold text-gray-900 mb-2">
                      Upgrade to premium and get your own business page
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Enhanced visibility, detailed gallery, contact forms and more.
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-orange-600">€9.99</span>
                        <span className="text-gray-600"> / month</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep("premium")}
                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors font-medium flex items-center"
                      >
                        See Premium Preview
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      You can upgrade anytime after claiming.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Submit Claim
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Step 2: Premium Preview */
            <div>
              <PremiumPagePreview business={mergedBusiness as any} />
              
              {/* Bottom CTAs */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleUpgrade}
                    className="bg-orange-600 text-white px-8 py-3 rounded-md hover:bg-orange-700 transition-colors font-medium"
                  >
                    Upgrade to Premium (demo)
                  </button>
                  <button
                    onClick={() => setStep("claim")}
                    className="bg-gray-600 text-white px-8 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium"
                  >
                    I prefer to claim for now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}