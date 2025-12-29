'use client';

import { useState, useEffect } from 'react';
import { Building2, Mail, User, MapPin, Hash, Phone, Globe, Tag } from 'lucide-react';
import Modal from './ui/Modal';
import BusinessCard from './BusinessCard';
import { fetchCategories, type Category } from '@/lib/api/listings';

interface ListBusinessFormData {
  business_name: string;
  category_id: number | '';
  category_name: string;
  city: string;
  country: string;
  address: string;
  postal_code: string;
  phone: string;
  website: string;
  keywords: string;
  tier: 'free' | 'claimed' | 'premium';
}

interface ListYourBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ListBusinessFormData) => Promise<void>;
}

export default function ListYourBusinessModal({
  isOpen,
  onClose,
  onSubmit,
}: ListYourBusinessModalProps) {
  const [formData, setFormData] = useState<ListBusinessFormData>({
    business_name: '',
    category_id: '',
    category_name: '',
    city: '',
    country: '',
    address: '',
    postal_code: '',
    phone: '',
    website: '',
    keywords: '',
    tier: 'free',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ListBusinessFormData>>({});

  // Load categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const categoryData = await fetchCategories();
      setCategories(categoryData.slice(0, 50)); // Limit to first 50 for dropdown
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Set fallback categories
      setCategories([
        { id: 1, name: 'Restaurant', slug: 'restaurant' },
        { id: 2, name: 'Retail', slug: 'retail' },
        { id: 3, name: 'Professional Services', slug: 'professional-services' },
      ]);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        business_name: '',
        category_id: '',
        category_name: '',
        city: '',
        country: '',
        address: '',
        postal_code: '',
        phone: '',
        website: '',
        keywords: '',
        tier: 'free',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Basic validation
    const newErrors: Partial<ListBusinessFormData> = {};
    if (!formData.business_name.trim()) newErrors.business_name = 'Business name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Demo submission - either POST to API or show success message
      try {
        await onSubmit(formData);
        onClose();
      } catch (apiError) {
        // If API fails, show demo success message
        alert('Submitted (demo mode) - Thank you for your listing!');
        onClose();
      }
    } catch (error) {
      console.error('Failed to submit listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof ListBusinessFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Auto-populate category_name when category_id changes
    if (field === 'category_id') {
      const selectedCategory = categories.find(cat => cat.id === value);
      if (selectedCategory) {
        setFormData(prev => ({ ...prev, category_name: selectedCategory.name }));
      }
    }
  };

  const handleTierChange = (newTier: 'free' | 'claimed' | 'premium') => {
    setFormData(prev => ({ ...prev, tier: newTier }));
  };

  // Create preview business object
  const previewBusiness = {
    id: 0,
    name: formData.business_name || 'Your Business Name',
    slug: 'preview',
    tier: formData.tier,
    address_line1: formData.address || 'Business Address',
    postal_code: formData.postal_code || 'Post Code',
    city: formData.city ? {
      id: 0,
      name: formData.city,
      slug: 'preview-city',
      country: {
        id: 0,
        name: formData.country || 'Country',
        slug: 'preview-country',
      }
    } : undefined,
    category: formData.category_name ? {
      id: formData.category_id as number || 0,
      name: formData.category_name,
      slug: 'preview-category',
    } : undefined,
    phone: formData.phone,
    website: formData.website,
    keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
  };

  // Get border color based on tier
  const getBorderColor = (tier: string) => {
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
      title="List Your Business"
      maxWidth="6xl"
    >
      <div className={`p-6 border-t-4 ${getBorderColor(formData.tier)}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Preview Column */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
              
              {/* Tier Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Tier
                </label>
                <div className="flex space-x-2">
                  {(['free', 'claimed', 'premium'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleTierChange(tier)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        formData.tier === tier
                          ? tier === 'free' ? 'bg-green-100 border-green-300 text-green-800'
                          : tier === 'claimed' ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-orange-100 border-orange-300 text-orange-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Preview Card */}
              <div className={`border-2 rounded-lg p-4 ${getBorderColor(formData.tier)}`}>
                <BusinessCard business={previewBusiness} />
              </div>
              
              {/* Pricing Table */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                      Free
                    </span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                      Claimed
                    </span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                      Premium
                    </span>
                    <span className="font-medium">€9/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  Basic Information
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
                    placeholder="Enter your business name"
                    disabled={isSubmitting}
                  />
                  {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name}</p>}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => handleChange('category_id', parseInt(e.target.value) || '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  Location
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter city"
                      disabled={isSubmitting}
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>

                  {/* Country */}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
                        errors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter country"
                      disabled={isSubmitting}
                    />
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                  </div>
                </div>
                
                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter business address"
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Post Code */}
                <div className="sm:max-w-xs">
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Post Code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter post code"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                  Contact Information (Optional)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                {/* Keywords */}
                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (3 max, comma-separated)
                  </label>
                  <input
                    type="text"
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => handleChange('keywords', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="restaurant, italian, pizza"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Help customers find you with relevant keywords</p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-6 border-t">
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
                    formData.tier === 'claimed' ? 'bg-blue-600 hover:bg-blue-700' : 
                    formData.tier === 'premium' ? 'bg-orange-600 hover:bg-orange-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'List Business (Demo)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Modal>
  );
}