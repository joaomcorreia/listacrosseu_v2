'use client';

import { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import PremiumPagePreview from '../premium/PremiumPagePreview';
import BusinessCard from '../BusinessCard';
import { useTranslations } from '@/i18n/translations';
import { debugLog } from '@/lib/debug';

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
  onSubmit?: (data: ClaimSubmitData) => Promise<ClaimSubmitResult | void>;
  showPreview?: boolean;
}

interface FormData {
  name: string;
  email: string;
  businessName: string;
  businessAddress: string;
  businessPostCode: string;
  phone?: string;
  website?: string;
  description?: string;
  services: {
    id: string;
    label: string;
    selected: boolean;
  }[];
  images: File[];
}

export interface ClaimSubmitData {
  name: string;
  email: string;
  business_name: string;
  business_address: string;
  business_post_code: string;
  phone?: string;
  website?: string;
  description?: string;
  services?: string[];
  images?: File[];
  listing_id?: number;
}

export interface ClaimSubmitResult {
  message?: string;
  claim_id?: number;
  email_status?: 'sent' | 'console';
  verification_url?: string;
}

export default function ListingFlowModal({ 
  open, 
  onClose, 
  lang, 
  business, 
  startStep = "claim",
  onSubmit,
  showPreview = true,
}: ListingFlowModalProps) {
  const t = useTranslations(lang);
  const defaultServices = Array.from({ length: 6 }, (_, index) => ({
    id: `service-${index + 1}`,
    label: `${t.forms.claimForm.placeholders.services} ${index + 1}`,
    selected: true,
  }));

  const [step, setStep] = useState<"claim" | "premium">(startStep);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    businessName: business.name || '',
    businessAddress: business.address || '',
    businessPostCode: '',
    phone: business.phone || '',
    website: business.website || '',
    description: business.description || '',
    services: defaultServices,
    images: [],
  });
  const [errors, setErrors] = useState<{ description?: string; services?: string }>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDescriptionSuggestion, setAiDescriptionSuggestion] = useState<string | null>(null);
  const [aiServicesSuggestion, setAiServicesSuggestion] = useState<string[] | null>(null);
  const [aiOriginalDescription, setAiOriginalDescription] = useState<string | null>(null);
  const [aiAppliedMessage, setAiAppliedMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitResult, setSubmitResult] = useState<ClaimSubmitResult | null>(null);
  const [submitError, setSubmitError] = useState('');

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
    keywords: business.keywords,
    description: formData.description || business.description,
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
    if (field === 'description' && errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setFormData(prev => {
      const selectedCount = prev.services.filter(service => service.selected).length;
      if (checked && selectedCount >= 6) {
        return prev;
      }
      return {
        ...prev,
        services: prev.services.map(service =>
          service.id === serviceId ? { ...service, selected: checked } : service
        ),
      };
    });
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: undefined }));
    }
  };

  const handleServiceLabelChange = (serviceId: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === serviceId ? { ...service, label } : service
      ),
    }));
  };

  const handleAddService = () => {
    setFormData(prev => {
      if (prev.services.length >= 6) {
        return prev;
      }
      const nextIndex = prev.services.length + 1;
      return {
        ...prev,
        services: [
          ...prev.services,
          {
            id: `service-manual-${nextIndex}`,
            label: `${t.forms.claimForm.placeholders.services} ${nextIndex}`,
            selected: true,
          },
        ],
      };
    });
  };

  const handleDeleteService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId),
    }));
  };

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 3);
    setFormData(prev => ({
      ...prev,
      images: files,
    }));
  };

  const validateAiSection = () => {
    const selectedCount = formData.services.filter(service => service.selected).length;
    const nextErrors: { description?: string; services?: string } = {};

    if (!formData.description || !formData.description.trim()) {
      nextErrors.description = t.forms.claimForm.errors.descriptionRequired;
    }
    if (selectedCount === 0) {
      nextErrors.services = t.forms.claimForm.errors.minServices;
    } else if (selectedCount > 6) {
      nextErrors.services = t.forms.claimForm.errors.maxServices;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const fetchAiSuggestions = async () => {
    const businessType = business.category?.name || t.forms.claimForm.defaults.businessType;
    const currentDescription = formData.description || '';
    const prompt = `Improve this business description for SEO. Keep all the information provided but make it more professional and keyword-rich: ${currentDescription}`;

    setAiLoading(true);
    setAiDescriptionSuggestion(null);
    setAiServicesSuggestion(null);
    setAiAppliedMessage(null);
    setAiOriginalDescription(currentDescription);

    try {
      // Placeholder: wire Anthropic API here.
      await new Promise(resolve => setTimeout(resolve, 600));
      const improvedDescription = `${currentDescription || t.forms.claimForm.messages.defaultDescription} in the ${businessType.toLowerCase()} space, serving customers across Europe with clear information and practical service details.`;
      const services = [
        `${businessType} Service 1`,
        `${businessType} Service 2`,
        `${businessType} Service 3`,
        `${businessType} Service 4`,
        `${businessType} Service 5`,
        `${businessType} Service 6`,
      ];
      console.debug("AI prompt placeholder:", prompt);
      setAiDescriptionSuggestion(improvedDescription);
      setAiServicesSuggestion(services);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestions = () => {
    if (aiDescriptionSuggestion) {
      setFormData(prev => ({
        ...prev,
        description: aiDescriptionSuggestion,
      }));
    }
    if (aiServicesSuggestion) {
      setFormData(prev => ({
        ...prev,
        services: aiServicesSuggestion.map((label, index) => ({
          id: `service-ai-${index + 1}`,
          label,
          selected: true,
        })),
      }));
    }
    setAiAppliedMessage(t.forms.claimForm.messages.aiApplied);
  };

  const keepOriginalDescription = () => {
    if (aiOriginalDescription !== null) {
      setFormData(prev => ({
        ...prev,
        description: aiOriginalDescription,
      }));
    }
    setAiAppliedMessage(t.forms.claimForm.messages.aiKeptOriginal);
  };

  const regenerateAiSuggestions = () => {
    fetchAiSuggestions();
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAiSection()) {
      return;
    }
    const listingId = Number(business.id);
    const payload: ClaimSubmitData = {
      name: formData.name,
      email: formData.email,
      business_name: formData.businessName,
      business_address: formData.businessAddress,
      business_post_code: formData.businessPostCode,
      phone: formData.phone,
      website: formData.website,
      description: formData.description,
      services: formData.services.filter(service => service.selected).map(service => service.label),
      images: formData.images,
      listing_id: Number.isFinite(listingId) ? listingId : undefined,
    };

    try {
      setSubmitError('');
      if (onSubmit) {
        setSubmitResult((await onSubmit(payload)) || null);
      } else {
        debugLog('Claim submitted (demo)', payload);
        alert(t.forms.claimForm.messages.claimSubmittedDemo);
      }
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to submit claim:', error);
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit the claim.');
    }
  };

  const handleUpgrade = () => {
    // Demo upgrade
    debugLog('Upgrade to Premium (demo)');
    alert(t.forms.claimForm.messages.upgradePremiumDemo);
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
                {t.forms.claimForm.actions.backToClaim}
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {step === "claim" ? t.forms.claimForm.title : t.forms.claimForm.premiumPreviewTitle}
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
            <div className={`grid gap-6 p-6 ${showPreview ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {/* Left: Live Preview */}
              {showPreview && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.forms.claimForm.sections.preview}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <BusinessCard 
                      business={mergedBusiness as any}
                    />
                  </div>
                </div>
              )}

              {/* Right: Claim Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.forms.claimForm.sections.claimDetails}</h3>
                {submitSuccess ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <div className="font-semibold text-emerald-900">{submitResult?.email_status === 'console' ? 'Verification link created' : t.forms.claimForm.messages.checkEmailTitle}</div>
                    <p className="mt-2">
                      {submitResult?.message || t.forms.claimForm.messages.checkEmailBody}
                    </p>
                    {submitResult?.verification_url && (
                      <a href={submitResult.verification_url} className="mt-3 inline-flex font-semibold text-emerald-800 underline">
                        Open verification link
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-4 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {t.buttons.close}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitClaim} className="space-y-4">
                  {submitError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submitError}</div>}
                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.forms.claimForm.fields.name} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t.forms.claimForm.placeholders.name}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.forms.claimForm.fields.email} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t.forms.claimForm.placeholders.email}
                      />
                    </div>
                  </div>

                  {/* Business Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.forms.claimForm.fields.businessName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => handleFormChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t.forms.claimForm.placeholders.businessName}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.forms.claimForm.fields.addressLine1} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessAddress}
                      onChange={(e) => handleFormChange('businessAddress', e.target.value)}
                      className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t.forms.claimForm.placeholders.addressLine1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.forms.claimForm.fields.postalCode} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessPostCode}
                      onChange={(e) => handleFormChange('businessPostCode', e.target.value)}
                      className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t.forms.claimForm.placeholders.postalCode}
                    />
                  </div>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.forms.claimForm.fields.phone}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t.forms.claimForm.placeholders.phone}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.forms.claimForm.fields.website}
                      </label>
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleFormChange('website', e.target.value)}
                        className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t.forms.claimForm.placeholders.website}
                      />
                    </div>
                  </div>

                                    <details className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                      {t.forms.claimForm.sections.businessDetails}
                    </summary>

                    <div className="mt-4 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.forms.claimForm.fields.description}
                        </label>
                        <textarea
                          rows={5}
                          maxLength={500}
                          value={formData.description || ''}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          className="w-full px-3 py-2 border text-slate-900 placeholder:text-slate-400 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={t.forms.claimForm.placeholders.description}
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          {t.forms.claimForm.messages.characterCount.replace(
                            "{count}",
                            String((formData.description || '').length)
                          )}
                        </div>
                        {errors.description && (
                          <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                        )}
                        <button
                          type="button"
                          onClick={fetchAiSuggestions}
                          disabled={aiLoading}
                          className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          {aiLoading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                              {t.forms.claimForm.messages.generating}
                            </>
                          ) : (
                            t.forms.claimForm.actions.generateAI
                          )}
                        </button>
                        {(aiDescriptionSuggestion || aiServicesSuggestion) && (
                          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                            <div className="font-medium text-slate-900">{t.forms.claimForm.messages.aiReady}</div>
                            <p className="mt-1 text-xs text-slate-600">
                              {t.forms.claimForm.messages.aiReadyNote}
                            </p>
                            {aiOriginalDescription !== null && aiDescriptionSuggestion && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-md bg-white p-3">
                                  <p className="text-xs font-semibold text-slate-500">{t.forms.claimForm.messages.aiOriginalLabel}</p>
                                  <p className="mt-2 text-xs text-slate-700 whitespace-pre-line">
                                    {aiOriginalDescription || t.forms.claimForm.messages.noDescriptionYet}
                                  </p>
                                </div>
                                <div className="rounded-md bg-blue-100 p-3">
                                  <p className="text-xs font-semibold text-blue-700">{t.forms.claimForm.messages.aiImprovedLabel}</p>
                                  <p className="mt-2 text-xs text-slate-700 whitespace-pre-line">
                                    {aiDescriptionSuggestion}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={applyAiSuggestions}
                                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                {t.forms.claimForm.actions.useThis}
                              </button>
                              <button
                                type="button"
                                onClick={regenerateAiSuggestions}
                                className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                {t.forms.claimForm.actions.regenerate}
                              </button>
                              <button
                                type="button"
                                onClick={keepOriginalDescription}
                                className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                              >
                                {t.forms.claimForm.actions.keepOriginal}
                              </button>
                            </div>
                          </div>
                        )}
                        {aiAppliedMessage && (
                          <p className="mt-2 text-xs font-semibold text-emerald-600">
                            {aiAppliedMessage}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-700">
                            {t.forms.claimForm.sections.services}
                          </p>
                          <span className="text-xs text-gray-500">
                            {t.forms.claimForm.messages.servicesSelected.replace(
                              "{count}",
                              String(formData.services.filter(service => service.selected).length)
                            )}
                          </span>
                        </div>
                        {errors.services && (
                          <p className="mb-2 text-xs text-red-600">{errors.services}</p>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {formData.services.map(service => (
                            <div key={service.id} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-3">
                              <input
                                type="checkbox"
                                checked={service.selected}
                                onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                                className="h-4 w-4 text-blue-600"
                              />
                              <input
                                type="text"
                                value={service.label}
                                onChange={(e) => handleServiceLabelChange(service.id, e.target.value)}
                                className="w-full text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteService(service.id)}
                                className="text-slate-400 hover:text-red-500"
                                aria-label={t.forms.claimForm.actions.removeService}
                              >
                                x
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleAddService}
                          disabled={formData.services.length >= 6}
                          className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          + {t.forms.claimForm.actions.addService}
                        </button>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {t.forms.claimForm.sections.images}
                        </p>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          multiple
                          onChange={handleImagesChange}
                          className="block w-full text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">{t.forms.claimForm.messages.maxImages}</p>
                        {formData.images.length > 0 && (
                          <ul className="mt-2 space-y-1 text-xs text-gray-600">
                            {formData.images.map((file) => (
                              <li key={file.name}>{file.name}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </details>
{/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t.forms.claimForm.actions.submitClaim}
                  </button>
                  </form>
                )}
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
                    {t.forms.claimForm.actions.upgradePremium}
                  </button>
                  <button
                    onClick={() => setStep("claim")}
                    className="bg-gray-600 text-white px-8 py-3 rounded-md hover:bg-gray-700 transition-colors font-medium"
                  >
                    {t.forms.claimForm.actions.claimLater}
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




