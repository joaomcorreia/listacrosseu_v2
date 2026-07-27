import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TownPageClient from './TownPageClient';
import { INTERNAL_BACKEND_URL } from '@/lib/env.server';

interface PageProps {
  params: Promise<{
    lang: string;
    town_slug: string;
  }>;
}

// This function will be called at build time for static generation
async function getTownData(townSlug: string) {
  try {
    const response = await fetch(
      `${INTERNAL_BACKEND_URL}/api/geo/towns/${townSlug}/`,
      { 
        next: { revalidate: 3600 } // Revalidate every hour
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch town data:', error);
    return null;
  }
}

async function getTownBusinesses(townSlug: string) {
  try {
    const response = await fetch(
      `${INTERNAL_BACKEND_URL}/api/geo/towns/${townSlug}/businesses/?limit=20`,
      { 
        next: { revalidate: 1800 } // Revalidate every 30 minutes
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch town businesses:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { town_slug } = await params;
  const townData = await getTownData(town_slug);
  
  if (!townData) {
    return {
      title: 'Town Not Found',
    };
  }

  const townName = townData.name;
  const cityName = townData.city?.name || '';
  const countryName = townData.city?.country?.name || '';
  
  return {
    title: `Businesses in ${townName}, ${cityName}, ${countryName} | ListAcrossEU`,
    description: `Discover local businesses and services in ${townName}, ${cityName}, ${countryName}. Browse our comprehensive directory of companies, shops, and services.`,
    openGraph: {
      title: `Businesses in ${townName}, ${cityName}, ${countryName}`,
      description: `Find local businesses in ${townName}`,
      type: 'website',
    },
  };
}

export default async function TownPage({ params }: PageProps) {
  const { town_slug } = await params;
  
  const [townData, businessesData] = await Promise.all([
    getTownData(town_slug),
    getTownBusinesses(town_slug)
  ]);

  if (!townData) {
    notFound();
  }

  return (
    <TownPageClient
      townData={townData}
      initialBusinessesData={businessesData}
      townSlug={town_slug}
    />
  );
}
