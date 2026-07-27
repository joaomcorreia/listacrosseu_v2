import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { debugLog } from "@/lib/debug";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier");
  const limit = searchParams.get("limit") || "20";
  const offset = searchParams.get("offset") || "0";
  const q = searchParams.get("q");
  const country = searchParams.get("country");
  const city = searchParams.get("city");
  const town = searchParams.get("town");
  const category = searchParams.get("category");
  const isMicro = searchParams.get("is_micro");

  const backendParams = new URLSearchParams();
  if (tier) backendParams.append("tier", tier);
  backendParams.append("limit", limit);
  backendParams.append("offset", offset);
  if (q) backendParams.append("q", q);
  if (country) backendParams.append("country", country);
  if (city) backendParams.append("city", city);
  if (town) backendParams.append("town", town);
  if (category) backendParams.append("category", category);
  if (isMicro) backendParams.append("is_micro", isMicro);

  const backendUrl = tier || q || country || city || town || category || isMicro
    ? `${INTERNAL_BACKEND_URL}/api/listings/businesses/search/?${backendParams.toString()}`
    : `${INTERNAL_BACKEND_URL}/api/listings/businesses/?${backendParams.toString()}`;

  debugLog(`[Businesses API] Fetching: ${backendUrl}`);

  try {
    const response = await fetch(backendUrl, {
      headers: { Accept: "application/json", "User-Agent": "ListAcrossEU-Frontend/1.0" },
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Backend service unavailable", status: response.status },
        { status: 502 },
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Businesses API] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
  }
}
