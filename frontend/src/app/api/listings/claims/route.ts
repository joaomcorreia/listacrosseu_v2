import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/listings/claims/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to submit claim", details: errorData },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
