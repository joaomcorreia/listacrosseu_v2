import Layout from "@/components/Layout";

export default function HowItWorksPage() {
  return (
    <Layout>
      <section className="py-20">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            How it works
          </h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">1. Find or list</h2><p className="mt-2 text-sm text-slate-600">Browse the directory or create a free listing for your business.</p></div>
            <div className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">2. Claim ownership</h2><p className="mt-2 text-sm text-slate-600">Owners can verify and manage an existing listing.</p></div>
            <div className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">3. Manage your listing</h2><p className="mt-2 text-sm text-slate-600">Use the dashboard to update supported details and create a website draft.</p></div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
