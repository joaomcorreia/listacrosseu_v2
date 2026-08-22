import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchBusinessDetail } from "@/lib/api";
import { BusinessDetailPageClient } from "@/components/business/BusinessDetailPageClient";
import Layout from "@/components/Layout";
import { getBusinessCanonicalPath } from "@/lib/businessUrls";
import { fetchBusinessDiscovery } from '@/lib/business-discovery';

type Props = {
  params: Promise<{
    lang: string;
    slug: string[];
  }>;
};

const BUSINESS_LANGUAGES = ["en", "fr", "de", "es", "pt", "nl"] as const;

function businessHreflangs(path: string): Record<string, string> {
  return Object.fromEntries(
    BUSINESS_LANGUAGES.map((language) => [
      language,
      path.replace(/^\/[^/]+(?=\/|$)/, `/${language}`),
    ]),
  );
}

// Helper function to resolve business from URL segments
async function resolveBusiness(segments: string[], lang: string) {
  // We expect either 2 or 3 segments: [city, business] or [city, location, business]
  if (segments.length < 2 || segments.length > 3) {
    return null;
  }

  // Exclude known static routes from business resolution
  const staticRoutes = ['about', 'admin', 'ai-visibility', 'blog', 'business', 'businesses', 'business-visibility', 'categories', 'check-email', 'cities', 'claim', 'cookies', 'countries', 'dashboard', 'generated', 'generated-business-website', 'get-found-online', 'how-it-works', 'list-your-business', 'locations', 'login', 'places', 'premium-preview', 'pricing', 'privacy', 'promote-your-business-free', 'search', 'signup', 'terms', 'towns', 'verify', 'verify-account'];
  if (staticRoutes.includes(segments[0])) {
    return null;
  }

  const [citySlug, locationOrBusiness, businessSlug] = segments;
  
  try {
    if (segments.length === 2) {
      // Format: /[city]/[business]
      const business = await fetchBusinessDetail({ slug: locationOrBusiness, lang });
      
      // Verify this business actually belongs to this city
      if (business.city?.slug !== citySlug) {
        return null;
      }
      
      return { business, isCanonical: true };
    } else {
      // Format: /[city]/[location]/[business] 
      const business = await fetchBusinessDetail({ slug: businessSlug, lang });
      
      // Verify business belongs to this city and location
      if (business.city?.slug !== citySlug || business.town?.slug !== locationOrBusiness) {
        return null;
      }
      
      return { business, isCanonical: true };
    }
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const result = await resolveBusiness(slug, lang);

  if (!result) {
    return {
      title: "Business Not Found | ListAcrossEU",
      description: "The requested business could not be found.",
    };
  }

  const { business } = result;
  const title = `${business.name} in ${business.city?.name || business.country.name} | ListAcrossEU`;
  
  let description: string;
  if (business.tier === "free") {
    description = `${business.name} - ${business.category?.name || "Business"} in ${business.city?.name || business.country.name}. Find contact details on ListAcrossEU.`;
  } else {
    description = business.description 
      ? business.description.slice(0, 160) + (business.description.length > 160 ? "..." : "")
      : `${business.name} - ${business.category?.name || "Business"} in ${business.city?.name || business.country.name}. Find contact details on ListAcrossEU.`;
  }

  const canonicalPath = getBusinessCanonicalPath(business, lang);
  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: businessHreflangs(canonicalPath),
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: getBusinessCanonicalPath(business, lang),
      images: business.logo_url ? [
        {
          url: business.logo_url,
          width: 800,
          height: 600,
          alt: `${business.name} logo`,
        }
      ] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: business.logo_url ? [business.logo_url] : [],
    },
  };
}

export default async function LocationBusinessPage({ params }: Props) {
  const { lang, slug } = await params;
  const result = await resolveBusiness(slug, lang);

  if (!result) {
    notFound();
  }

  const { business, isCanonical } = result;
  const currentPath = `/${lang}/${slug.join('/')}`;
  const canonicalPath = getBusinessCanonicalPath(business, lang);

  // If the current URL doesn't match the canonical path, redirect
  if (!isCanonical || currentPath !== canonicalPath) {
    redirect(canonicalPath);
  }

  // Generate JSON-LD structured data (server-side)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description || `${business.name} - ${business.category?.name || "Business"}`,
    ...(business.category && {
      "@type": business.category.name.toLowerCase().includes("restaurant") ? "Restaurant" : "LocalBusiness",
    }),
    address: business.address ? {
      "@type": "PostalAddress",
      streetAddress: business.address_line1 || business.address,
      addressLocality: business.city?.name,
      addressCountry: business.country.name,
      postalCode: business.postal_code,
    } : undefined,
    telephone: business.phone || undefined,
    url: business.website || undefined,
    image: business.logo_url || business.image_url || undefined,
    ...(business.latitude && business.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: business.latitude,
        longitude: business.longitude,
      },
    }),
    ...(business.tier === 'premium' && business.premium_sidebar?.services && {
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: business.premium_sidebar.services.map((service: string, index: number) => ({
          "@type": "Offer",
          name: service,
          position: index + 1,
        }))
      }
    }),
  };

  // Clean up undefined fields
  Object.keys(jsonLd).forEach(key => 
    jsonLd[key as keyof typeof jsonLd] === undefined && delete jsonLd[key as keyof typeof jsonLd]
  );

  const discovery = await fetchBusinessDiscovery(business, lang);

  return (
    <Layout>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <BusinessDetailPageClient business={business} lang={lang} discovery={discovery} />
    </Layout>
  );
}
