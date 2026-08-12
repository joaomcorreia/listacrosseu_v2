import Layout from '@/components/Layout';
import ManagedDirectoryPageClient from '@/components/ManagedDirectoryPageClient';
import { generateSEO } from '@/lib/seo';
import { fetchDirectorySEO } from '@/lib/directory-content';
import { hasUsefulCityDirectoryData } from '@/lib/directory-indexability';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const cms = await fetchDirectorySEO('landing', 'free-business-listing-antwerp');
  return generateSEO({ title: cms?.seo_title || 'Free Business Listings in Antwerp', description: cms?.meta_description || 'Discover Antwerp businesses on ListAcrossEU and create or claim a free public business listing.', canonical: `/${lang}/free-business-listing-antwerp`, noindex: !(await hasUsefulCityDirectoryData('antwerp')) }, lang);
}

export default async function AntwerpFreeListingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout><ManagedDirectoryPageClient lang={lang} scope="landing" slug="free-business-listing-antwerp" listing={{ city: 'antwerp', heading: 'Businesses in Antwerp' }} defaults={{ hero_image: '', title: 'Free Business Listings in Antwerp', subtitle: 'Discover Antwerp businesses and services on ListAcrossEU.', intro: 'Browse the current Antwerp directory and list your own business for free. Owners can claim and manage their listing through the normal verification flow.', cta_label: 'List your business for free', cta_href: `/${lang}/list-your-business` }} /></Layout>;
}
