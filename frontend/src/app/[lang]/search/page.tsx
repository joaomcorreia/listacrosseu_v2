import Layout from "@/components/Layout";
import SearchPageClient from "@/components/SearchPageClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateSEO } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return generateSEO(
    {
      title: "Search businesses",
      description: "Search businesses and services across Europe on ListAcross EU.",
      canonical: `/${lang}/search`,
      noindex: true,
    },
    lang,
  );
}

export default function SearchLangPage() {
  return (
    <Layout headerExtra={<Breadcrumbs current="Directory" />}>
      <SearchPageClient />
    </Layout>
  );
}
