import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_BACKEND_URL } from "@/lib/env.server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const response = await fetch(
      `${INTERNAL_BACKEND_URL}/api/verify/?token=${encodeURIComponent(token)}`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Verification failed", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
