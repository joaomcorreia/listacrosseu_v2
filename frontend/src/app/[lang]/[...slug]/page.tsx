import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchBusinessDetail } from "@/lib/api";
import { BusinessDetailPageClient } from "@/components/business/BusinessDetailPageClient";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import Layout from "@/components/Layout";

type Props = {
  params: Promise<{
    lang: string;
    slug: string[];
  }>;
};

// Helper function to resolve business from URL segments
async function resolveBusiness(segments: string[], lang: string) {
  // We expect either 2 or 3 segments: [city, business] or [city, location, business]
  if (segments.length < 2 || segments.length > 3) {
    return null;
  }

  // Exclude known static routes from business resolution
  const staticRoutes = ['admin', 'blog', 'business', 'businesses', 'categories', 'cities', 'countries', 'list-your-business', 'locations', 'places', 'search', 'towns'];
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

  return {
    title,
    description,
    alternates: {
      canonical: business.canonical_path || `/${lang}/${slug.join('/')}`
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: business.canonical_path || `/${lang}/${slug.join('/')}`,
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
  const canonicalPath = business.canonical_path || currentPath;

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

  const related = business.tier === 'free' ? await fetchRelatedBusinesses(business) : { items: [], label: business.city?.name || business.country.name };

  return (
    <Layout>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <BusinessDetailPageClient business={business} lang={lang} relatedBusinesses={related.items} relatedHeading={related.label} />
    </Layout>
  );
}

async function fetchRelatedBusinesses(business: Awaited<ReturnType<typeof fetchBusinessDetail>>) {
  if (!business.city?.slug) return { items: [], label: business.country.name };
  const fetchResults = async (params: Record<string, string>) => {
    const searchParams = new URLSearchParams({ ...params, limit: '12', offset: '0' });
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/listings/businesses/search/?${searchParams.toString()}`, {
      next: { revalidate: 300 }, headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  };
  const seen = new Set<number>([business.id]);
  const related: any[] = [];
  const add = (items: any[]) => items.forEach((item) => { if (!seen.has(item.id)) { seen.add(item.id); related.push(item); } });
  add(await fetchResults({ city: business.city.slug }));
  let label = business.city.name;
  if (related.length < 6) { add(await fetchResults({ country: business.country.slug })); label = business.country.name; }
  if (related.length < 6 && business.category?.slug) add(await fetchResults({ country: business.country.slug, category: business.category.slug }));
  return { items: related.slice(0, 12), label };
}
