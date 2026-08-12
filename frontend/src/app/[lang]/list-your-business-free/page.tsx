import Layout from '@/components/Layout';
import ManagedDirectoryPageClient from '@/components/ManagedDirectoryPageClient';
import { generateSEO } from '@/lib/seo';
import { fetchDirectorySEO } from '@/lib/directory-content';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const cms = await fetchDirectorySEO('landing', 'list-your-business-free');
  return generateSEO({ title: cms?.seo_title || 'List Your Business for Free', description: cms?.meta_description || 'Add your business to ListAcrossEU with a free public listing, then claim and manage it when you are ready.', canonical: `/${lang}/list-your-business-free` }, lang);
}

export default async function ListYourBusinessFreePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout><ManagedDirectoryPageClient lang={lang} scope="landing" slug="list-your-business-free" defaults={{ hero_image: '', title: 'List Your Business for Free', subtitle: 'Create a free public business listing on ListAcrossEU.', intro: 'Add your business, help people find you across Europe, and keep your public listing free. Claim it later to manage the information shown to customers.', cta_label: 'List your business for free', cta_href: `/${lang}/list-your-business` }} /></Layout>;
}
