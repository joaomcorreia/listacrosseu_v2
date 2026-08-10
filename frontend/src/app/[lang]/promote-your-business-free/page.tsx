import type { Metadata } from "next";
import VisibilityLandingPage, { getVisibilityPageCopy } from "@/components/visibility/VisibilityLandingPage";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getVisibilityPageCopy("promote-your-business-free");
  return {
    title: `${copy.title} | ListAcrossEU`,
    description: copy.description,
  };
}

export default async function PromoteYourBusinessFreePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <VisibilityLandingPage lang={lang} kind="promote-your-business-free" />;
}
