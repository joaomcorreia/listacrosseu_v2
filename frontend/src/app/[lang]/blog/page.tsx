import Layout from "@/components/Layout";
import BlogListPageClient from "@/components/BlogListPageClient";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function BlogLangPage() {
  return (
    <Layout headerExtra={<Breadcrumbs current="Blog" />}>
      <BlogListPageClient />
    </Layout>
  );
}