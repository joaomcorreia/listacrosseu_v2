import { NextRequest, NextResponse } from "next/server";

const COUNTRY_CODE = /^[A-Z]{2}$/;

function cleanCountryCode(value: string | null | undefined): string | null {
  const code = (value || "").trim().toUpperCase();
  return COUNTRY_CODE.test(code) ? code : null;
}

export async function GET(request: NextRequest) {
  const cloudflareCountry = cleanCountryCode(request.headers.get("cf-ipcountry"));
  if (cloudflareCountry) {
    return NextResponse.json({ countryCode: cloudflareCountry, source: "cloudflare" });
  }

  // This header is useful for local checks without exposing or storing an IP.
  const localHeader = process.env.NODE_ENV !== "production"
    ? cleanCountryCode(request.headers.get("x-listacrosseu-country"))
    : null;
  const developmentCountry = process.env.NODE_ENV !== "production"
    ? cleanCountryCode(process.env.NEXT_PUBLIC_DEV_COUNTRY)
    : null;
  const countryCode = localHeader || developmentCountry;

  return NextResponse.json({
    countryCode,
    source: countryCode ? "development" : "none",
  });
}
