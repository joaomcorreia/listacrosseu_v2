import DashboardPageClient from '@/components/dashboard/DashboardPageClient';

export default async function DashboardPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ business?: string; section?: string; setup?: string }> }) {
  const { lang } = await params;
  const { business, section, setup } = await searchParams;
  const initialPanel = section === 'claimed-listing' ? 'claimed-listing' : section === 'password' ? 'password' : 'overview';
  return <DashboardPageClient lang={lang} initialBusinessId={business ? Number(business) : undefined} initialPanel={setup === 'password' ? 'password' : initialPanel} passwordSetupRequired={setup === 'password'} />;
}
