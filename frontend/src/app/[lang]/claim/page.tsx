import ClaimedListingClaimPageClient from '@/components/ClaimedListingClaimPageClient';
import Layout from '@/components/Layout';
import InnerPageHero from '@/components/InnerPageHero';

export default async function ClaimPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Layout showBlogSlider={false}><InnerPageHero variant="medium" eyebrow="CLAIM YOUR BUSINESS" title="Edit your Claimed Listing" description="Edit the same postcard presentation that will appear on your public business page." breadcrumbs={[{ label: 'Home', href: `/${lang}` }, { label: 'Claim your business' }]} /><ClaimedListingClaimPageClient lang={lang} /></Layout>;
}
