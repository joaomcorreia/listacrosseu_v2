import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generatedWebsiteRewriteUrl, resolveGeneratedWebsiteHost } from "./src/lib/generated-host";

const supportedLangs = new Set(["en", "nl", "pt", "fr", "de", "es"]);
const knownRoutes = new Set([
  "admin",
  "ai-visibility",
  "blog",
  "business",
  "businesses",
  "business-visibility",
  "categories",
  "check-email",
  "cities",
  "claim",
  "countries",
  "dashboard",
  "generated",
  "get-found-online",
  "list-your-business-free",
  "generated-business-website",
  "free-business-listing-belgium",
  "free-business-listing-antwerp",
  "free-business-listing-anderlecht",
  "free-business-listing-brussels",
  "free-business-listing-ghent",
  "free-business-listing-liege",
  "free-business-listing-charleroi",
  "free-business-listing-leuven",
  "free-business-listing-mechelen",
  "free-business-listing-hasselt",
  "free-business-listing-bruges",
  "get-your-business-online-free",
  "get-your-small-business-online-fast",
  "advertise-your-business-online-free",
  "free-online-presence-for-small-business",
  "create-a-business-page-free",
  "put-your-business-online",
  "list-your-business",
  "locations",
  "login",
  "promote-your-business-free",
  "search",
  "signup",
  "towns",
  "api",
  "_next",
  "favicon.ico",
  "about",
  "cookies",
  "how-it-works",
  "places",
  "pricing",
  "privacy",
  "terms",
  "verify",
  "verify-account",
  "premium-preview",
]);

const slugFixes: Record<string, string> = {
  vilanovadegaia: "vila-nova-de-gaia",
};

function isMalformedRouteSegment(segment: string): boolean {
  return segment === "$" || /^\{[^{}]+\}$/.test(segment);
}

function applyNoIndexHeader(response: NextResponse): NextResponse {
  if (process.env.NEXT_PUBLIC_STAGING_NOINDEX === "1") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const generatedWebsiteSlug = resolveGeneratedWebsiteHost(request.headers.get("host") || request.nextUrl.hostname);
  if (generatedWebsiteSlug && !pathname.startsWith("/_next/") && !pathname.startsWith("/api/") && !pathname.startsWith("/_generated-site/")) {
    const rewritten = generatedWebsiteRewriteUrl(request.url, generatedWebsiteSlug);
    const rewriteHeaders = new Headers(request.headers);
    const originalHost = request.headers.get("host");
    if (originalHost) rewriteHeaders.set("x-forwarded-host", originalHost);
    return applyNoIndexHeader(NextResponse.rewrite(rewritten, { request: { headers: rewriteHeaders } }));
  }
  const pathSegments = pathname.split("/").filter(Boolean);

  if (pathSegments.some(isMalformedRouteSegment)) {
    return applyNoIndexHeader(new NextResponse("Not Found", { status: 404 }));
  }

  if (pathname.includes("/admin/visual/") && process.env.ENABLE_VISUAL_HOMEPAGE_EDITOR !== "1") {
    return applyNoIndexHeader(new NextResponse("Not Found", { status: 404 }));
  }

  if (pathname.startsWith("/api/")) {
    return applyNoIndexHeader(NextResponse.next());
  }

  if (pathSegments.length < 2) {
    return applyNoIndexHeader(NextResponse.next());
  }

  const [lang, secondSegment, thirdSegment] = pathSegments;
  if (!supportedLangs.has(lang)) {
    return applyNoIndexHeader(NextResponse.next());
  }

  if (pathSegments.length === 3 && secondSegment === "cities" && thirdSegment && slugFixes[thirdSegment]) {
    return applyNoIndexHeader(
      NextResponse.redirect(new URL(`/${lang}/cities/${slugFixes[thirdSegment]}`, request.url), 301),
    );
  }

  if (pathSegments.length === 2 && !knownRoutes.has(secondSegment)) {
    const correctedSlug = slugFixes[secondSegment] || secondSegment;
    return applyNoIndexHeader(
      NextResponse.redirect(new URL(`/${lang}/cities/${correctedSlug}`, request.url), 301),
    );
  }

  return applyNoIndexHeader(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
