import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import CitiesPageClient from "@/components/CitiesPageClient";
import Container from "@/components/Container";
import AdPlaceholder from "@/components/ads/AdPlaceholder";

export default function CitiesPage() {
  return (
    <Layout 
      headerVariant="overlay" 
      headerExtra={<Breadcrumbs current="Cities" />}
    >
      {/* Hero Section */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <Container className="py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Cities
            </h1>
            <p className="mt-6 text-xl leading-8 text-emerald-100">
              Discover vibrant business communities in European cities
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
            <CitiesPageClient />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-12 lg:mt-0">
            <div className="sticky top-8 space-y-6">
              <AdPlaceholder variant="sidebar" />
              
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  Browse by Location
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    Explore businesses by city and country across Europe.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4">
                  Quick Search
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Looking for businesses in a specific city?
                </p>
                <a
                  href="/en/search"
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Search Businesses
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </Layout>
  );
}