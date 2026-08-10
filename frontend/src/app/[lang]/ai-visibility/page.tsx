import type { Metadata } from "next";
import VisibilityLandingPage, { getVisibilityPageCopy } from "@/components/visibility/VisibilityLandingPage";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getVisibilityPageCopy("ai-visibility");
  return {
    title: `${copy.title} | ListAcrossEU`,
    description: copy.description,
  };
}

export default async function AiVisibilityPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <VisibilityLandingPage lang={lang} kind="ai-visibility" />;
}
