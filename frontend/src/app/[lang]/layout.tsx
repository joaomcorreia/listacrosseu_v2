import type { ReactNode } from "react";
import { normalizeLang, type SupportedLang } from "@/lib/lang";
import { ListyWidget } from "@/components/listy/ListyWidget";
import { generateSEO } from "@/lib/seo";
import StructuredData from "@/components/StructuredData";
import { generateWebsiteSchema } from "@/lib/schema";
import HtmlLang from "@/components/HtmlLang";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return generateSEO(
    {
      title: "European Business Directory",
      description:
        "Find and list local businesses across all EU countries. Free business listings, premium visibility, and comprehensive directory covering 27 EU nations.",
      canonical: `/${lang}`,
      keywords: [
        "EU business directory",
        "European companies",
        "local businesses Europe",
        "business listings EU",
        "find businesses Europe",
      ],
    },
    lang,
  );
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const normalizedLang = normalizeLang(lang);
  // We don't actually need to pass lang down here yet; client components will use useParams()
  return (
    <>
      <HtmlLang lang={normalizedLang} />
      {children}
      <ListyWidget />
      <StructuredData data={generateWebsiteSchema(normalizedLang)} />
    </>
  );
}
