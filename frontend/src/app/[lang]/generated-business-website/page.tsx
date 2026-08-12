import Layout from '@/components/Layout';
import ManagedDirectoryPageClient from '@/components/ManagedDirectoryPageClient';
import { generateSEO } from '@/lib/seo';
import { fetchDirectorySEO } from '@/lib/directory-content';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const cms = await fetchDirectorySEO('landing', 'generated-business-website');
  return generateSEO({ title: cms?.seo_title || 'ListAcrossEU Generated Website', description: cms?.meta_description || 'Turn your claimed ListAcrossEU business listing into a simple generated website with a free 30-day trial.', canonical: `/${lang}/generated-business-website` }, lang);
}

export default async function GeneratedBusinessWebsitePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout><ManagedDirectoryPageClient lang={lang} scope="landing" slug="generated-business-website" defaults={{ hero_image: '', title: 'ListAcrossEU Generated Website', subtitle: 'Turn a claimed business listing into a simple professional website.', intro: 'Start with a free listing, claim and manage it, then try a generated business website free for 30 days. It costs €9.95/month + VAT if you keep it after the trial. Custom domain options are coming next.', cta_label: 'Try Your Generated Website Free', cta_href: `/${lang}/pricing` }} /></Layout>;
}
