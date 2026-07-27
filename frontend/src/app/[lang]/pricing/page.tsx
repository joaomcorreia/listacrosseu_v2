import Layout from "@/components/Layout";
import Container from "@/components/Container";
import PricingPageClient from "@/components/PricingPageClient";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <Layout headerVariant="overlay">
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <Container className="py-20 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-blue-200">
            Pricing
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Plans for every business
          </h1>
          <p className="mt-6 text-lg text-blue-100">
            Pick the right plan to grow your visibility across Europe.
          </p>
        </Container>
      </section>

      <PricingPageClient lang={lang} />
    </Layout>
  );
}
