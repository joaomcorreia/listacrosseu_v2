import AuthPageClient from '@/components/dashboard/AuthPageClient';

export default async function SignupPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <AuthPageClient lang={lang} mode="signup" />;
}
