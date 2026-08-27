import PublicGeneratedWebsiteClient from '@/components/premium/PublicGeneratedWebsiteClient';
import type { GeneratedWebsitePage } from '@/components/premium/generated-page-schema';

export default async function GeneratedWebsiteHostPage({ searchParams, params }: { searchParams: Promise<{ preview_token?: string; page?: string }>; params: Promise<{ slug: string }> }) {
  const [{ preview_token, page }, { slug }] = await Promise.all([searchParams, params]);
  const allowedPages: GeneratedWebsitePage[] = ['home', 'about', 'services', 'gallery', 'faq', 'contact'];
  const activePage = allowedPages.includes(page as GeneratedWebsitePage) ? page as GeneratedWebsitePage : 'home';
  return <PublicGeneratedWebsiteClient slug={slug} lang="en" previewToken={preview_token} activePage={activePage} />;
}
