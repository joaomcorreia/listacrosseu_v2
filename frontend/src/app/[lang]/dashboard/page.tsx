import DashboardPageClient from '@/components/dashboard/DashboardPageClient';

export default async function DashboardPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ business?: string }> }) {
  const { lang } = await params;
  const { business } = await searchParams;
  return <DashboardPageClient lang={lang} initialBusinessId={business ? Number(business) : undefined} />;
}
