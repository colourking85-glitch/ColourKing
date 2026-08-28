'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Activity, RefreshCw, Monitor, Smartphone, Tablet, Globe, ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

interface SessionRow {
  id: string;
  session_id: string;
  started_at: string;
  duration_seconds: number;
  page_count: number;
  entry_page: string;
  exit_page: string | null;
  country_name: string | null;
  country_code: string | null;
  city: string | null;
  device: string;
  browser: string | null;
  channel: string;
  locale: string | null;
}

interface NameCount {
  name: string;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface AnalyticsData {
  summary: {
    totalSessions: number;
    bounceRate: number;
    avgPages: number;
    avgDuration: number;
  };
  channels: NameCount[];
  entryPages: NameCount[];
  exitPages: NameCount[];
  countries: NameCount[];
  devices: NameCount[];
  browsers: NameCount[];
  daily: DailyCount[];
  sessions: SessionRow[];
}

const PERIODS = ['24h', '3d', '7d', '30d', '90d'] as const;
const CHANNELS = ['all', 'direct', 'referral', 'organic_search', 'social', 'ai', 'email'] as const;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function ChannelBadge({ channel }: { channel: string }) {
  const colors: Record<string, string> = {
    direct: 'bg-blue-500/20 text-blue-400',
    referral: 'bg-amber-500/20 text-amber-400',
    organic_search: 'bg-green-500/20 text-green-400',
    social: 'bg-purple-500/20 text-purple-400',
    ai: 'bg-cyan-500/20 text-cyan-400',
    email: 'bg-rose-500/20 text-rose-400',
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${colors[channel] || 'bg-[#1e1e2a] text-[#6b6b80]'}`}>
      {channel}
    </span>
  );
}

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case 'mobile': return <Smartphone className="h-3.5 w-3.5 text-[#6b6b80]" />;
    case 'tablet': return <Tablet className="h-3.5 w-3.5 text-[#6b6b80]" />;
    default: return <Monitor className="h-3.5 w-3.5 text-[#6b6b80]" />;
  }
}

function MiniBarChart({ data, maxVal }: { data: DailyCount[]; maxVal: number }) {
  if (!data.length) return null;
  return (
    <div className="flex items-end gap-px h-20">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex-1 min-w-[4px] bg-[#E8364E] rounded-t opacity-80 hover:opacity-100 transition-opacity"
          style={{ height: `${maxVal > 0 ? (d.count / maxVal) * 100 : 0}%`, minHeight: d.count > 0 ? '2px' : '0' }}
          title={`${d.date}: ${d.count}`}
        />
      ))}
    </div>
  );
}

function RankList({ items, max }: { items: NameCount[]; max: number }) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-[#c0c0cc]">{item.name}</span>
              <span className="ml-2 flex-shrink-0 font-mono text-[#6b6b80]">{item.count}</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-[#1e1e2a]">
              <div
                className="h-1 rounded-full bg-[#E8364E]/60"
                style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-[#6b6b80]">—</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations('an');
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('3d');
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}&channel=${channel}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, [period, channel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSessions = data?.sessions?.filter(s =>
    !filter || s.session_id.toLowerCase().includes(filter.toLowerCase())
  ) || [];

  const maxDaily = data?.daily?.reduce((m, d) => Math.max(m, d.count), 0) || 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">{t('title')}</h1>
            <ScreenBadge code="AN05" />
          </div>
          <p className="mt-1 text-sm text-[#6b6b80]">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t('filterBySession')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-52 rounded-[10px] border border-[#1e1e2a] bg-[#12121a] px-3 py-2 text-xs text-white placeholder-[#6b6b80] outline-none focus:border-[#E8364E]/50"
          />
          <span className="rounded-full bg-[#1e1e2a] px-3 py-1.5 text-[10px] font-semibold text-[#6b6b80]">
            {data?.summary?.totalSessions || 0} / 1000 {t('sessions').toLowerCase()}
          </span>
          <span className="rounded-full bg-[#0a0a0f] px-3 py-1.5 text-[10px] font-semibold text-[#6b6b80]">
            🤖 {t('botsHidden')}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#1e1e2a] bg-[#12121a] px-3 py-2 text-xs text-[#6b6b80] transition-colors hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Period + channel filters */}
      <div className="flex items-center gap-4">
        <div className="flex rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p ? 'bg-[#E8364E] text-white' : 'text-[#6b6b80] hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as (typeof CHANNELS)[number])}
          className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] px-3 py-2 text-xs text-white outline-none"
        >
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? t('allChannels') : t(c)}
            </option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('totalSessions'), value: data?.summary?.totalSessions || 0, icon: Activity, color: 'text-green-400' },
          { label: t('bounceRate'), value: `${data?.summary?.bounceRate || 0}%`, icon: ArrowUpRight, color: 'text-amber-400' },
          { label: t('avgPages'), value: data?.summary?.avgPages || 0, icon: ArrowDownRight, color: 'text-blue-400' },
          { label: t('avgDuration'), value: formatDuration(data?.summary?.avgDuration || 0), icon: Clock, color: 'text-purple-400' },
        ].map((card) => (
          <div key={card.label} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
            <div className="flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-[#6b6b80]">{card.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions over time */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#6b6b80]">
          📊 {t('sessionsOverTime')}
        </h2>
        <MiniBarChart data={data?.daily || []} maxVal={maxDaily} />
        {data?.daily && data.daily.length > 0 && (
          <div className="mt-2 flex justify-between text-[10px] text-[#6b6b80]">
            <span>{data.daily[0]?.date}</span>
            <span>{data.daily[data.daily.length - 1]?.date}</span>
          </div>
        )}
      </div>

      {/* Breakdown panels */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { title: t('channels'), items: data?.channels || [] },
          { title: t('topEntryPages'), items: data?.entryPages || [] },
          { title: t('topExitPages'), items: data?.exitPages || [] },
          { title: t('topCountries'), items: data?.countries || [] },
          { title: t('topDevices'), items: data?.devices || [] },
        ].map((panel) => (
          <div key={panel.title} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#6b6b80]">
              {panel.title}
            </h3>
            <RankList items={panel.items} max={panel.items[0]?.count || 0} />
          </div>
        ))}
      </div>

      {/* Sessions table */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a]">
        <div className="border-b border-[#1e1e2a] px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6b6b80]">
            💻 {t('sessions')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e1e2a] text-left text-[10px] uppercase tracking-wider text-[#6b6b80]">
                <th className="px-4 py-3">{t('started')}</th>
                <th className="px-4 py-3">{t('session')}</th>
                <th className="px-4 py-3">{t('duration')}</th>
                <th className="px-4 py-3">{t('pages')}</th>
                <th className="px-4 py-3">{t('entryPage')}</th>
                <th className="px-4 py-3">{t('exitPage')}</th>
                <th className="px-4 py-3">{t('location')}</th>
                <th className="px-4 py-3">{t('device')}</th>
                <th className="px-4 py-3">{t('channel')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((s) => (
                <tr key={s.id} className="border-b border-[#1e1e2a]/50 hover:bg-[#1e1e2a]/30 transition-colors">
                  <td className="px-4 py-2.5 text-[#c0c0cc] whitespace-nowrap">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
                    {new Date(s.started_at).toLocaleString('nl-NL', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[10px] text-[#6b6b80]">
                      🔗 {s.session_id.substring(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#c0c0cc]">{formatDuration(s.duration_seconds)}</td>
                  <td className="px-4 py-2.5 text-[#c0c0cc]">{s.page_count}</td>
                  <td className="px-4 py-2.5 text-[#c0c0cc] max-w-[160px] truncate">{s.entry_page}</td>
                  <td className="px-4 py-2.5 text-[#c0c0cc] max-w-[160px] truncate">{s.exit_page || '—'}</td>
                  <td className="px-4 py-2.5 text-[#c0c0cc] whitespace-nowrap">
                    {s.country_code && (
                      <span className="mr-1">{getFlagEmoji(s.country_code)}</span>
                    )}
                    {s.country_name || '—'}
                    {s.city && <span className="text-[#6b6b80]"> ({s.city})</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <DeviceIcon device={s.device} />
                      <span className="text-[#c0c0cc]">{s.device}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <ChannelBadge channel={s.channel} />
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-[#6b6b80]">
                    {loading ? '...' : t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const cc = countryCode.toUpperCase();
  if (cc.length !== 2) return '';
  const offset = 127397;
  return String.fromCodePoint(...Array.from(cc).map(c => c.charCodeAt(0) + offset));
}
