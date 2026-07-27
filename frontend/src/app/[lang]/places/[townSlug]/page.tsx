import { Metadata } from "next";
import { notFound } from "next/navigation";
import TownPageClient from "@/app/[lang]/towns/[town_slug]/TownPageClient";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";

interface PageProps {
  params: Promise<{
    lang: string;
    townSlug: string;
  }>;
}

async function getTownData(townSlug: string) {
  try {
    const response = await fetch(
      `${INTERNAL_BACKEND_URL}/api/geo/towns/${townSlug}/`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch town data:", error);
    return null;
  }
}

async function getTownBusinesses(townSlug: string) {
  try {
    const response = await fetch(
      `${INTERNAL_BACKEND_URL}/api/geo/towns/${townSlug}/businesses/?limit=20`,
      {
        next: { revalidate: 1800 },
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch town businesses:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { townSlug } = await params;
  const townData = await getTownData(townSlug);

  if (!townData) {
    return {
      title: "Town Not Found",
    };
  }

  const townName = townData.name;
  const cityName = townData.city?.name || "";
  const countryName = townData.city?.country?.name || "";

  return {
    title: `Businesses in ${townName}, ${cityName}, ${countryName} | ListAcrossEU`,
    description: `Discover local businesses and services in ${townName}, ${cityName}, ${countryName}. Browse our comprehensive directory of companies, shops, and services.`,
    openGraph: {
      title: `Businesses in ${townName}, ${cityName}, ${countryName}`,
      description: `Find local businesses in ${townName}`,
      type: "website",
    },
  };
}

export default async function TownPlacePage({ params }: PageProps) {
  const { townSlug } = await params;

  const [townData, businessesData] = await Promise.all([
    getTownData(townSlug),
    getTownBusinesses(townSlug),
  ]);

  if (!townData) {
    notFound();
  }

  return (
    <TownPageClient
      townData={townData}
      initialBusinessesData={businessesData}
      townSlug={townSlug}
    />
  );
}

