import Layout from "@/components/Layout";
import PricingPageClient from "@/components/PricingPageClient";
import InnerPageHero from "@/components/InnerPageHero";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <Layout>
      <InnerPageHero variant="compact" eyebrow="Pricing" title="Plans for every business" description="Pick the right plan to grow your visibility across Europe." breadcrumbs={[{ label: 'Home', href: `/${lang}` }, { label: 'Pricing' }]} />

      <PricingPageClient lang={lang} />
    </Layout>
  );
}
