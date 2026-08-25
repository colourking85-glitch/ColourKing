'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Inbox, Wrench, Mail,
  CalendarCheck, Package, CreditCard, FileText, AlertCircle,
  Filter, RefreshCw, Trash2, Volume2, VolumeX,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { NotificationType } from '@/types/database';

type Notification = {
  id: string;
  staff_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  ref_type: string | null;
  ref_id: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_META: Record<NotificationType, { icon: React.ElementType; color: string; labelKey: string }> = {
  new_lead: { icon: Inbox, color: 'text-amber-400 bg-amber-400/10', labelKey: 'newLead' },
  stage_change: { icon: Wrench, color: 'text-cyan-400 bg-cyan-400/10', labelKey: 'stageChanges' },
  new_email: { icon: Mail, color: 'text-blue-400 bg-blue-400/10', labelKey: 'email' },
  appointment_confirmed: { icon: CalendarCheck, color: 'text-green-400 bg-green-400/10', labelKey: 'appointmentConfirmed' },
  appointment_cancelled: { icon: CalendarCheck, color: 'text-red-400 bg-red-400/10', labelKey: 'appointmentCancelled' },
  part_received: { icon: Package, color: 'text-orange-400 bg-orange-400/10', labelKey: 'partReceived' },
  payment_received: { icon: CreditCard, color: 'text-emerald-400 bg-emerald-400/10', labelKey: 'paymentReceived' },
  document_issued: { icon: FileText, color: 'text-rose-400 bg-rose-400/10', labelKey: 'documentIssued' },
  system: { icon: AlertCircle, color: 'text-slate-400 bg-slate-400/10', labelKey: 'system' },
};

const FILTER_KEYS: { value: string; labelKey: string }[] = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'unread', labelKey: 'filterUnread' },
  { value: 'new_lead', labelKey: 'filterLeads' },
  { value: 'stage_change', labelKey: 'stageChanges' },
  { value: 'new_email', labelKey: 'filterEmail' },
  { value: 'appointment_confirmed', labelKey: 'filterAppointments' },
  { value: 'payment_received', labelKey: 'filterPayments' },
];

