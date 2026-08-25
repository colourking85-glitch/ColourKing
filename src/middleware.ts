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

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const { pathname } = req.nextUrl;

  // monitor.colourking.nl -> rewrite to /monitor routes
  if (host.startsWith('monitor.')) {
    const dest = pathname === '/' ? '/monitor' : pathname.startsWith('/monitor') ? pathname : `/monitor${pathname}`;
    const url = req.nextUrl.clone();
    url.pathname = dest;
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // admin.colourking.nl -> rewrite to /app routes
  if (host.startsWith('admin.')) {
    // Allow login and reset-password on admin subdomain
    if (pathname === '/login' || pathname.startsWith('/reset-password')) {
      return NextResponse.next();
    }

    // If the path already starts with /app, use it as-is (sidebar links include /app prefix)
    const dest = pathname === '/' ? '/app' : pathname.startsWith('/app') ? pathname : `/app${pathname}`;

    // Auth check for admin subdomain when Supabase is configured
    if (hasSupabaseConfig()) {
      const supabaseResponse = NextResponse.next({
        request: { headers: req.headers },
      });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return req.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              req.cookies.set({ name, value });
              supabaseResponse.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              req.cookies.set({ name, value: '' });
              supabaseResponse.cookies.set({ name, value: '', ...options });
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Rewrite to /app path with refreshed cookies
      const url = req.nextUrl.clone();
      url.pathname = dest;
      const rewriteRes = NextResponse.rewrite(url);
      supabaseResponse.cookies.getAll().forEach(c => {
        rewriteRes.cookies.set(c);
      });
      rewriteRes.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return rewriteRes;
    }

    // No Supabase config — dev mode, rewrite directly
    const url = req.nextUrl.clone();
    url.pathname = dest;
    const res = NextResponse.rewrite(url);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
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

  // Admin routes — require auth when Supabase is configured
  if (pathname.startsWith('/app')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');

    if (!hasSupabaseConfig()) {
      // Dev mode without Supabase — allow through
      return res;
    }

    // Refresh session via Supabase middleware pattern
    const supabaseResponse = NextResponse.next({
      request: { headers: req.headers },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            req.cookies.set({ name, value });
            supabaseResponse.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            req.cookies.set({ name, value: '' });
            supabaseResponse.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return supabaseResponse;
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
  matcher: ['/((?!_next|favicon.ico).*)'],
};
