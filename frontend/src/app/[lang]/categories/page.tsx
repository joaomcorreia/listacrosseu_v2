import Layout from "@/components/Layout";
import InnerPageHero from "@/components/InnerPageHero";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <Layout>
      <InnerPageHero variant="tall" title="Categories" description="Browse European businesses by the work they do." breadcrumbs={[{ label: 'Home', href: `/${lang}` }, { label: 'Categories' }]} />
      <section className="py-20">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Categories
          </h2>
          <p className="mt-4 text-base text-slate-600">Coming soon</p>
          <p className="mt-2 text-xs text-slate-400">Language: {lang}</p>
        </div>
      </section>
    </Layout>
  );
}
