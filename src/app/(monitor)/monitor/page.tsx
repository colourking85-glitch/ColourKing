'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Inbox, Wrench, Mail,
  CalendarCheck, Package, CreditCard, FileText, AlertCircle,
  Volume2, VolumeX, RefreshCw, Maximize, LogOut, Filter,
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import type { NotificationType } from '@/types/database';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_META: Record<NotificationType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  new_lead: { icon: Inbox, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Lead' },
  stage_change: { icon: Wrench, color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Fase' },
  new_email: { icon: Mail, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'E-mail' },
  appointment_confirmed: { icon: CalendarCheck, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Afspraak' },
  appointment_cancelled: { icon: CalendarCheck, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Annulering' },
  part_received: { icon: Package, color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Onderdeel' },
  payment_received: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Betaling' },
  document_issued: { icon: FileText, color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Document' },
  system: { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Systeem' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Zojuist';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u`;
  return `${Math.floor(hrs / 24)}d`;
}

function clockStr() {
  return new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function MonitorDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [clock, setClock] = useState(clockStr());
  const [refreshInterval, setRefreshInterval] = useState(8);
  const lastCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=100');
      if (res.ok) {
        const data: Notification[] = await res.json();
        const unreadCount = data.filter(n => !n.read).length;

        if (soundEnabled && unreadCount > lastCountRef.current && lastCountRef.current >= 0 && notifications.length > 0) {
          playSound();
        }
        lastCountRef.current = unreadCount;
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  }, [soundEnabled, notifications.length]);

  function playSound() {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Nk4+Ff3J5goqOjIJ3cHJ8hoyOiYN6c3R9hYuMiIR8d3Z7goiKiIWBfHp6f4SHiIaEgn98fH2AhIaGhYOBf359f4GDhYWEg4F/fn5/gYOEhISDgYB/fn+AgYODg4KBgH9/f4CBgoOCgoGAf39/gIGCgoKBgYB/f3+AgYGCgoGBgH9/f4CBgYGBgYGAf39/gIGBgYGBgIB/f3+AgYGBgYGAgH9/f4CBgYGBgYCAf39/gA==');
    }
    audioRef.current.play().catch(() => {});
  }

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const iv = setInterval(load, refreshInterval * 1000);
    return () => clearInterval(iv);
  }, [load, refreshInterval]);

  useEffect(() => {
    const iv = setInterval(() => setClock(clockStr()), 1000);
    return () => clearInterval(iv);
  }, []);

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

  function goFullscreen() {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  const statCards = [
    { label: 'Ongelezen', value: unreadCount, color: 'text-[#E8364E]', pulse: unreadCount > 0 },
    { label: 'Leads', value: notifications.filter(n => n.type === 'new_lead' && !n.read).length, color: 'text-amber-400' },
    { label: 'Fasewijzigingen', value: notifications.filter(n => n.type === 'stage_change' && !n.read).length, color: 'text-cyan-400' },
    { label: 'E-mails', value: notifications.filter(n => n.type === 'new_email' && !n.read).length, color: 'text-blue-400' },
    { label: 'Afspraken', value: notifications.filter(n => n.type.startsWith('appointment') && !n.read).length, color: 'text-green-400' },
    { label: 'Betalingen', value: notifications.filter(n => n.type === 'payment_received' && !n.read).length, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1e1e2a] bg-[#0f0f17] px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8364E]">
            <span className="font-display text-xs font-bold text-white">CK</span>
          </div>
          <h1 className="font-display text-sm font-bold tracking-wide text-white">MONITORING</h1>
          {unreadCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-[#E8364E]/20 px-2.5 py-0.5 text-xs font-bold text-[#E8364E] animate-pulse">
              <Bell size={11} />
              {unreadCount}
            </span>
          )}
        </div>

        <div className="font-mono text-2xl font-bold tabular-nums text-white/80">
          {clock}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#1e1e2a] px-2 py-1">
            <RefreshCw size={12} className="text-[#6b6b80]" />
            <select
              value={refreshInterval}
              onChange={e => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-xs text-white outline-none cursor-pointer"
            >
              <option value={3} className="bg-[#12121a]">3s</option>
              <option value={5} className="bg-[#12121a]">5s</option>
              <option value={8} className="bg-[#12121a]">8s</option>
              <option value={10} className="bg-[#12121a]">10s</option>
              <option value={15} className="bg-[#12121a]">15s</option>
              <option value={30} className="bg-[#12121a]">30s</option>
              <option value={60} className="bg-[#12121a]">60s</option>
            </select>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1e2a] transition-colors ${
              soundEnabled ? 'text-green-400' : 'text-[#6b6b80]'
            }`}
            title={soundEnabled ? 'Geluid aan' : 'Geluid uit'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <button
            onClick={goFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1e2a] text-[#6b6b80] transition-colors hover:text-white"
            title="Volledig scherm"
          >
            <Maximize size={14} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#E8364E] px-3 text-xs font-semibold text-white"
            >
              <CheckCheck size={12} /> Alles gelezen
            </button>
          )}
          <button
            onClick={() => signOut().then(() => window.location.href = '/monitor/login')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1e2a] text-[#6b6b80] transition-colors hover:text-red-400"
            title="Uitloggen"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid shrink-0 grid-cols-6 gap-3 border-b border-[#1e1e2a] bg-[#0f0f17] p-4">
        {statCards.map(s => (
          <div
            key={s.label}
            className={`rounded-xl border border-[#1e1e2a] bg-[#12121a] p-4 text-center ${s.pulse ? 'animate-pulse' : ''}`}
          >
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-[11px] text-[#6b6b80]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#1e1e2a] bg-[#0f0f17] px-6 py-2">
        <Filter size={12} className="text-[#6b6b80]" />
        {[
          { value: 'all', label: 'Alles' },
          { value: 'new_lead', label: 'Leads' },
          { value: 'stage_change', label: 'Fases' },
          { value: 'new_email', label: 'E-mail' },
          { value: 'appointment_confirmed', label: 'Afspraken' },
          { value: 'payment_received', label: 'Betalingen' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              filter === f.value
                ? 'bg-[#E8364E]/20 text-[#E8364E]'
                : 'bg-[#1e1e2a]/50 text-[#6b6b80] hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification feed */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1e1e2a] border-t-[#E8364E]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <BellOff size={56} className="text-[#1e1e2a]" />
            <div className="text-sm text-[#6b6b80]">
              {filter === 'all' ? 'Geen meldingen — alles is rustig' : 'Geen meldingen van dit type'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#3a3a50]">
              <RefreshCw size={10} className="animate-spin" />
              Automatisch vernieuwen actief ({refreshInterval}s)
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-2">
            {filtered.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.system;
              const Icon = meta.icon;
              return (
                <div
                  key={n.id}
                  className={`group flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    n.read
                      ? 'border-[#1e1e2a]/50 bg-[#12121a]/50'
                      : 'border-[#E8364E]/30 bg-[#12121a] shadow-lg shadow-[#E8364E]/5'
                  }`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                    <Icon size={20} className={meta.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{n.title}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-[#E8364E]" />
                      )}
                    </div>
                    {n.body && (
                      <div className="mt-0.5 text-xs text-[#6b6b80]">{n.body}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tabular-nums text-[#3a3a50]">{timeAgo(n.created_at)}</span>
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="rounded-lg p-1.5 text-[#6b6b80] opacity-0 transition-all hover:bg-[#1e1e2a] hover:text-white group-hover:opacity-100"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[#1e1e2a] bg-[#0f0f17] px-6 text-[10px] text-[#3a3a50]">
        <span>monitor.colourking.nl</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Verbonden — auto-refresh {refreshInterval}s
        </span>
        <span>{notifications.length} meldingen totaal</span>
      </footer>
    </div>
  );
}
