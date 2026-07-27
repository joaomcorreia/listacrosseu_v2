import Layout from "@/components/Layout";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateSEO } from "@/lib/seo";
import { normalizeLang } from "@/lib/lang";
import { getTranslations } from "@/i18n/translations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const normalized = normalizeLang(lang);
  const t = getTranslations(normalized);
  const pages = t.pages;

  return generateSEO(
    {
      title: pages.termsTitle,
      description: pages.termsDescription,
      canonical: `/${normalized}/terms`,
    },
    normalized,
  );
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const normalized = normalizeLang(lang);
  const t = getTranslations(normalized);
  const legal = t.legal;

  return (
    <Layout headerExtra={<Breadcrumbs current={legal.terms.title} />}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900">
          {legal.terms.title}
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          {legal.terms.intro}
        </p>
        <p className="mt-4 text-slate-600">
          {legal.terms.body}
        </p>
      </div>
    </Layout>
  );
}
