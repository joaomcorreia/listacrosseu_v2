import Layout from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import SectionRenderer from "@/components/sections/SectionRenderer";
import { fetchPage, type PageData } from "@/lib/api";

interface HomeLangPageProps {
  params: {
    lang: string;
  };
}

export default async function HomeLangPage({ params }: HomeLangPageProps) {
  let pageData: PageData;
  const { lang } = await params;
  
  try {
    pageData = await fetchPage('home', lang);
  } catch (error) {
    console.error('Failed to fetch homepage content:', error);
    // Fallback to a basic error page
    return (
      <>
        <TopHeader />
        <Layout>
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
      <TopHeader />
      <Layout>
        {activeSections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </Layout>
    </>
  );
}