import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import CountriesPageClient from "@/components/CountriesPageClient";
import Container from "@/components/Container";
import AdPlaceholder from "@/components/ads/AdPlaceholder";

export default function CountriesPage() {
  return (
    <Layout 
      headerVariant="overlay" 
      headerExtra={<Breadcrumbs current="Countries" />}
    >
      {/* Hero Section */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <Container className="py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Countries
            </h1>
            <p className="mt-6 text-xl leading-8 text-blue-100">
              Explore businesses and opportunities across European countries
            </p>
          </div>
        </Container>
      </section>

      {/* Banner Ad */}
      <Container className="py-4">
        <AdPlaceholder variant="banner" className="mb-8" />
      </Container>

      {/* Main Content */}
      <section className="py-16">
        <Container className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Main content area */}
          <div className="lg:col-span-3">
            <CountriesPageClient />
          </div>

          {/* Sidebar with ads and stats */}
          <div className="lg:col-span-1 mt-12 lg:mt-0">
            <div className="sticky top-8 space-y-6">
              <AdPlaceholder variant="sidebar" />
              
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  About Countries
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    Discover business opportunities across European markets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </Layout>
  );
}