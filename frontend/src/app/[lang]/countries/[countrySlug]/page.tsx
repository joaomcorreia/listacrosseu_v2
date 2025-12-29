import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import CountryPageClient from "@/components/CountryPageClient";

interface CountryPageProps {
  params: Promise<{
    lang: string;
    countrySlug: string;
  }>;
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { lang, countrySlug } = await params;
  
  return (
    <Layout>
      <CountryPageClient countrySlug={countrySlug} />
    </Layout>
  );
}