import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protège toutes les routes /admin/*.
 * Le guard pathname.startsWith est explicite car Turbopack (--turbo) a un comportement
 * non-standard avec les matchers : le middleware peut s'exécuter sur toutes les routes
 * même quand le matcher spécifie /admin/:path*.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Guard explicite : uniquement les routes /admin/* et /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('eec_sessionid');
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
