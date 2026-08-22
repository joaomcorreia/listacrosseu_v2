import { debugLog } from "@/lib/debug";
import { PUBLIC_API_BASE_URL } from "@/lib/env.public";
import { isPublicCategory } from "@/lib/public-categories";

/**
 * API client for listings/business directory endpoints
 * Connects to Django REST Framework backend
 */

const API_BASE_URL = PUBLIC_API_BASE_URL;

debugLog("API base URL:", API_BASE_URL);

// Type definitions matching Django serializers
export interface Country {
  id: number;
  name: string;
  slug: string;
  code?: string;
}

export interface CountryWithStats extends Country {
  business_count: number;
  city_count: number;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  country: Country;
}

export interface Town {
  id: number;
  name: string;
  slug: string;
  city: City;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  is_public?: boolean;
  business_count?: number;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  tier: 'free' | 'claimed' | 'premium';
  is_published?: boolean;
  visibility_scope?: 'country' | 'eu';
  visibility_country?: string;
  country: Country;
  city: City;
  town?: Town | null;  // Optional town/shopping center location
  category: Category | null;
  country_slug: string;
  city_slug: string;
  town_slug?: string | null;
  category_slug: string | null;
  address: string;
  address_line1?: string;
  postal_code?: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  phone: string;
  description: string;
  keywords?: unknown;  // Public API normalizes this, but legacy responses may not.
  logo_url?: string;    // Optional logo URL
  image_url?: string;   // Optional image URL
  accent_color?: string;
  is_micro: boolean;
  employee_count: number | null;
  source: string;
  external_id: string;
}

export interface BusinessSearchResult {
  total: number;
  limit: number;
  offset: number;
  results: Business[];
  fallback?: boolean;
  fallback_message?: string;
  detected_location?: string;
  normalized_query?: string;
}

export interface SearchFilters {
  q?: string;
  location?: string;
  country?: string;
  city?: string;
  town?: string;
  category?: string;
  is_micro?: boolean;
  tier?: string;
  limit?: number;
  offset?: number;
}