export default function MonitoringPage() {
  const t = useTranslations('monitor');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [polling, setPolling] = useState(true);
  const lastCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('timeJustNow');
    if (mins < 60) return `${mins}${t('timeMinAgo')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t('timeHourAgo')}`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return `1${t('timeDayAgo')}`;
    return `${days}${t('timeDayAgo')}`;
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=100');
      if (res.ok) {
        const data: Notification[] = await res.json();
        const unreadCount = data.filter(n => !n.read).length;

        if (soundEnabled && unreadCount > lastCountRef.current && lastCountRef.current > 0) {
          playNotificationSound();
        }
        lastCountRef.current = unreadCount;
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  function playNotificationSound() {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Nk4+Ff3J5goqOjIJ3cHJ8hoyOiYN6c3R9hYuMiIR8d3Z7goiKiIWBfHp6f4SHiIaEgn98fH2AhIaGhYOBf359f4GDhYWEg4F/fn5/gYOEhISDgYB/fn+AgYODg4KBgH9/f4CBgoOCgoGAf39/gIGCgoKBgYB/f3+AgYGCgoGBgH9/f4CBgYGBgYGAf39/gIGBgYGBgIB/f3+AgYGBgYGAgH9/f4CBgYGBgYCAf39/gA==');
    }
    audioRef.current.play().catch(() => {});
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [polling, load]);

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, read: true }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    lastCountRef.current = 0;
  }

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const todayNotifs = filtered.filter(n => {
    const d = new Date(n.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const olderNotifs = filtered.filter(n => {
    const d = new Date(n.created_at);
    const today = new Date();
    return d.toDateString() !== today.toDateString();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="SY05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
          {unreadCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-ck-red/20 px-2.5 py-0.5 text-xs font-semibold text-ck-red">
              <Bell size={12} />
              {t('unreadCount', { count: unreadCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-ck-dark-border transition-colors ${
              soundEnabled ? 'text-green-400 hover:bg-green-400/10' : 'text-ck-muted hover:bg-ck-dark-border'
            }`}
            title={soundEnabled ? t('soundOn') : t('soundOff')}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={() => setPolling(!polling)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-ck-dark-border transition-colors ${
              polling ? 'text-green-400 hover:bg-green-400/10' : 'text-ck-muted hover:bg-ck-dark-border'
            }`}
            title={polling ? t('autoRefreshOn') : t('autoRefreshOff')}
          >
            <RefreshCw size={14} className={polling ? 'animate-spin-slow' : ''} />
          </button>
          <button
            onClick={load}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 text-xs text-ck-muted transition-colors hover:bg-ck-dark-border hover:text-white"
          >
            <RefreshCw size={12} />
            {t('refresh')}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-ck-red px-3 text-xs font-semibold text-white transition-colors hover:bg-ck-red-hover"
            >
              <CheckCheck size={12} />
              {t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('unread'), value: unreadCount, color: 'text-ck-red' },
          { label: t('today'), value: todayNotifs.length, color: 'text-cyan-400' },
          { label: t('leads'), value: notifications.filter(n => n.type === 'new_lead' && !n.read).length, color: 'text-amber-400' },
          { label: t('total'), value: notifications.length, color: 'text-ck-muted-light' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
            <div className="text-xs text-ck-muted">{s.label}</div>
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-ck-muted" />
        {FILTER_KEYS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === opt.value
                ? 'bg-ck-red/20 text-ck-red'
                : 'bg-ck-dark-border/50 text-ck-muted hover:text-white'
            }`}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="py-12 text-center text-ck-muted">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <BellOff size={40} className="text-ck-muted/30" />
          <div className="text-sm text-ck-muted">
            {filter === 'all' ? t('noNotifications') : t('noNotificationsFilter')}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {todayNotifs.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ck-muted">{t('todayLabel')}</div>
              <div className="space-y-1">
                {todayNotifs.map(n => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={markRead} timeAgo={timeAgo} />
                ))}
              </div>
            </div>
          )}
          {olderNotifs.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ck-muted">{t('earlierLabel')}</div>
              <div className="space-y-1">
                {olderNotifs.map(n => (
                  <NotificationRow key={n.id} notification={n} onMarkRead={markRead} timeAgo={timeAgo} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification: n,
  onMarkRead,
  timeAgo,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  timeAgo: (d: string) => string;
}) {
  const t = useTranslations('monitor');
  const meta = TYPE_META[n.type] ?? TYPE_META.system;
  const Icon = meta.icon;

  return (
    <div
      className={`group flex items-start gap-3 rounded-lg border border-ck-dark-border p-4 transition-colors ${
        n.read ? 'bg-ck-dark-card/50' : 'bg-ck-dark-card border-l-2 border-l-ck-red'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-white">{n.title}</span>
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${meta.color}`}>
              {t(meta.labelKey)}
            </span>
          </div>
          <span className="shrink-0 text-[11px] text-ck-muted">{timeAgo(n.created_at)}</span>
        </div>
        {n.body && (
          <div className="mt-0.5 text-xs text-ck-muted-light">{n.body}</div>
        )}
        {n.link && (
          <a
            href={n.link}
            className="mt-1 inline-block text-xs text-ck-red hover:text-ck-red-hover"
          >
            {t('viewArrow')}
          </a>
        )}
      </div>
      {!n.read && (
        <button
          onClick={() => onMarkRead(n.id)}
          className="shrink-0 rounded-lg p-1.5 text-ck-muted opacity-0 transition-all hover:bg-ck-dark-border hover:text-white group-hover:opacity-100"
          title={t('markAsRead')}
        >
          <Check size={14} />
        </button>
      )}
    </div>
  );
}
