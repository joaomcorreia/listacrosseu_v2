import PublicGeneratedWebsiteClient from '@/components/premium/PublicGeneratedWebsiteClient';

export default async function GeneratedWebsiteHostPage({ searchParams, params }: { searchParams: Promise<{ preview_token?: string }>; params: Promise<{ slug: string }> }) {
  const [{ preview_token }, { slug }] = await Promise.all([searchParams, params]);
  return <PublicGeneratedWebsiteClient slug={slug} lang="en" previewToken={preview_token} />;
}
