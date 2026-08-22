import GeneratedWebsiteDashboardClient from '@/components/dashboard/GeneratedWebsiteDashboardClient';

export default async function GeneratedWebsiteDashboardPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ business?: string }> }) {
  const { lang } = await params;
  const { business } = await searchParams;
  return <GeneratedWebsiteDashboardClient lang={lang} businessId={business} />;
}
