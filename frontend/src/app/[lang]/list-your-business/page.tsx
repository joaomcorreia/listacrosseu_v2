import Layout from '@/components/Layout';
import ListYourBusinessPageClient from '@/components/ListYourBusinessPageClient';

export default async function ListYourBusinessPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout><ListYourBusinessPageClient lang={lang} /></Layout>;
}
