import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

function hashIp(ip: string): string {
  return createHash('sha256').update(ip.trim().toLowerCase()).digest('hex').slice(0, 16);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Compute viewer's own IP hash so the UI can highlight their sessions
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '';
    const viewerIpHash = ip ? hashIp(ip) : null;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';
    const channel = searchParams.get('channel') || 'all';

    const now = new Date();
    let from: Date;
    switch (period) {
      case '24h': from = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '3d': from = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); break;
      case '7d': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    let query = supabase
      .from('site_sessions')
      .select('*')
      .eq('is_bot', false)
      .gte('started_at', from.toISOString())
      .order('started_at', { ascending: false });

    if (channel !== 'all') {
      query = query.eq('channel', channel);
    }

    const { data: sessions, error } = await query.limit(1000);
    if (error) throw error;

    const totalSessions = sessions?.length || 0;
    const bounced = sessions?.filter(s => s.page_count <= 1).length || 0;
    const bounceRate = totalSessions > 0 ? Math.round((bounced / totalSessions) * 100) : 0;
    const avgPages = totalSessions > 0
      ? Math.round((sessions!.reduce((sum, s) => sum + (s.page_count || 1), 0) / totalSessions) * 10) / 10
      : 0;
    const avgDuration = totalSessions > 0
      ? Math.round(sessions!.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / totalSessions)
      : 0;

    const channels: Record<string, number> = {};
    const entryPages: Record<string, number> = {};
    const exitPages: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    sessions?.forEach(s => {
      channels[s.channel] = (channels[s.channel] || 0) + 1;
      entryPages[s.entry_page] = (entryPages[s.entry_page] || 0) + 1;
      if (s.exit_page) exitPages[s.exit_page] = (exitPages[s.exit_page] || 0) + 1;
      const country = s.country_name || s.country_code || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;
      devices[s.device] = (devices[s.device] || 0) + 1;
      if (s.browser) browsers[s.browser] = (browsers[s.browser] || 0) + 1;

      const day = new Date(s.started_at).toISOString().split('T')[0];
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const toSorted = (obj: Record<string, number>, limit = 10) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      summary: { totalSessions, bounceRate, avgPages, avgDuration },
      channels: toSorted(channels),
      entryPages: toSorted(entryPages),
      exitPages: toSorted(exitPages),
      countries: toSorted(countries),
      devices: toSorted(devices),
      browsers: toSorted(browsers),
      daily: Object.entries(dailyCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count })),
      viewerIpHash,
      sessions: sessions?.slice(0, 100).map(s => ({
        id: s.id,
        session_id: s.session_id,
        started_at: s.started_at,
        duration_seconds: s.duration_seconds,
        page_count: s.page_count,
        entry_page: s.entry_page,
        exit_page: s.exit_page,
        country_name: s.country_name,
        country_code: s.country_code,
        city: s.city,
        device: s.device,
        browser: s.browser,
        channel: s.channel,
        locale: s.locale,
        ip_hash: s.ip_hash || null,
      })),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/** DELETE /api/analytics — delete sessions by id or ip_hash, or exclude an IP. */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Delete a single session
    if (body.session_db_id) {
      const { error } = await supabase.from('site_sessions').delete().eq('id', body.session_db_id);
      if (error) throw error;
      return NextResponse.json({ ok: true, deleted: 1 });
    }

    // Delete all sessions matching an ip_hash
    if (body.ip_hash) {
      const { data, error } = await supabase
        .from('site_sessions')
        .delete()
        .eq('ip_hash', body.ip_hash)
        .select('id');
      if (error) throw error;
      return NextResponse.json({ ok: true, deleted: data?.length || 0 });
    }

    // Exclude an IP hash from future tracking
    if (body.action === 'exclude_my_ip') {
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '';
      if (!ip) return NextResponse.json({ error: 'Cannot determine IP' }, { status: 400 });
      const myHash = hashIp(ip);

      const { data: existing } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'analytics_excluded_ips')
        .maybeSingle();

      const hashes: string[] = existing?.value?.hashes || [];
      if (!hashes.includes(myHash)) {
        hashes.push(myHash);
        await supabase.from('settings').upsert({
          key: 'analytics_excluded_ips',
          value: { hashes },
        }, { onConflict: 'key' });
      }

      return NextResponse.json({ ok: true, hash: myHash, excluded: true });
    }

    return NextResponse.json({ error: 'Provide session_db_id, ip_hash, or action' }, { status: 400 });
  } catch (err) {
    console.error('Analytics delete error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
