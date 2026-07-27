import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CategoriesPage({
  params,
}: {
  params: { lang: string };
}) {
  return (
    <Layout headerExtra={<Breadcrumbs current="Categories" />}>
      <section className="py-20">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Categories
          </h1>
          <p className="mt-4 text-base text-slate-600">Coming soon</p>
          <p className="mt-2 text-xs text-slate-400">Language: {params.lang}</p>
        </div>
      </section>
    </Layout>
  );
}
