import PublicGeneratedWebsiteClient from '@/components/premium/PublicGeneratedWebsiteClient';
import type { GeneratedWebsitePage } from '@/components/premium/generated-page-schema';

const PAGES: GeneratedWebsitePage[] = ['about', 'services', 'gallery', 'faq', 'contact'];

export default async function GeneratedWebsiteSubpage({ params }: { params: Promise<{ lang: string; slug: string; page: string }> }) {
  const { lang, slug, page } = await params;
  const activePage = PAGES.includes(page as GeneratedWebsitePage) ? page as GeneratedWebsitePage : 'home';
  return <PublicGeneratedWebsiteClient slug={slug} lang={lang} activePage={activePage} />;
}
