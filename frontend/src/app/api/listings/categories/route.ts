import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.search;
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/listings/categories/${query}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch categories from backend" },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
