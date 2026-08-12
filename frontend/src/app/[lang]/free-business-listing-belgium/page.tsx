import Layout from '@/components/Layout';
import ManagedDirectoryPageClient from '@/components/ManagedDirectoryPageClient';
import { generateSEO } from '@/lib/seo';
import { fetchDirectorySEO } from '@/lib/directory-content';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const cms = await fetchDirectorySEO('landing', 'free-business-listing-belgium');
  return generateSEO({ title: cms?.seo_title || 'Free Business Listings in Belgium', description: cms?.meta_description || 'Browse businesses across Belgium and add or claim a free ListAcrossEU business listing.', canonical: `/${lang}/free-business-listing-belgium` }, lang);
}

export default async function BelgiumFreeListingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout><ManagedDirectoryPageClient lang={lang} scope="landing" slug="free-business-listing-belgium" listing={{ country: 'be', heading: 'Businesses in Belgium' }} defaults={{ hero_image: '', title: 'Free Business Listings in Belgium', subtitle: 'Browse Belgian businesses and add your own listing for free.', intro: 'Explore local businesses across Belgium, claim a listing you manage, and keep your business information available to people searching locally.', cta_label: 'List your business for free', cta_href: `/${lang}/list-your-business` }} /></Layout>;
}
