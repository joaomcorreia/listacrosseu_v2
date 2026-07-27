import { NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { debugLog } from "@/lib/debug";

export async function GET() {
  try {
    const url = `${INTERNAL_BACKEND_URL}/api/listings/countries/stats/`;
    debugLog("Country Stats API Proxy URL:", url);
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch country stats" },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Country Stats API Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
