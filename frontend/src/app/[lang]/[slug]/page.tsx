import Layout from '@/components/Layout';
import ManagedDirectoryPageClient from '@/components/ManagedDirectoryPageClient';
import { generateSEO } from '@/lib/seo';
import { fetchDirectorySEO } from '@/lib/directory-content';
import { hasUsefulCityDirectoryData } from '@/lib/directory-indexability';

type Landing = {
  title: string;
  subtitle: string;
  intro: string;
  description: string;
  hero_image: string;
  cta_label: string;
  listing?: { country?: string; city?: string; heading: string };
};

const LANDINGS: Record<string, Landing> = {
  'get-your-business-online-free': {
    title: 'Get Your Business Online Free', subtitle: 'Give customers a useful place to find your business without an upfront listing fee.', description: 'Start a free business listing on ListAcrossEU, then claim it when you are ready to manage it.', intro: 'Start with a factual ListAcrossEU business listing, then claim it when you are ready to manage the details. A free listing is a practical first step for a business that needs a discoverable online presence.', hero_image: '/images/eu-map.png', cta_label: 'Try Your Generated Website Free',
  },
  'get-your-small-business-online-fast': {
    title: 'Get Your Small Business Online Fast', subtitle: 'Set up a clear business presence in a few focused steps.', description: 'A practical way for a small business to start an online presence with a free ListAcrossEU listing.', intro: 'Add your business to the directory, check the public information, and claim the listing if you manage it. When you want more than a directory entry, try the ListAcrossEU Generated Website free for 30 days.', hero_image: '/images/eu-map.png', cta_label: 'Try Your Generated Website Free',
  },
  'promote-your-business-for-free': {
    title: 'Promote Your Business for Free', subtitle: 'Help local customers discover what your business offers.', description: 'Promote a business with a factual, free local directory listing on ListAcrossEU.', intro: 'A public directory listing can support your existing marketing by making your business name, description, location, country, and category easier to browse. Claim the listing to manage it yourself.', hero_image: '/images/eu-map.png', cta_label: 'Try Your Generated Website Free',
  },
  'advertise-your-business-online-free': {
    title: 'Advertise Your Business Online Free', subtitle: 'Create a factual directory presence before you decide on paid promotion.', description: 'Advertise a business online free with a public ListAcrossEU directory listing.', intro: 'ListAcrossEU provides a free public listing route for businesses that want to be found by location and category. This is directory visibility, not a promise of rankings or guaranteed traffic. Claim your listing to keep it accurate.', hero_image: '/images/eu-map.png', cta_label: 'Try Your Generated Website Free',
  },
  'free-online-presence-for-small-business': {
    title: 'Free Online Presence for Small Business', subtitle: 'Start with a simple, useful business profile on ListAcrossEU.', description: 'Build a free online presence for a small business with a factual ListAcrossEU listing.', intro: 'Small businesses can begin with a free public listing and add context through a short factual description, location, country, and category. Claiming gives the owner a way to manage the listing before trying a generated website.', hero_image: '/images/eu-map.png', cta_label: 'Try Your Generated Website Free',
  },
  'create-a-business-page-free': {
    title: 'Create a Business Page for Free', subtitle: 'Give your business a dedicated public page in the directory.', description: 'Create a free public business page on ListAcrossEU and claim it when ready.', intro: 'Create a free listing so people can browse your business by country, city, and category. After claiming it, you can explore the ListAcrossEU Generated Website as a separate next step.', hero_image: '/images/eu-map.png', cta_label: 'Try Your Generated Website Free',
  },
  'put-your-business-online': {
    title: 'Put Your Business Online', subtitle: 'Make your business easier to discover in the places customers search.', description: 'Put a business online with a free ListAcrossEU listing, claim flow, and optional generated website.', intro: 'List your business free on ListAcrossEU, then claim it if you are the owner or manager. The directory is the starting point; the generated website is an optional next step for a claimed listing.', hero_image: '/images/eu-map.png', cta_label: 'Try Your Generated Website Free',
  },
  'free-business-listing-brussels': {
    title: 'Free Business Listings in Brussels', subtitle: 'Browse real businesses and local services in Brussels.', description: 'Browse free business listings in Brussels and add or claim a local business on ListAcrossEU.', intro: 'Explore the current Brussels directory on ListAcrossEU. Business owners can add a free listing and claim it later to manage the public information shown to visitors.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'brussels', heading: 'Businesses in Brussels' },
  },
  'free-business-listing-ghent': {
    title: 'Free Business Listings in Ghent', subtitle: 'Find local businesses and services in Ghent.', description: 'Browse free business listings in Ghent and add or claim a local business on ListAcrossEU.', intro: 'Browse real Ghent listings by name, description, location, and category where available. Add your own business free, then claim it if you manage the listing.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'ghent', heading: 'Businesses in Ghent' },
  },
  'free-business-listing-liege': {
    title: 'Free Business Listings in Liège', subtitle: 'Explore local businesses and services in Liège.', description: 'Browse free business listings in Liège and add or claim a local business on ListAcrossEU.', intro: 'Use the Liège directory to discover real businesses currently available in the local data. Owners can create a free listing and claim it through the normal verification flow.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'liege', heading: 'Businesses in Liège' },
  },
  'free-business-listing-charleroi': {
    title: 'Free Business Listings in Charleroi', subtitle: 'Browse businesses and services in Charleroi.', description: 'Browse free business listings in Charleroi and add or claim a local business on ListAcrossEU.', intro: 'Discover the current Charleroi listings on ListAcrossEU. If your business is not listed, you can add it free and claim it later to manage its public details.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'charleroi', heading: 'Businesses in Charleroi' },
  },
  'free-business-listing-leuven': {
    title: 'Free Business Listings in Leuven', subtitle: 'Find Leuven businesses and services in one local directory.', description: 'Browse free business listings in Leuven and add or claim a local business on ListAcrossEU.', intro: 'This Leuven landing page is ready for local directory data as City records become available. Add your business free, then claim it to manage the listing.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'leuven', heading: 'Businesses in Leuven' },
  },
  'free-business-listing-mechelen': {
    title: 'Free Business Listings in Mechelen', subtitle: 'Discover Mechelen businesses and local services.', description: 'Browse free business listings in Mechelen and add or claim a local business on ListAcrossEU.', intro: 'Browse the Mechelen directory when local records are available. Businesses can start with a free listing and claim it later to keep their public information accurate.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'mechelen', heading: 'Businesses in Mechelen' },
  },
  'free-business-listing-hasselt': {
    title: 'Free Business Listings in Hasselt', subtitle: 'Find local businesses and services in Hasselt.', description: 'Browse free business listings in Hasselt and add or claim a local business on ListAcrossEU.', intro: 'The Hasselt page uses live directory data when a matching City record is present. You can add a business free and claim it later through the normal owner flow.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'hasselt', heading: 'Businesses in Hasselt' },
  },
  'free-business-listing-bruges': {
    title: 'Free Business Listings in Bruges', subtitle: 'Explore local businesses and services in Bruges.', description: 'Browse free business listings in Bruges and add or claim a local business on ListAcrossEU.', intro: 'Use ListAcrossEU to browse Bruges businesses when local records are available. Owners can create a free listing, claim it, and then decide whether to try a generated website.', hero_image: '/images/flags/be.png', cta_label: 'Try Your Generated Website Free', listing: { city: 'bruges', heading: 'Businesses in Bruges' },
  },
};

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const landing = LANDINGS[slug];
  if (!landing) return {};
  const cms = await fetchDirectorySEO('landing', slug);
  const cityIndexable = !landing.listing?.city || await hasUsefulCityDirectoryData(landing.listing.city);
  return generateSEO({ title: cms?.seo_title || landing.title, description: cms?.meta_description || landing.description, canonical: `/${lang}/${slug}`, noindex: !cityIndexable }, lang);
}

export default async function DirectoryLandingPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const landing = LANDINGS[slug];
  if (!landing) return null;
  return <Layout><ManagedDirectoryPageClient lang={lang} scope="landing" slug={slug} listing={landing.listing} defaults={{ hero_image: landing.hero_image, title: landing.title, subtitle: landing.subtitle, intro: landing.intro, cta_label: landing.cta_label, cta_href: `/${lang}/generated-business-website`, seo_title: landing.title, meta_description: landing.description }} /></Layout>;
}
