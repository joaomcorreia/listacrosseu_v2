import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const q = searchParams.get('q') || '';
    const country = searchParams.get('country') || '';
    const city = searchParams.get('city') || '';
    const category = searchParams.get('category') || '';
    const isMicro = searchParams.get('is_micro') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Dev logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Next.js API Search Request:', {
        q, country, city, category, isMicro, limit, offset
      });
    }
    
    // Build backend URL and parameters
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8003';
    const backendParams = new URLSearchParams();
    
    if (q) backendParams.append('q', q);
    if (country) backendParams.append('country', country);
    if (city) {
      // Normalize city parameter for better matching
      const normalizedCity = city.trim().toLowerCase();
      backendParams.append('city', normalizedCity);
      
      // Dev logging for city filtering
      if (process.env.NODE_ENV === 'development') {
        console.log(`📍 City filter: "${city}" → normalized: "${normalizedCity}"`);
      }
    }
    if (category) backendParams.append('category', category);
    if (isMicro) backendParams.append('is_micro', 'true');
    backendParams.append('limit', limit.toString());
    backendParams.append('offset', offset.toString());
    
    const url = `${backendUrl}/api/listings/businesses/search/?${backendParams.toString()}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌐 Backend URL:', url);
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Backend API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch businesses from backend' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Dev logging for results
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Results: ${data.results?.length || 0} businesses found (total: ${data.count || 0})`);
      if (city && data.results?.length > 0) {
        console.log(`📍 First few cities in results:`, 
          data.results.slice(0, 3).map((b: any) => b.city?.name).filter(Boolean)
        );
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Next.js API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}