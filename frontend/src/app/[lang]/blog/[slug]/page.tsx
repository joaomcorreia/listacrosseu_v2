import Layout from "@/components/Layout";
import BlogPostPageClient from "@/components/BlogPostPageClient";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function BlogPostLangPage() {
  return (
    <Layout headerExtra={<Breadcrumbs current="Blog" />}>
      <BlogPostPageClient />
    </Layout>
  );
}