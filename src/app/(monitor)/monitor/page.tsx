'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, BellOff, Check, CheckCheck, Inbox, Wrench, Mail,
  CalendarCheck, Package, CreditCard, FileText, AlertCircle,
  Volume2, VolumeX, RefreshCw, Maximize, LogOut, Filter,
  Car, Clock, Calendar, Timer, TrendingUp,
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

type MonitorJob = {
  id: string;
  number: number;
  stage: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers: { id: string; name: string } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null; colour: string | null } | null;
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

const STAGE_LABELS: Record<string, { label: string; color: string; border: string }> = {
  checked_in: { label: 'Ingecheckt', color: 'text-blue-400 bg-blue-400/10', border: 'border-blue-400/30' },
  in_progress: { label: 'In bewerking', color: 'text-amber-400 bg-amber-400/10', border: 'border-amber-400/30' },
  qc: { label: 'QC', color: 'text-purple-400 bg-purple-400/10', border: 'border-purple-400/30' },
  scheduled: { label: 'Gepland', color: 'text-cyan-400 bg-cyan-400/10', border: 'border-cyan-400/30' },
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

function durationStr(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs >= 24) {
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}u`;
  }
  return `${hrs}u ${mins}m`;
}

function durationHours(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 3600000;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((d.getTime() - now.getTime()) / 86400000);
  const dayStr = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Vandaag ${timeStr}`;
  if (diffDays === 1) return `Morgen ${timeStr}`;
  return `${dayStr} ${timeStr}`;
}

function clockStr() {
  return new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function useAlertSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const playingRef = useRef(false);

  return useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;

    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;

    const now = ctx.currentTime;
    const duration = 10;
    const tones = [880, 1046.5, 880, 784, 880, 1046.5, 880, 784, 880, 1046.5];

    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i);
      gain.gain.linearRampToValueAtTime(0.15, now + i + 0.05);
      gain.gain.linearRampToValueAtTime(0.1, now + i + 0.4);
      gain.gain.linearRampToValueAtTime(0, now + i + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i);
      osc.stop(now + i + 1);
    });

    setTimeout(() => { playingRef.current = false; }, duration * 1000);
  }, []);
}

