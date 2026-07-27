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
          <LocationsPageClient />
        </div>
      </section>
    </Layout>
  );
}
