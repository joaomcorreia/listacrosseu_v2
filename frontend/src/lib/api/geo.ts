import { debugLog } from "@/lib/debug";
import { PUBLIC_API_BASE_URL } from "@/lib/env.public";

/**
 * API client for geographical endpoints (cities, countries)
 * Connects to Django REST Framework backend
 */

const API_BASE_URL = PUBLIC_API_BASE_URL;

// Type definitions
export interface Country {
  id: number;
  name: string;
  slug: string;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  country: Country;
  business_count?: number;
}

interface FetchCitiesOptions {
  limit?: number;
  country?: string;
  search?: string;
}

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  debugLog("Geo API base URL:", API_BASE_URL);
}

/**
 * Fetch cities with optional filtering
 */
export async function fetchCities(options: FetchCitiesOptions = {}): Promise<City[]> {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.country) params.append('country', options.country);
  if (options.search) params.append('search', options.search);
  
  const url = `/api/geo/cities/${params.toString() ? '?' + params.toString() : ''}`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("fetchCities URL:", url);
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geo API Error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle both direct array response and paginated response
  if (Array.isArray(data)) {
    return data;
  } else if (data.results && Array.isArray(data.results)) {
    return data.results;
  } else {
    return [];
  }
}

/**
 * Fetch countries
 */
export async function fetchCountries(): Promise<Country[]> {
  const url = `/api/geo/countries/`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("fetchCountries URL:", url);
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geo API Error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle both direct array response and paginated response
  if (Array.isArray(data)) {
    return data;
  } else if (data.results && Array.isArray(data.results)) {
    return data.results;
  } else {
    return [];
  }
}

/**
 * Fetch a specific city by slug
 */
export async function fetchCityBySlug(slug: string): Promise<City | null> {
  const url = `/api/geo/cities/${slug}/`;
  
  if (process.env.NODE_ENV === 'development') {
    debugLog("fetchCityBySlug URL:", url);
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Geo API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}


