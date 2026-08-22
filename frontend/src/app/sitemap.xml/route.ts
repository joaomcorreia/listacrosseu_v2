import { NextResponse } from "next/server";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { PUBLIC_SITE_URL } from "@/lib/env.public";

const CANONICAL_SITEMAP_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(PUBLIC_SITE_URL)
  ? "https://listacross.eu"
  : PUBLIC_SITE_URL;

export function normalizeSitemapHosts(xml: string): string {
  return xml.replace(/(<loc>)(https?:\/\/[^<]+)(<\/loc>)/g, (_match, open, value, close) => {
    try {
      const parsed = new URL(value);
      return `${open}${CANONICAL_SITEMAP_ORIGIN}${parsed.pathname}${parsed.search}${close}`;
    } catch {
      return `${open}${value}${close}`;
    }
  });
}

export async function GET() {
  const response = await fetch(`${INTERNAL_BACKEND_URL}/sitemap.xml`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return new NextResponse("Unable to load sitemap", { status: 502 });
  }

  const xml = normalizeSitemapHosts(await response.text());
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
