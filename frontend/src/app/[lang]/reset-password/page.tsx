import { ResetPasswordClient } from '@/components/dashboard/PasswordRecoveryClient';

export default async function ResetPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <ResetPasswordClient lang={lang} />;
}
