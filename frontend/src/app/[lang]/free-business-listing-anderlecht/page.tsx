import Layout from '@/components/Layout';
import ManagedDirectoryPageClient from '@/components/ManagedDirectoryPageClient';
import { generateSEO } from '@/lib/seo';
import { fetchDirectorySEO } from '@/lib/directory-content';
import { hasUsefulCityDirectoryData } from '@/lib/directory-indexability';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const cms = await fetchDirectorySEO('landing', 'free-business-listing-anderlecht');
  return generateSEO({ title: cms?.seo_title || 'Free Business Listings in Anderlecht', description: cms?.meta_description || 'Find Anderlecht businesses and add your own free ListAcrossEU business listing.', canonical: `/${lang}/free-business-listing-anderlecht`, noindex: !(await hasUsefulCityDirectoryData('anderlecht')) }, lang);
}

export default async function AnderlechtFreeListingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout><ManagedDirectoryPageClient lang={lang} scope="landing" slug="free-business-listing-anderlecht" listing={{ city: 'anderlecht', heading: 'Businesses in Anderlecht' }} defaults={{ hero_image: '', title: 'Free Business Listings in Anderlecht', subtitle: 'Find local businesses in Anderlecht and add yours for free.', intro: 'Use the Anderlecht directory to discover local services. Businesses can create a free listing and claim it later to manage their public information.', cta_label: 'List your business for free', cta_href: `/${lang}/list-your-business` }} /></Layout>;
}
