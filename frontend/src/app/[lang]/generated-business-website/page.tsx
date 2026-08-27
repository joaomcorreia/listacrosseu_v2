import Layout from '@/components/Layout';
import ManagedDirectoryPageClient from '@/components/ManagedDirectoryPageClient';
import { generateSEO } from '@/lib/seo';
import { fetchDirectorySEO } from '@/lib/directory-content';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const cms = await fetchDirectorySEO('landing', 'generated-business-website');
  return generateSEO({ title: cms?.seo_title || 'ListAcrossEU Generated Website', description: cms?.meta_description || 'Turn your claimed ListAcrossEU business listing into a simple generated website you can edit before payment and publishing.', canonical: `/${lang}/generated-business-website` }, lang);
}

export default async function GeneratedBusinessWebsitePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout><ManagedDirectoryPageClient lang={lang} scope="landing" slug="generated-business-website" defaults={{ hero_image: '', title: 'ListAcrossEU Generated Website', subtitle: 'Turn a claimed business listing into a simple professional website.', intro: 'Start with a free listing, claim and manage it, then edit your generated website before payment and publishing. Plans start at €9.95/month + VAT.', cta_label: 'Proceed to Payment and Publish', cta_href: `/${lang}/pricing` }} /></Layout>;
}
