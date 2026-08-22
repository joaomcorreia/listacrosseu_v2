import type { Metadata } from 'next';
import PublicGeneratedWebsiteClient from '@/components/premium/PublicGeneratedWebsiteClient';
import { generatedWebsiteMetadata } from '@/lib/generated-seo';

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const metadata = await generatedWebsiteMetadata(slug);
  return { ...metadata, alternates: { canonical: `/${lang}/generated/${slug}` } };
}

export default async function GeneratedWebsitePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  return <PublicGeneratedWebsiteClient slug={slug} lang={lang} />;
}
