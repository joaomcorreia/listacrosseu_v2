'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { normalizeLang } from '@/lib/lang';

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
}

export default function ClaimBusinessModal({
  business,
  isOpen,
  onClose,
}: ClaimBusinessModalProps) {
  const params = useParams();
  const router = useRouter();
  const lang = normalizeLang(String(params?.lang || "en"));
  useEffect(() => {
    if (isOpen && business?.id && business.slug) {
      router.push(`/${lang}/claim?business=${business.id}&slug=${encodeURIComponent(business.slug)}`);
      onClose();
    }
  }, [business, isOpen, lang, onClose, router]);
  return null;
}


