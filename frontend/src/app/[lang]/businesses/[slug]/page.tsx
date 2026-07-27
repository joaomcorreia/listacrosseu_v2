import Layout from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import BusinessDetailPageClient from "@/components/business/BusinessDetailPageClient";

export default function BusinessDetailLangPage() {
  return (
    <>
      <TopHeader />
      <Layout withTopHeader>
        <BusinessDetailPageClient />
      </Layout>
    </>
  );
}

// Force rebuild
