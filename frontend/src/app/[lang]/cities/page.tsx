import Layout from "@/components/Layout";
import InnerPageHero from "@/components/InnerPageHero";
import CitiesPageClient from "@/components/CitiesPageClient";

export default async function CitiesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <Layout>
      <InnerPageHero variant="tall" title="Cities" description="Find businesses, services, and local expertise in European cities." breadcrumbs={[{ label: 'Home', href: `/${lang}` }, { label: 'Cities' }]} />
      <section className="py-16"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><CitiesPageClient /></div></section>
    </Layout>
  );
}
