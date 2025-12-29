import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import LocationsPageClient from "@/components/LocationsPageClient";

export default function LocationsPage() {
  return (
    <Layout headerExtra={<Breadcrumbs current="Locations" />}>
      {/* Hero Section */}
      <section className="relative isolate -mt-16 pt-16 bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Locations
            </h1>
            <p className="mt-6 text-xl leading-8 text-indigo-100">
              Explore local businesses in towns and regions across Europe
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Main content area */}
            <div className="lg:col-span-3">
              <LocationsPageClient />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 mt-12 lg:mt-0">
              <div className="sticky top-8 space-y-6">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">
                    How to Use
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                      1. Select a country above
                    </p>
                    <p className="text-sm text-slate-600">
                      2. Optionally filter by city
                    </p>
                    <p className="text-sm text-slate-600">
                      3. Browse towns and locations
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">
                    Quick Search
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Looking for businesses in a specific location?
                  </p>
                  <a
                    href="/en/search"
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    Search Businesses
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}