import Layout from '@/components/Layout';
import ListYourBusinessOnboardingClient from '@/components/ListYourBusinessOnboardingClient';

export default async function ListYourBusinessPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout showBlogSlider={false}><ListYourBusinessOnboardingClient lang={lang} /></Layout>;
}
