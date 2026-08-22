import ListingSubmissionConfirmationClient from '@/components/ListingSubmissionConfirmationClient';
export default async function ConfirmationPage({ params }: { params: Promise<{ lang: string }> }) { const { lang } = await params; return <ListingSubmissionConfirmationClient lang={lang} />; }
