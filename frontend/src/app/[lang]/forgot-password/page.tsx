import { ForgotPasswordClient } from '@/components/dashboard/PasswordRecoveryClient';

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <ForgotPasswordClient lang={lang} />;
}
