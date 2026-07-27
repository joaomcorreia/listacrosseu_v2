import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const backendUrl = country
      ? `${INTERNAL_BACKEND_URL}/api/listings/cities/?country=${encodeURIComponent(country)}`
      : `${INTERNAL_BACKEND_URL}/api/listings/cities/`;

    const response = await fetch(backendUrl, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch cities from backend" },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Cities API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
