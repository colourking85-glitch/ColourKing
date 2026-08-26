'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Wrench, Inbox, Receipt, FileText, Users, Car, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  href: string;
  created_at: string;
  icon: string;
};

const ICON_MAP: Record<string, React.ElementType> = {
  bell: Bell,
  wrench: Wrench,
  inbox: Inbox,
  receipt: Receipt,
  file: FileText,
  users: Users,
  car: Car,
  check: CheckCircle,
};

const COLOR_MAP: Record<string, string> = {
  job_event: 'text-cyan-400 bg-cyan-400/10',
  notification: 'text-amber-400 bg-amber-400/10',
  lead_created: 'text-amber-400 bg-amber-400/10',
  invoice_paid: 'text-emerald-400 bg-emerald-400/10',
  customer_created: 'text-purple-400 bg-purple-400/10',
  vehicle_added: 'text-blue-400 bg-blue-400/10',
  task_completed: 'text-green-400 bg-green-400/10',
};

export function ActivityFeed() {
  const t = useTranslations('activity');
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/activity?limit=15');
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="rounded-lg border border-ck-dark-border bg-ck-dark-surface">
      <div className="flex items-center justify-between border-b border-ck-dark-border px-4 py-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
          {t('recentActivity')}
        </h3>
        <Link href="/app/monitoring" className="text-[11px] text-ck-red hover:text-ck-red-hover">
          {t('viewAll')}
        </Link>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-white/20">Loading...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-white/20">{t('noActivity')}</div>
        ) : (
          items.map(item => {
            const Icon = ICON_MAP[item.icon] || Bell;
            const colors = COLOR_MAP[item.type] || 'text-white/40 bg-white/5';
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-start gap-3 border-b border-ck-dark-border/30 px-4 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${colors}`}>
                  <Icon size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-white/80">{item.title}</p>
                  {item.subtitle && (
                    <p className="mt-0.5 truncate text-[11px] text-white/30">{item.subtitle}</p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-white/20">{timeAgo(item.created_at)}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
