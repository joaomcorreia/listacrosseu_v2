import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";

export async function GET() {
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/listings/countries/`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch countries from backend" },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Countries API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
