import Layout from "@/components/Layout";
import InnerPageHero from "@/components/InnerPageHero";
import CountriesPageClient from "@/components/CountriesPageClient";

export default async function CountriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <Layout>
      <InnerPageHero variant="tall" title="Countries" description="Explore local businesses and services across Europe." breadcrumbs={[{ label: 'Home', href: `/${lang}` }, { label: 'Countries' }]} />
      <section className="py-16"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><CountriesPageClient /></div></section>
    </Layout>
  );
}
