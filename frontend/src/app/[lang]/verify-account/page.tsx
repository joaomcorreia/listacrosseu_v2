import AccountVerificationClient from '@/components/AccountVerificationClient';
export default async function VerifyAccountPage({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return <AccountVerificationClient lang={lang} />; }
