import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function detectChannel(referrer: string | null): string {
  if (!referrer) return 'direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (host.includes('google') || host.includes('bing') || host.includes('yahoo') || host.includes('duckduckgo')) return 'organic_search';
    if (host.includes('facebook') || host.includes('instagram') || host.includes('twitter') || host.includes('linkedin') || host.includes('tiktok')) return 'social';
    if (host.includes('chatgpt') || host.includes('perplexity') || host.includes('claude')) return 'ai';
    if (host.includes('colourking')) return 'direct';
    return 'referral';
  } catch {
    return 'direct';
  }
}

function detectDevice(ua: string): string {
  if (!ua) return 'desktop';
  const lower = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(lower)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(lower)) return 'mobile';
  return 'desktop';
}

function detectBrowser(ua: string): string {
  if (!ua) return 'unknown';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  return 'other';
}

function detectOS(ua: string): string {
  if (!ua) return 'unknown';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return 'other';
}

function isBot(ua: string): boolean {
  if (!ua) return false;
  return /bot|crawler|spider|scraper|curl|wget|python|go-http|java|fetcher|lighthouse|pagespeed|headless/i.test(ua);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, session_id, page_path, page_title, referrer, locale } = body;

    if (!session_id || !page_path) {
      return NextResponse.json({ error: 'Missing session_id or page_path' }, { status: 400 });
    }

    const supabase = createClient();
    const ua = req.headers.get('user-agent') || '';
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '';

    if (action === 'start') {
      const channel = detectChannel(referrer || null);
      const device = detectDevice(ua);
      const browser = detectBrowser(ua);
      const os = detectOS(ua);
      const bot = isBot(ua);

      let countryCode: string | null = null;
      let countryName: string | null = null;
      let city: string | null = null;

      const geoCountry = req.headers.get('x-vercel-ip-country');
      const geoCity = req.headers.get('x-vercel-ip-city');
      if (geoCountry) {
        countryCode = geoCountry;
        const countryNames: Record<string, string> = {
          NL: 'Netherlands', US: 'United States', DE: 'Germany', GB: 'United Kingdom',
          FR: 'France', BE: 'Belgium', TR: 'Turkey', ES: 'Spain', IT: 'Italy',
          BR: 'Brazil', CN: 'China', JP: 'Japan', IN: 'India', SE: 'Sweden',
          NO: 'Norway', DK: 'Denmark', PL: 'Poland', PT: 'Portugal', AT: 'Austria',
          CH: 'Switzerland', RU: 'Russia', UA: 'Ukraine', RO: 'Romania', JO: 'Jordan',
          UY: 'Uruguay', SA: 'Saudi Arabia', AE: 'UAE', CA: 'Canada', AU: 'Australia',
        };
        countryName = countryNames[geoCountry] || geoCountry;
      }
      if (geoCity) city = decodeURIComponent(geoCity);

      const { error } = await supabase.from('site_sessions').insert({
        session_id,
        entry_page: page_path,
        exit_page: page_path,
        referrer: referrer || null,
        channel,
        country_code: countryCode,
        country_name: countryName,
        city,
        device,
        browser,
        os,
        locale: locale || null,
        is_bot: bot,
      });

      if (error && error.code === '23505') {
        return NextResponse.json({ ok: true, existing: true });
      }
      if (error) throw error;

      await supabase.from('site_pageviews').insert({
        session_id,
        page_path,
        page_title: page_title || null,
      });

      return NextResponse.json({ ok: true });
    }

    if (action === 'pageview') {
      await supabase.from('site_pageviews').insert({
        session_id,
        page_path,
        page_title: page_title || null,
      });

      await supabase
        .from('site_sessions')
        .update({
          exit_page: page_path,
          page_count: body.page_count || 1,
          ended_at: new Date().toISOString(),
          duration_seconds: body.duration_seconds || 0,
        })
        .eq('session_id', session_id);

      return NextResponse.json({ ok: true });
    }

    if (action === 'end') {
      await supabase
        .from('site_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: body.duration_seconds || 0,
          exit_page: page_path,
          page_count: body.page_count || 1,
        })
        .eq('session_id', session_id);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Analytics track error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
