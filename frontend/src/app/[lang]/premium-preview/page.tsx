import PremiumPreviewClient from '@/components/premium/PremiumPreviewClient';
import type { GeneratedWebsitePage } from '@/components/premium/generated-page-schema';

export default async function PremiumPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ business?: string; page?: string }>;
}) {
  const { lang } = await params;
  const { business, page } = await searchParams;
  const allowedPages: GeneratedWebsitePage[] = ['home', 'about', 'services', 'gallery', 'faq', 'contact'];
  const activePage = allowedPages.includes(page as GeneratedWebsitePage) ? page as GeneratedWebsitePage : 'home';

  return <div className="min-h-screen bg-gray-50 px-4 py-8">{business ? <PremiumPreviewClient businessId={business} lang={lang} activePage={activePage} /> : <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-slate-900">Your Website</h1><p className="mt-3 text-slate-600">Open this preview from your business dashboard.</p><a className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-semibold text-white" href={`/${lang}/dashboard`}>Back to Listing</a></div>}</div>;
}
