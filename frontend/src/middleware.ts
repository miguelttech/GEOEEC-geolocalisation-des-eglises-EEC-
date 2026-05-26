import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protège toutes les routes /admin/*.
 * Vérifie la présence du cookie de session Django (sessionid).
 * Si absent → redirection vers /login avec le paramètre ?next=<url>.
 *
 * Note : la validation réelle de la session est assurée par le backend
 * (IsAuthenticated sur chaque endpoint). Ce middleware est un garde UX.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get('sessionid');

  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
