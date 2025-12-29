import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Layout from '@/components/Layout';
import TopHeader from '@/components/TopHeader';
import CityPageClient from './CityPageClient';

interface Props {
  params: Promise<{ 
    lang: string; 
    slug: string; 
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  
  // Capitalize slug for display name
  const cityName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  
  return {
    title: `Businesses in ${cityName} - ListAcrossEU`,
    description: `Discover local and micro businesses in ${cityName}. Browse our comprehensive directory of European businesses.`,
  };
}

export default async function CityPage({ params }: Props) {
  const { lang, slug } = await params;
  
  // Known slug corrections for legacy URLs
  const SLUG_FIXES: { [key: string]: string } = {
    'vilanovadegaia': 'vila-nova-de-gaia',
    // Add more as needed
  };
  
  // Check if this is an incorrect slug that needs correction
  if (SLUG_FIXES[slug]) {
    const correctSlug = SLUG_FIXES[slug];
    redirect(`/${lang}/cities/${correctSlug}`);
  }
  
  // Simple validation - ensure slug exists
  if (!slug || slug.length === 0) {
    notFound();
  }
  
  return (
    <>
      <TopHeader />
      <Layout>
        <CityPageClient lang={lang} slug={slug} />
      </Layout>
    </>
  );
}