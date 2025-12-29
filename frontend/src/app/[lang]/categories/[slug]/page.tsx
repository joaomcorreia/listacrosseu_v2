import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import CategoryDetailClient from "@/components/CategoryDetailClient";

interface CategoryPageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { lang, slug } = await params;
  
  return (
    <Layout headerExtra={<Breadcrumbs current="Categories" />}>
      <CategoryDetailClient categorySlug={slug} lang={lang} />
    </Layout>
  );
}