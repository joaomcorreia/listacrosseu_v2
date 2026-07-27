'use client';

import { useParams } from 'next/navigation';
import { normalizeLang } from '@/lib/lang';
import ListingFlowModal, { type Business as ListingBusiness, type ClaimSubmitData } from './modals/ListingFlowModal';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

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
  country?: {
    id: number;
    name: string;
    slug: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  phone?: string;
  website?: string;
  keywords?: string[];
  description?: string;
}

interface ClaimBusinessModalProps {
  business?: Business;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ClaimSubmitData) => Promise<void>;
}

export default function ClaimBusinessModal({
  business,
  isOpen,
  onClose,
  onSubmit,
}: ClaimBusinessModalProps) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const getCsrfToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === name) return value;
    }
    return "";
  };

  const submitHandler =
    onSubmit ||
    (async (data: ClaimSubmitData) => {
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to submit claim: ${response.status}`);
      }
    });

  const hasBusiness = Boolean(business);
  const listingBusiness: ListingBusiness = {
    id: business?.id ? String(business.id) : '0',
    slug: business?.slug || 'preview',
    name: business?.name || '',
    description: business?.description,
    category: business?.category ? { name: business.category.name } : undefined,
    city: business?.city ? { name: business.city.name } : undefined,
    town: business?.town ? { name: business.town.name } : undefined,
    country: business?.city?.country
      ? { name: business.city.country.name }
      : business?.town?.city?.country
        ? { name: business.town.city.country.name }
        : business?.country
          ? { name: business.country.name }
          : undefined,
    address: business?.address_line1 || business?.address,
    phone: business?.phone,
    website: business?.website,
    keywords: business?.keywords,
    tier: business?.tier || 'free',
  };

  return (
    <ListingFlowModal
      open={isOpen}
      onClose={onClose}
      lang={lang}
      business={listingBusiness}
      startStep="claim"
      onSubmit={submitHandler}
      showPreview={hasBusiness}
    />
  );
}


