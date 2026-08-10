import type { Metadata } from "next";
import VisibilityLandingPage, { getVisibilityPageCopy } from "@/components/visibility/VisibilityLandingPage";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getVisibilityPageCopy("get-found-online");
  return {
    title: `${copy.title} | ListAcrossEU`,
    description: copy.description,
  };
}

export default async function GetFoundOnlinePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <VisibilityLandingPage lang={lang} kind="get-found-online" />;
}
