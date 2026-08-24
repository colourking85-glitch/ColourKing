import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes — no locale, require auth (client-side for now)
  if (pathname.startsWith('/app')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // Login page — no locale, no auth
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // API routes — pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Everything else — public site with locale prefix
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
