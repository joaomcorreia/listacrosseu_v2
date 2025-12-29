import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { BusinessDetailPageClient } from '@/components/business/BusinessDetailPageClient';

interface Business {
  id: number;
  name: string;
  slug: string;
  tier: 'free' | 'claimed' | 'premium';
  country?: {
    id: number;
    name: string;
    slug: string;
  };
  city?: {
    id: number;
    name: string;
    slug: string;
  };
  town?: {
    id: number;
    name: string;
    slug: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  address?: string;
  address_line1?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone?: string;
  description?: string;
  keywords?: string[];
  logo_url?: string;
  image_url?: string;
  premium_content?: string;
  premium_images?: string[];
  premium_sidebar?: {
    sidebar_highlight?: string;
    services?: string[];
    contact_email?: string;
    opening_hours?: string;
  };
}

async function fetchBusiness(slug: string): Promise<Business | null> {
  try {
    const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${baseUrl}/api/listings/businesses/${slug}/`, {
      // Enable ISR (Incremental Static Regeneration)
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch business: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  
  const business = await fetchBusiness(slug);
  
  if (!business) {
    notFound();
  }

  // Always redirect to the canonical location-first URL
  if (business.canonical_path) {
    redirect(business.canonical_path);
  }

  // This should only render if canonical_path is not available (fallback)
  return <BusinessDetailPageClient business={business} lang={lang} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const business = await fetchBusiness(slug);

  if (!business) {
    return {
      title: 'Business Not Found | ListAcrossEU',
    };
  }

  const cityName = business.city?.name || '';
  const countryName = business.country?.name || '';
  const categoryName = business.category?.name || 'Business';
  
  const title = `${business.name} in ${cityName} | ListAcrossEU`;
  const description = `${categoryName} in ${cityName}, ${countryName}. Professional services and reliable business information on ListAcrossEU.`;

  // Construct full address for JSON-LD
  const address = {
    "@type": "PostalAddress",
    addressCountry: business.country?.name,
    addressLocality: business.city?.name,
    ...(business.address_line1 && { streetAddress: business.address_line1 }),
    ...(business.postal_code && { postalCode: business.postal_code }),
  };

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    ...(business.category?.name && { 
      "@type": ["LocalBusiness", business.category.name.includes('Restaurant') ? "Restaurant" : "LocalBusiness"]
    }),
    address,
    ...(business.phone && { telephone: business.phone }),
    ...(business.website && { url: business.website }),
    ...(business.description && { description: business.description }),
    ...(business.latitude && business.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: business.latitude,
        longitude: business.longitude,
      }
    }),
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(business.logo_url && { images: [business.logo_url] }),
    },
    other: {
      'application/ld+json': JSON.stringify(jsonLd),
    },
  };
}