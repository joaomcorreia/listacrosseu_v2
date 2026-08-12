import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

export async function hasUsefulCityDirectoryData(citySlug: string): Promise<boolean> {
  try {
    const [citiesResponse, businessesResponse] = await Promise.all([
      fetch(`${PUBLIC_API_BASE_URL}/api/listings/cities/?country=be`, { cache: 'no-store' }),
      fetch(`${PUBLIC_API_BASE_URL}/api/listings/businesses/search/?country=be&city=${encodeURIComponent(citySlug)}&limit=1`, { cache: 'no-store' }),
    ]);
    if (!citiesResponse.ok || !businessesResponse.ok) return false;
    const cities = await citiesResponse.json();
    const businesses = await businessesResponse.json();
    return Array.isArray(cities) && cities.some((city: { slug?: string }) => city.slug === citySlug) && Number(businesses.total || 0) > 0;
  } catch {
    return false;
  }
}
