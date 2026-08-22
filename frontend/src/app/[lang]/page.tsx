import Layout from "@/components/Layout";
import SectionRenderer from "@/components/sections/SectionRenderer";
import AdPlaceholder from "@/components/ads/AdPlaceholder";
import { fetchPage, type PageData } from "@/lib/api";
import FlagCarousel from "@/components/FlagCarousel";
import { isSupportedLanguage } from "@/lib/lang";
import { notFound } from "next/navigation";

interface HomeLangPageProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function HomeLangPage({ params }: HomeLangPageProps) {
  let pageData: PageData;
  const { lang } = await params;
  if (!isSupportedLanguage(lang)) notFound();
  
  try {
    pageData = await fetchPage('home', lang);
  } catch (error) {
    console.error('Failed to fetch homepage content:', error);
    // Fallback to a basic error page
    return (
      <>
        <Layout headerVariant="overlay">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Unable to load page content
              </h1>
              <p className="text-gray-600">
                Please try again later or contact support.
              </p>
            </div>
          </div>
        </Layout>
      </>
    );
  }
  
  // Filter and sort active sections
  const activeSections = pageData.sections
    .filter(section => section.active)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <Layout headerVariant="overlay">
        {activeSections
          .filter(
            (section) =>
              section.type !== "listings_claimed" &&
              section.type !== "listings_premium",
          )
          .map((section, index) => (
          <div key={section.id}>
            <SectionRenderer section={section} />
            {index === 0 && <FlagCarousel />}
            {(index === 0 || (index + 1) % 3 === 0) && (
              <div className="py-8">
                <div className="mx-auto max-w-4xl px-4">
                  <AdPlaceholder variant="banner" />
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="py-8">
          <div className="mx-auto max-w-4xl px-4">
            <AdPlaceholder variant="banner" />
          </div>
        </div>
      </Layout>
    </>
  );
}
