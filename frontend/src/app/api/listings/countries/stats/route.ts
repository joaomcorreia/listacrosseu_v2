import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const url = `${API_BASE_URL}/api/listings/countries/stats/`;
    
    console.log("🔥 Country Stats API Proxy URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error("🔥 Country Stats API Error:", response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch country stats' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("🔥 Country Stats API Success:", data.length, "countries with stats");
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("🔥 Country Stats API Exception:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}