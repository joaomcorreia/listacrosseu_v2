import Layout from '@/components/Layout';
import PremiumPreviewClient from '@/components/premium/PremiumPreviewClient';

export default async function PremiumPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ business?: string }>;
}) {
  const { lang } = await params;
  const { business } = await searchParams;

  return <Layout><div className="min-h-screen bg-gray-50 px-4 py-8">{business ? <PremiumPreviewClient businessId={business} lang={lang} /> : <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold text-slate-900">Your Website</h1><p className="mt-3 text-slate-600">Open this preview from your business dashboard.</p><a className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-semibold text-white" href={`/${lang}/dashboard`}>Back to Listing</a></div>}</div></Layout>;
}
