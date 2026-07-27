import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { debugLog } from "@/lib/debug";

type Params = Promise<{
  slug: string;
}>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";
  const backendUrl = `${INTERNAL_BACKEND_URL}/api/listings/businesses/search/?city=${encodeURIComponent(slug)}&limit=${limit}&offset=${offset}`;

  debugLog(`[City API] Fetching: ${backendUrl}`);

  try {
    const response = await fetch(backendUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ListAcrossEU-Frontend/1.0",
      },
    });

    if (!response.ok) {
      console.error(`[City API] Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: "Backend service unavailable", status: response.status },
        { status: 502 },
      );
    }

    const data = await response.json();
    debugLog(`[City API] Success: ${data.total || data.count || 0} businesses found for ${slug}`, data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[City API] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch city data" }, { status: 500 });
  }
}
