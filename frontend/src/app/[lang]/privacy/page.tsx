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
      title: pages.privacyTitle,
      description: pages.privacyDescription,
      canonical: `/${normalized}/privacy`,
    },
    normalized,
  );
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const normalized = normalizeLang(lang);
  const t = getTranslations(normalized);
  const legal = t.legal;

  return (
    <Layout headerExtra={<Breadcrumbs current={legal.privacy.title} />}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900">
          {legal.privacy.title}
        </h1>
        <p className="mt-4 text-lg text-slate-700">
          {legal.privacy.intro}
        </p>
        <p className="mt-4 text-slate-600">
          {legal.privacy.body}
        </p>
      </div>
    </Layout>
  );
}