// API functions
export async function fetchBusinesses(filters: SearchFilters = {}): Promise<BusinessSearchResult> {
  const params = new URLSearchParams();
  
  if (filters.q) params.append('q', filters.q);
  if (filters.location) params.append('location', filters.location);
  if (filters.country) params.append('country', filters.country);
  if (filters.city) params.append('city', filters.city);
  if (filters.town) params.append('town', filters.town);
  if (filters.category) params.append('category', filters.category);
  if (filters.tier) params.append('tier', filters.tier);
  if (filters.is_micro !== undefined) params.append('is_micro', filters.is_micro.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  // Use Next.js API route instead of calling Django directly
  const url = `/api/listings/search?${params.toString()}`;
  if (process.env.NODE_ENV === "development") {
    debugLog("fetchBusinesses URL:", url);
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status} - ${response.statusText} (${url})`);
    return {
      total: 0,
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
      results: [],
    };
  }

  return response.json();
}

export async function fetchAllBusinesses(): Promise<Business[]> {
  const url = `${API_BASE_URL}/api/listings/businesses/`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export async function fetchBusinessBySlug(slug: string): Promise<Business> {
  const url = `${API_BASE_URL}/api/listings/businesses/${slug}/`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export async function fetchCountries(): Promise<Country[]> {
  const url = `/api/listings/countries/`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("🔥 fetchCountries URL:", url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (process.env.NODE_ENV === 'development') {
      debugLog("🔥 fetchCountries response:", response.status, response.statusText);
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (process.env.NODE_ENV === 'development') {
      debugLog("🔥 fetchCountries data:", data.length, "countries");
    }
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("🔥 fetchCountries error:", error);
    }
    throw error;
  }
}

export async function fetchCountriesWithStats(): Promise<CountryWithStats[]> {
  const url = `/api/listings/countries/stats/`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("🔥 fetchCountriesWithStats URL:", url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (process.env.NODE_ENV === 'development') {
      debugLog("🔥 fetchCountriesWithStats response:", response.status, response.statusText);
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (process.env.NODE_ENV === 'development') {
      debugLog("🔥 fetchCountriesWithStats data:", data.length, "countries with stats");
    }
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      debugLog("fetchCountriesWithStats failed:", error);
    }
    throw error;
  }
}

export async function fetchCities(countryParam?: string): Promise<City[]> {
  const params = new URLSearchParams();
  if (countryParam) params.append('country', countryParam);
  
  const url = `/api/listings/cities/?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const url = `/api/listings/categories/`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("fetchCategories URL:", url);
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  const categories = await response.json() as Category[];
  return categories.filter(isPublicCategory);
}

export async function fetchCategoriesByLocation(
  countrySlug?: string,
  citySlug?: string
): Promise<Category[]> {
  const params = new URLSearchParams();
  
  if (countrySlug) params.append('country', countrySlug);
  if (citySlug) params.append('city', citySlug);

  const url = `/api/listings/categories/?${params.toString()}`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("fetchCategoriesByLocation URL:", url);
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  const categories = await response.json() as Category[];
  return categories.filter(isPublicCategory);
}

// Helper function to get businesses for a specific location
export async function fetchBusinessesByLocation(
  countrySlug?: string,
  citySlug?: string,
  options: Omit<SearchFilters, 'country' | 'city'> = {}
): Promise<BusinessSearchResult> {
  return fetchBusinesses({
    ...options,
    country: countrySlug,
    city: citySlug,
  });
}

// Helper function to get businesses for a specific category
export async function fetchBusinessesByCategory(
  categorySlug: string,
  options: Omit<SearchFilters, 'category'> = {}
): Promise<BusinessSearchResult> {
  return fetchBusinesses({
    ...options,
    category: categorySlug,
  });
}

// New API functions for towns and debug endpoints

export interface Town {
  name: string;
  slug: string;
}

export async function fetchTowns(countryParam: string, cityParam?: string): Promise<Town[]> {
  const params = new URLSearchParams();
  params.append('country', countryParam);
  if (cityParam) params.append('city', cityParam);
  
  const url = `${API_BASE_URL}/api/listings/towns/?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export interface DebugInfo {
  count: number;
  sample_data: Business[];
  debug_info: {
    total_listings: number;
    total_countries: number;
    total_cities: number;
    total_categories: number;
  };
}

export async function fetchDebugListingsSample(): Promise<DebugInfo> {
  const url = `${API_BASE_URL}/api/listings/debug/listings-sample/`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

// New functions for business listing sections

/**
 * Fetch businesses by tier for tier-specific sections
 */
export async function fetchBusinessesByTier(tier: string, limit: number = 6): Promise<Business[]> {
  const params = new URLSearchParams();
  params.append('tier', tier);
  params.append('limit', limit.toString());
  
  // Use featured endpoint to honor tier + limit consistently.
  const url = `${API_BASE_URL}/api/listings/businesses/featured/?${params.toString()}`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("fetchBusinessesByTier URL:", url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response structures - DRF usually returns { results: [...] }
    return Array.isArray(data) ? data : (data.results || []);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("fetchBusinessesByTier error:", error);
    }
    throw error;
  }
}

/**
 * Fetch manually picked businesses for a specific section
 */
export async function fetchSectionBusinessPicks(sectionId: number): Promise<Business[]> {
  const url = `${API_BASE_URL}/api/sections/${sectionId}/business-picks/`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("fetchSectionBusinessPicks URL:", url);
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response structures
    return Array.isArray(data) ? data : (data.results || data || []);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("fetchSectionBusinessPicks error:", error);
    }
    throw error;
  }
}

/**
 * Generic function to fetch businesses with proper error handling
 */
export async function fetchBusinessesWithFallback(options: {
  tier?: string;
  limit?: number;
  includeTiers?: string[];
}): Promise<Business[]> {
  const { tier, limit = 24, includeTiers } = options;
  
  try {
    if (tier) {
      // Fetch by specific tier
      return await fetchBusinessesByTier(tier, limit);
    } else {
      // Fetch all businesses and filter by includeTiers if specified
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      
      const url = `${API_BASE_URL}/api/listings/businesses/?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      let businesses = Array.isArray(data) ? data : (data.results || []);
      
      // Filter by includeTiers if specified
      if (includeTiers && includeTiers.length > 0 && includeTiers.length < 3) {
        businesses = businesses.filter((business: Business) => 
          includeTiers.includes(business.tier || 'free')
        );
      }
      
      return businesses;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("fetchBusinessesWithFallback error:", error);
    }
    // Return empty array instead of throwing to prevent page crashes
    return [];
  }
}



