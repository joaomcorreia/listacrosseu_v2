import CheckEmailClient from '@/components/CheckEmailClient';
export default async function CheckEmailPage({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return <CheckEmailClient lang={lang} />; }
