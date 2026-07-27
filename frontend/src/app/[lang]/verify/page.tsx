import Layout from "@/components/Layout";
import Container from "@/components/Container";
import VerifyPageClient from "@/components/VerifyPageClient";

export default function VerifyPage() {
  return (
    <Layout headerVariant="overlay">
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <Container className="py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Verify your business claim
          </h1>
          <p className="mt-4 text-base text-blue-100">
            Confirm ownership to publish your verified listing.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <VerifyPageClient />
        </Container>
      </section>
    </Layout>
  );
}
