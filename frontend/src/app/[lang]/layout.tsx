import type { ReactNode } from "react";
import { normalizeLang, type SupportedLang } from "@/lib/lang";
import { ListyWidget } from "@/components/listy/ListyWidget";

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
      {children}
      <ListyWidget />
    </>
  );
}