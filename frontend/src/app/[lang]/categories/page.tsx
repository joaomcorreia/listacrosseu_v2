import Layout from "@/components/Layout";
import InnerPageHero from "@/components/InnerPageHero";
import CategoriesPageClient from "@/components/CategoriesPageClient";
import { generateSEO } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return generateSEO(
    {
      title: "Business categories",
      description: "Browse European businesses by category on ListAcross EU.",
      canonical: `/${lang}/categories`,
    },
    lang,
  );
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <Layout>
      <InnerPageHero variant="tall" title="Categories" description="Browse European businesses by the work they do." breadcrumbs={[{ label: 'Home', href: `/${lang}` }, { label: 'Categories' }]} />
      <section className="py-16"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><CategoriesPageClient /></div></section>
    </Layout>
  );
}