export default function MonitorDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ongoing, setOngoing] = useState<MonitorJob[]>([]);
  const [scheduled, setScheduled] = useState<MonitorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [clock, setClock] = useState(clockStr());
  const [refreshInterval, setRefreshInterval] = useState(8);
  const [alertActive, setAlertActive] = useState(false);
  const lastCountRef = useRef(0);
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const playAlert = useAlertSound();

  const triggerAlert = useCallback(() => {
    setAlertActive(true);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => setAlertActive(false), 10000);
    if (soundEnabled) playAlert();
  }, [soundEnabled, playAlert]);

  const load = useCallback(async () => {
    try {
      const [notifRes, monitorRes] = await Promise.all([
        fetch('/api/notifications?limit=100'),
        fetch('/api/monitor'),
      ]);

      if (notifRes.ok) {
        const data: Notification[] = await notifRes.json();
        const unreadCount = data.filter(n => !n.read).length;

        if (unreadCount > lastCountRef.current && lastCountRef.current >= 0 && notifications.length > 0) {
          triggerAlert();
        }
        lastCountRef.current = unreadCount;
        setNotifications(data);
      }

      if (monitorRes.ok) {
        const data = await monitorRes.json();
        setOngoing(data.ongoing ?? []);
        setScheduled(data.scheduled ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [notifications.length, triggerAlert]);

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
    setAlertActive(false);
  }

  function goFullscreen() {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  const recentUnread = notifications.filter(n => !n.read).slice(0, 8);
  const tickerItems = recentUnread.length > 0
    ? recentUnread.map(n => {
        const meta = TYPE_META[n.type] ?? TYPE_META.system;
        return `${meta.label}: ${n.title}${n.body ? ` — ${n.body}` : ''}`;
      })
    : ['Geen nieuwe meldingen — systeem draait normaal'];
  const tickerText = tickerItems.join('     ●     ');

  const statCards = [
    { label: 'Ongelezen', value: unreadCount, color: 'text-[#E8364E]', pulse: unreadCount > 0 },
    { label: 'In bewerking', value: ongoing.length, color: 'text-amber-400' },
    { label: 'Gepland', value: scheduled.length, color: 'text-cyan-400' },
    { label: 'Leads', value: notifications.filter(n => n.type === 'new_lead' && !n.read).length, color: 'text-yellow-400' },
    { label: 'E-mails', value: notifications.filter(n => n.type === 'new_email' && !n.read).length, color: 'text-blue-400' },
    { label: 'Betalingen', value: notifications.filter(n => n.type === 'payment_received' && !n.read).length, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-14deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(6deg); }
          60% { transform: rotate(-6deg); }
          70% { transform: rotate(2deg); }
          80% { transform: rotate(-2deg); }
        }
        @keyframes alertGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,54,78,0); }
          50% { box-shadow: 0 0 20px 4px rgba(232,54,78,0.4); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes progressPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .ticker-scroll {
          animation: ticker 30s linear infinite;
        }
        .bell-ring {
          animation: bellRing 1s ease-in-out infinite;
        }
        .alert-glow {
          animation: alertGlow 1.5s ease-in-out infinite;
        }
        .slide-in {
          animation: slideIn 0.3s ease-out;
        }
        .progress-pulse {
          animation: progressPulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Top bar */}
      <header className={`flex h-14 shrink-0 items-center justify-between border-b px-6 transition-colors duration-500 ${
        alertActive ? 'border-[#E8364E]/50 bg-[#E8364E]/5' : 'border-[#1e1e2a] bg-[#0f0f17]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8364E] ${alertActive ? 'alert-glow' : ''}`}>
            <span className="font-display text-xs font-bold text-white">CK</span>
          </div>
          <h1 className="font-display text-sm font-bold tracking-wide text-white">MONITORING</h1>
          {unreadCount > 0 && (
            <span className={`flex items-center gap-1 rounded-full bg-[#E8364E]/20 px-2.5 py-0.5 text-xs font-bold text-[#E8364E] ${alertActive ? '' : 'animate-pulse'}`}>
              <span className={alertActive ? 'bell-ring inline-block' : ''}>
                <Bell size={11} />
              </span>
              {unreadCount}
            </span>
          )}
          {alertActive && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#E8364E] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white animate-pulse">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              Nieuwe melding
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

      {/* Flying ticker banner */}
      <div className={`flex h-8 shrink-0 items-center overflow-hidden border-b transition-colors duration-500 ${
        alertActive
          ? 'border-[#E8364E]/30 bg-gradient-to-r from-[#E8364E]/10 via-[#0f0f17] to-[#E8364E]/10'
          : 'border-[#1e1e2a] bg-[#0a0a12]'
      }`}>
        <div className="ticker-scroll whitespace-nowrap text-xs">
          <span className={alertActive ? 'text-[#E8364E] font-semibold' : 'text-[#6b6b80]'}>
            {tickerText}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid shrink-0 grid-cols-6 gap-3 border-b border-[#1e1e2a] bg-[#0f0f17] p-4">
        {statCards.map(s => (
          <div
            key={s.label}
            className={`rounded-xl border border-[#1e1e2a] bg-[#12121a] p-4 text-center transition-all duration-300 ${
              s.pulse ? 'alert-glow' : ''
            }`}
          >
            <div className={`font-display text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-[11px] text-[#6b6b80]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main content: two-column layout */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Jobs panels */}
        <div className="flex w-[400px] shrink-0 flex-col border-r border-[#1e1e2a] overflow-y-auto">
          {/* Ongoing jobs */}
          <div className="border-b border-[#1e1e2a] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Car size={14} className="text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">In bewerking</h2>
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">{ongoing.length}</span>
            </div>
            {ongoing.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#1e1e2a] p-6 text-center text-xs text-[#3a3a50]">
                Geen voertuigen in bewerking
              </div>
            ) : (
              <div className="space-y-2">
                {ongoing.map(job => {
                  const stage = STAGE_LABELS[job.stage] ?? { label: job.stage, color: 'text-slate-400 bg-slate-400/10', border: 'border-slate-400/30' };
                  const hours = durationHours(job.created_at);
                  const isOvertime = hours > 48;
                  const isWarning = hours > 24 && !isOvertime;
                  return (
                    <div key={job.id} className={`slide-in rounded-xl border bg-[#12121a] p-3 transition-all ${stage.border}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">
                            {job.vehicles?.kenteken ?? '—'}
                          </span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${stage.color}`}>
                            {stage.label}
                          </span>
                        </div>
                        <span className="text-[10px] tabular-nums text-[#3a3a50]">#{job.number}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#6b6b80]">
                        {job.vehicles?.make && (
                          <span>{job.vehicles.make} {job.vehicles.model}</span>
                        )}
                        {job.vehicles?.colour && (
                          <span className="flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full border border-[#3a3a50]" style={{ backgroundColor: job.vehicles.colour }} />
                            {job.vehicles.colour}
                          </span>
                        )}
                      </div>
                      {job.customers?.name && (
                        <div className="mt-1 text-[11px] text-[#6b6b80]">{job.customers.name}</div>
                      )}
                      {/* Duration tracker */}
                      <div className="mt-2 flex items-center gap-2">
                        <Timer size={10} className={isOvertime ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'} />
                        <span className={`text-[11px] font-mono font-semibold tabular-nums ${
                          isOvertime ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'
                        }`}>
                          {durationStr(job.created_at)}
                        </span>
                        {/* Progress bar */}
                        <div className="flex-1 h-1.5 rounded-full bg-[#1e1e2a] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOvertime ? 'bg-red-400 progress-pulse' : isWarning ? 'bg-amber-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${Math.min(100, (hours / 48) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming scheduled */}
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Gepland (4 dagen)</h2>
              <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">{scheduled.length}</span>
            </div>
            {scheduled.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#1e1e2a] p-6 text-center text-xs text-[#3a3a50]">
                Geen geplande voertuigen
              </div>
            ) : (
              <div className="space-y-2">
                {scheduled.map((job, i) => (
                  <div key={job.id} className="slide-in rounded-xl border border-cyan-400/20 bg-[#12121a] p-3" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {job.vehicles?.kenteken ?? '—'}
                        </span>
                        <span className="rounded-full bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
                          Gepland
                        </span>
                      </div>
                      <span className="text-[10px] tabular-nums text-[#3a3a50]">#{job.number}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#6b6b80]">
                      {job.vehicles?.make && (
                        <span>{job.vehicles.make} {job.vehicles.model}</span>
                      )}
                    </div>
                    {job.customers?.name && (
                      <div className="mt-1 text-[11px] text-[#6b6b80]">{job.customers.name}</div>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-400/70">
                      <Calendar size={9} />
                      {formatDate(job.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance summary */}
          <div className="border-t border-[#1e1e2a] p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Prestaties</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#1e1e2a] bg-[#12121a] p-3 text-center">
                <div className="text-lg font-bold tabular-nums text-emerald-400">
                  {ongoing.length > 0
                    ? `${Math.round(ongoing.reduce((sum, j) => sum + durationHours(j.created_at), 0) / ongoing.length)}u`
                    : '—'}
                </div>
                <div className="mt-0.5 text-[9px] text-[#6b6b80]">Gem. doorlooptijd</div>
              </div>
              <div className="rounded-lg border border-[#1e1e2a] bg-[#12121a] p-3 text-center">
                <div className={`text-lg font-bold tabular-nums ${
                  ongoing.filter(j => durationHours(j.created_at) > 48).length > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {ongoing.filter(j => durationHours(j.created_at) > 48).length}
                </div>
                <div className="mt-0.5 text-[9px] text-[#6b6b80]">Vertraagd (&gt;48u)</div>
              </div>
              <div className="rounded-lg border border-[#1e1e2a] bg-[#12121a] p-3 text-center">
                <div className="text-lg font-bold tabular-nums text-amber-400">
                  {ongoing.filter(j => j.stage === 'in_progress').length}
                </div>
                <div className="mt-0.5 text-[9px] text-[#6b6b80]">Actief in werk</div>
              </div>
              <div className="rounded-lg border border-[#1e1e2a] bg-[#12121a] p-3 text-center">
                <div className="text-lg font-bold tabular-nums text-purple-400">
                  {ongoing.filter(j => j.stage === 'qc').length}
                </div>
                <div className="mt-0.5 text-[9px] text-[#6b6b80]">In QC</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Notification feed */}
        <div className="flex min-w-0 flex-1 flex-col">
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

          {/* Feed */}
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
              <div className="space-y-2">
                {filtered.map((n, i) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.system;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      className={`slide-in group flex items-center gap-4 rounded-xl border p-4 transition-all ${
                        n.read
                          ? 'border-[#1e1e2a]/50 bg-[#12121a]/50'
                          : 'border-[#E8364E]/30 bg-[#12121a] shadow-lg shadow-[#E8364E]/5'
                      }`}
                      style={{ animationDelay: `${i * 30}ms` }}
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
                            <span className="h-2 w-2 rounded-full bg-[#E8364E] animate-pulse" />
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
        </div>
      </div>

      {/* Bottom status bar */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-[#1e1e2a] bg-[#0f0f17] px-6 text-[10px] text-[#3a3a50]">
        <span>monitor.colourking.nl</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${alertActive ? 'bg-[#E8364E] animate-ping' : 'bg-green-500'}`} />
          {alertActive ? 'Alert actief' : `Verbonden — auto-refresh ${refreshInterval}s`}
        </span>
        <span>{ongoing.length} actief · {scheduled.length} gepland · {notifications.length} meldingen</span>
      </footer>
    </div>
  );
}
