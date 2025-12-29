'use client';

import { useState, useEffect } from 'react';
import { Building2, Mail, User, MapPin, Hash } from 'lucide-react';
import Modal from './ui/Modal';
import BusinessCard from './BusinessCard';

interface Business {
  id: number;
  name: string;
  slug: string;
  tier?: 'free' | 'claimed' | 'premium';
  address?: string;
  address_line1?: string;
  postal_code?: string;
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
    name: string;
    city: {
      name: string;
      country: {
        name: string;
      };
    };
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  phone?: string;
  website?: string;
}

interface ClaimFormData {
  name: string;
  email: string;
  business_name: string;
  business_address: string;
  business_post_code: string;
}

interface ClaimBusinessModalProps {
  business?: Business;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClaimFormData & { listing_id?: number }) => Promise<void>;
}

export default function ClaimBusinessModal({
  business,
  isOpen,
  onClose,
  onSubmit,
}: ClaimBusinessModalProps) {
  const [formData, setFormData] = useState<ClaimFormData>({
    name: '',
    email: '',
    business_name: '',
    business_address: '',
    business_post_code: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ClaimFormData>>({});

  // Pre-populate form with business data when modal opens
  useEffect(() => {
    if (isOpen && business) {
      setFormData({
        name: '',
        email: '',
        business_name: business.name || '',
        business_address: getBusinessAddress(business),
        business_post_code: business.postal_code || '',
      });
    } else if (isOpen && !business) {
      // Reset form for new business
      setFormData({
        name: '',
        email: '',
        business_name: '',
        business_address: '',
        business_post_code: '',
      });
    }
    setErrors({});
  }, [isOpen, business]);

  const getBusinessAddress = (business: Business): string => {
    const parts = [];
    
    if (business.address_line1) {
      parts.push(business.address_line1);
    } else if (business.address) {
      parts.push(business.address);
    }
    
    // Add location context
    const location = [];
    if (business.town) {
      location.push(business.town.name);
      location.push(business.town.city.name);
      location.push(business.town.city.country.name);
    } else if (business.city) {
      location.push(business.city.name);
      location.push(business.city.country.name);
    }
    
    if (location.length > 0 && !parts.some(part => 
      location.some(loc => part.toLowerCase().includes(loc.toLowerCase()))
    )) {
      parts.push(location.join(', '));
    }
    
    return parts.join(', ');
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ClaimFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }

    if (!formData.business_address.trim()) {
      newErrors.business_address = 'Business address is required';
    }

    if (!formData.business_post_code.trim()) {
      newErrors.business_post_code = 'Post code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        listing_id: business?.id,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit claim:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ClaimFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Create preview business object with updated data
  const previewBusiness = business ? {
    ...business,
    name: formData.business_name || business.name,
    address_line1: formData.business_address || business.address_line1 || business.address,
    postal_code: formData.business_post_code || business.postal_code,
  } : {
    id: 0,
    name: formData.business_name || 'Business Name',
    slug: 'preview',
    tier: 'free' as const,
    address_line1: formData.business_address || 'Business Address',
    postal_code: formData.business_post_code || 'Post Code',
  };

  // Determine border color based on tier
  const getBorderColor = (tier?: string) => {
    switch (tier) {
      case 'free': return 'border-green-200';
      case 'claimed': return 'border-blue-200';
      case 'premium': return 'border-orange-200';
      default: return 'border-green-200';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={business ? `Claim "${business.name}"` : 'Claim a Business'}
      maxWidth="4xl"
    >
      <div className={`p-6 border-t-4 ${getBorderColor(business?.tier)}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Preview Column */}
          <div className="order-2 lg:order-1">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
            <div className={`border-2 rounded-lg p-4 ${getBorderColor(business?.tier)}`}>
              <BusinessCard business={previewBusiness} />
            </div>
            
            {business && (
              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Original Business Information:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Name:</strong> {business.name}</div>
                  <div><strong>Address:</strong> {getBusinessAddress(business)}</div>
                  {business.postal_code && (
                    <div><strong>Post Code:</strong> {business.postal_code}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Column */}
          <div className="order-1 lg:order-2">

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Your Contact Information
              </h3>
              
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Your Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Business Information
              </h3>
              
              {/* Business Name */}
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Business Name *
                </label>
                <input
                  type="text"
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
                    errors.business_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter business name"
                  disabled={isSubmitting}
                />
                {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name}</p>}
              </div>

              {/* Business Address */}
              <div>
                <label htmlFor="business_address" className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Business Address *
                </label>
                <textarea
                  id="business_address"
                  rows={3}
                  value={formData.business_address}
                  onChange={(e) => handleChange('business_address', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
                    errors.business_address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete business address"
                  disabled={isSubmitting}
                />
                {errors.business_address && <p className="text-red-500 text-sm mt-1">{errors.business_address}</p>}
              </div>

              {/* Post Code */}
              <div>
                <label htmlFor="business_post_code" className="block text-sm font-medium text-gray-700 mb-1">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Post Code *
                </label>
                <input
                  type="text"
                  id="business_post_code"
                  value={formData.business_post_code}
                  onChange={(e) => handleChange('business_post_code', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
                    errors.business_post_code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter post code"
                  disabled={isSubmitting}
                />
                {errors.business_post_code && <p className="text-red-500 text-sm mt-1">{errors.business_post_code}</p>}
              </div>
            </div>



            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p>
                <strong>Note:</strong> By submitting this claim, you confirm that you are authorized to represent this business. 
                We will review your claim and contact you within 2-3 business days.
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                  business?.tier === 'claimed' ? 'bg-blue-600 hover:bg-blue-700' : 
                  business?.tier === 'premium' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-green-600 hover:bg-green-700'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </Modal>
  );
}