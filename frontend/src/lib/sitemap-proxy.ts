import { NextResponse } from "next/server";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import { normalizeSitemapHosts } from "@/app/sitemap.xml/route";

export async function proxySitemap(section: string) {
  const response = await fetch(`${INTERNAL_BACKEND_URL}/sitemap-${section}.xml`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return new NextResponse("Unable to load sitemap", { status: 502 });
  }

  return new NextResponse(normalizeSitemapHosts(await response.text()), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
