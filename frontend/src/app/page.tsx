import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PublicGeneratedWebsiteClient from '@/components/premium/PublicGeneratedWebsiteClient';
import { resolveGeneratedWebsiteHost } from '@/lib/generated-host';
import { generatedWebsiteMetadata } from '@/lib/generated-seo';

export async function generateMetadata() {
  const host = (await headers()).get('host') || '';
  const slug = resolveGeneratedWebsiteHost(host);
  return slug ? generatedWebsiteMetadata(slug) : { title: 'ListAcrossEU' };
}

export default async function RootPage({ searchParams }: { searchParams: Promise<{ preview_token?: string }> }) {
  const host = (await headers()).get('host') || '';
  const slug = resolveGeneratedWebsiteHost(host);
  if (slug) {
    const { preview_token } = await searchParams;
    return <PublicGeneratedWebsiteClient slug={slug} lang="en" previewToken={preview_token} />;
  }
  // Default language: en
  redirect("/en");
}
