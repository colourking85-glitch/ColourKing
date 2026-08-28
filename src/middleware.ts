import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/** Routes that never require auth */
function isPublicRoute(pathname: string): boolean {
  if (pathname === '/login') return true;
  if (pathname.startsWith('/reset-password')) return true;
  if (pathname.startsWith('/api/public/')) return true;
  if (pathname.startsWith('/api/webhooks/')) return true;
  return false;
}

/** True when Supabase env vars are configured */
function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Create Supabase server client that refreshes session cookies */
function createSupabaseMiddleware(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '' });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const { pathname } = req.nextUrl;

  // monitor.colourking.nl -> rewrite to /monitor routes
  if (host.startsWith('monitor.')) {
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      return NextResponse.next();
    }
    const dest = pathname === '/' ? '/monitor' : pathname.startsWith('/monitor') ? pathname : `/monitor${pathname}`;
    const url = req.nextUrl.clone();
    url.pathname = dest;
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // ins.colourking.nl -> rewrite to /ins (standalone inspection wizard)
  if (host.startsWith('ins.')) {
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname === '/login' || pathname.startsWith('/reset-password')) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = '/ins';
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');

    if (hasSupabaseConfig()) {
      const supabase = createSupabaseMiddleware(req, res);
      await supabase.auth.getUser();
    }

    return res;
  }

  // admin.colourking.nl -> rewrite to /app routes
  if (host.startsWith('admin.')) {
    // Public routes and API routes pass through directly
    if (pathname === '/login' || pathname.startsWith('/reset-password') || pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    const dest = pathname === '/' ? '/app' : pathname.startsWith('/app') ? pathname : `/app${pathname}`;
    const url = req.nextUrl.clone();
    url.pathname = dest;
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');

    // Refresh Supabase session cookies if configured
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseMiddleware(req, res);
      await supabase.auth.getUser();
    }

    return res;
  }

  // API routes — pass through (auth handled per-route)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Login / reset-password — public, no locale
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Admin routes (/app/*)
  if (pathname.startsWith('/app')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');

    // Refresh Supabase session cookies if configured
    if (hasSupabaseConfig()) {
      const supabase = createSupabaseMiddleware(req, res);
      await supabase.auth.getUser();
    }

    return res;
  }

  // Monitor routes — standalone monitoring dashboard
  if (pathname.startsWith('/monitor')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // Everything else — public site with locale prefix
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images/).*)'],
};
