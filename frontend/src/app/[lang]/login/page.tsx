import AuthPageClient from '@/components/dashboard/AuthPageClient';

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <AuthPageClient lang={lang} mode="login" />;
}
