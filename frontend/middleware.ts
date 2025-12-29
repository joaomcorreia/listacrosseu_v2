import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('[Middleware] Processing:', pathname);
  
  // Extract language and path segments
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length < 2) {
    console.log('[Middleware] Too few segments, passing through');
    return NextResponse.next();
  }
  
  const [lang, secondSegment, thirdSegment] = pathSegments;
  
  // Known slug corrections for legacy URLs
  const SLUG_FIXES: { [key: string]: string } = {
    'vilanovadegaia': 'vila-nova-de-gaia',
    // Add more as needed
  };
  
  // List of known top-level routes that should not be redirected
  const knownRoutes = [
    'admin', 'blog', 'business', 'businesses', 'categories', 
    'cities', 'countries', 'list-your-business', 'locations', 
    'search', 'towns', 'api', '_next', 'favicon.ico'
  ];
  
  // Debug logging
  console.log('[Middleware]', pathname, { pathSegments, secondSegment, thirdSegment });
  
  // Handle /[lang]/cities/[incorrect-slug] -> /[lang]/cities/[correct-slug]
  if (pathSegments.length === 3 && secondSegment === 'cities' && thirdSegment && SLUG_FIXES[thirdSegment]) {
    const correctSlug = SLUG_FIXES[thirdSegment];
    console.log('[Middleware] Redirecting cities URL:', thirdSegment, '->', correctSlug);
    const redirectUrl = new URL(`/${lang}/cities/${correctSlug}`, request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }
  
  // Handle /[lang]/[incorrect-city-slug] -> /[lang]/cities/[correct-slug]
  if (pathSegments.length === 2 && !knownRoutes.includes(secondSegment)) {
    const correctSlug = SLUG_FIXES[secondSegment] || secondSegment;
    console.log('[Middleware] Redirecting city URL:', secondSegment, '->', correctSlug);
    const redirectUrl = new URL(`/${lang}/cities/${correctSlug}`, request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};