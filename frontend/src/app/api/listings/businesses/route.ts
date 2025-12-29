import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js API Route: /api/listings/businesses
 * 
 * This proxies requests to Django backend's /api/listings/businesses/ endpoints
 * Supports filtering by tier, limit, offset, and other business filters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const tier = searchParams.get('tier');
  const limit = searchParams.get('limit') || '20';
  const offset = searchParams.get('offset') || '0';
  const q = searchParams.get('q');
  const country = searchParams.get('country');
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const is_micro = searchParams.get('is_micro');

  // Build backend URL based on parameters
  const backendBaseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  let backendUrl: string;

  // Build query parameters for backend
  const backendParams = new URLSearchParams();
  
  if (tier) backendParams.append('tier', tier);
  if (limit) backendParams.append('limit', limit);
  if (offset) backendParams.append('offset', offset);
  if (q) backendParams.append('q', q);
  if (country) backendParams.append('country', country);
  if (city) backendParams.append('city', city);
  if (category) backendParams.append('category', category);
  if (is_micro) backendParams.append('is_micro', is_micro);

  // If we have filtering parameters, use search endpoint for better results
  if (tier || q || country || city || category || is_micro) {
    backendUrl = `${backendBaseUrl}/api/listings/businesses/search/?${backendParams.toString()}`;
  } else {
    // For simple list requests, use the basic businesses endpoint
    backendUrl = `${backendBaseUrl}/api/listings/businesses/?${backendParams.toString()}`;
  }

  console.log(`[Businesses API] Fetching: ${backendUrl}`);

  try {
    const response = await fetch(backendUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ListAcrossEU-Frontend/1.0',
      },
    });

    if (!response.ok) {
      console.error(`[Businesses API] Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Backend service unavailable', status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    
    // Dev logging for results
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Businesses API Results: ${data.results?.length || data.length || 0} businesses found (total: ${data.count || 'unknown'})`);
      if (tier) {
        console.log(`🎯 Filtered by tier: ${tier}`);
      }
    }

    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[Businesses API] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}