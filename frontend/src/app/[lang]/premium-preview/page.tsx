import Layout from '@/components/Layout';
import PremiumPagePreview from '@/components/premium/PremiumPagePreview';

export default async function PremiumPreviewPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Demo business data
  const businessData = {
    id: "demo",
    slug: "premium-restaurant-example",
    name: "Premium Restaurant Example",
    category: { name: "Fine Dining Restaurant" },
    address: "123 Premium Street, Amsterdam, Netherlands",
    phone: "+31 20 123 4567",
    website: "www.premiumrestaurant.nl",
    description: "Experience exceptional dining at our premium restaurant where culinary artistry meets impeccable service. Our award-winning chefs create innovative dishes using locally sourced ingredients, providing an unforgettable gastronomic journey in an elegant atmosphere.",
    keywords: ["Fine Dining", "European Cuisine", "Wine Pairing", "Private Events", "Romantic Atmosphere"],
    city: { name: "Amsterdam" },
    country: { name: "Netherlands" },
    is_premium: true,
    tier: "premium" as const
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <PremiumPagePreview business={businessData} />
      </div>
    </Layout>
  );
}
