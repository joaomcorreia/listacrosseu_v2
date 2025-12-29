import Layout from "@/components/Layout";
import SearchPageClient from "@/components/SearchPageClient";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function SearchLangPage() {
  return (
    <Layout headerExtra={<Breadcrumbs current="Directory" />}>
      <SearchPageClient />
    </Layout>
  );
}