import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { debugLog } from "@/lib/debug";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const country = searchParams.get("country") || "";
    const city = searchParams.get("city") || "";
    const category = searchParams.get("category") || "";
    const town = searchParams.get("town") || "";
    const isMicro = searchParams.get("is_micro") === "true";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    debugLog("Next.js API Search Request:", { q, country, city, category, town, isMicro, limit, offset });

    const backendParams = new URLSearchParams();
    if (q) backendParams.append("q", q);
    if (country) backendParams.append("country", country);
    if (city) backendParams.append("city", city.trim().toLowerCase());
    if (category) backendParams.append("category", category);
    if (town) backendParams.append("town", town);
    if (isMicro) backendParams.append("is_micro", "true");
    backendParams.append("limit", limit.toString());
    backendParams.append("offset", offset.toString());

    const url = `${INTERNAL_BACKEND_URL}/api/listings/businesses/search/?${backendParams.toString()}`;
    debugLog("Backend URL:", url);

    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch businesses from backend" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Next.js API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
