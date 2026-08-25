'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search, User, LogOut, Plus, Settings, HelpCircle, Shield,
  Inbox, Users, Car, Wrench, Bell,
} from 'lucide-react';
import { getScreen, searchScreens, type ScreenMeta } from '@/lib/codes';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { signOut } from '@/lib/auth';
import Link from 'next/link';

// ── Quick Create items ───────────────────────────────────────────────────────
// Labels are translation keys resolved via useTranslations('nav')
const QUICK_CREATE = [
  { labelKey: 'leads', href: '/app/leads/nieuw', icon: Inbox, color: 'text-amber-400' },
  { labelKey: 'customers', href: '/app/klanten/nieuw', icon: Users, color: 'text-purple-400' },
  { labelKey: 'vehicles', href: '/app/voertuigen/nieuw', icon: Car, color: 'text-blue-400' },
  { labelKey: 'jobs', href: '/app/jobs/nieuw', icon: Wrench, color: 'text-cyan-400' },
];

// ── System Menu items ────────────────────────────────────────────────────────
type SysRow =
  | { kind: 'sep'; labelKey: string }
  | { kind: 'link'; labelKey: string; href: string; icon: React.ElementType }
  | { kind: 'action'; labelKey: string; icon: React.ElementType; run: () => void; danger?: boolean };

export function Header() {
  const pathname = usePathname();
  const screen = getScreen(pathname);
  const tHeader = useTranslations('header');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScreenMeta[]>([]);
  const [qcOpen, setQcOpen] = useState(false);
  const [sysOpen, setSysOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qcRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const sysRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  type HeaderNotif = { id: string; type: string; title: string; body: string | null; read: boolean; created_at: string };
  const [notifs, setNotifs] = useState<HeaderNotif[]>([]);
  const unreadCount = notifs.filter(n => !n.read).length;

  const loadNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) setNotifs(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);
  useEffect(() => {
    const iv = setInterval(loadNotifs, 15000);
    return () => clearInterval(iv);
  }, [loadNotifs]);

  async function handleMarkAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return tHeader('timeJustNow');
    if (mins < 60) return tHeader('timeMinAgo', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return tHeader('timeHourAgo', { count: hrs });
    return tHeader('timeDayAgo', { count: Math.floor(hrs / 24) });
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (qcRef.current && !qcRef.current.contains(e.target as Node)) setQcOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (sysRef.current && !sysRef.current.contains(e.target as Node)) setSysOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Cmd-K keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdkOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setCmdkOpen(false);
        setQcOpen(false);
        setBellOpen(false);
        setSysOpen(false);
        setUserMenuOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (cmdkOpen && inputRef.current) inputRef.current.focus();
  }, [cmdkOpen]);

  useEffect(() => {
    setResults(query.length > 0 ? searchScreens(query) : []);
  }, [query]);

  const sysRows: SysRow[] = [
    { kind: 'sep', labelKey: 'settingsSection' },
    { kind: 'link', labelKey: 'generalSettings', href: '/app/instellingen', icon: Settings },
    { kind: 'sep', labelKey: 'supportSection' },
    { kind: 'link', labelKey: 'helpDocs', href: '/app/help', icon: HelpCircle },
    { kind: 'sep', labelKey: 'securitySection' },
    { kind: 'link', labelKey: 'accountSecurity', href: '/app/instellingen/beveiliging', icon: Shield },
  ];

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-ck-dark-border bg-ck-dark-surface px-6">
        {/* Current screen info */}
        <div className="flex items-center gap-3">
          {screen && <ScreenBadge id={screen.id} />}
          <h1 className="text-sm font-semibold text-white">
            {screen?.titleNl ?? tCommon('appName')}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Quick Create */}
          <div ref={qcRef} className="relative">
            <button
              onClick={() => { setQcOpen(!qcOpen); setSysOpen(false); setUserMenuOpen(false); }}
              className="flex items-center gap-1.5 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ck-red-hover"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{tCommon('new')}</span>
            </button>
            {qcOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ck-muted">
                  {tHeader('quickCreate')}
                </div>
                {QUICK_CREATE.map(qc => (
                  <Link
                    key={qc.href}
                    href={qc.href}
                    onClick={() => setQcOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ck-muted-light transition-colors hover:bg-ck-dark-border/50 hover:text-white"
                  >
                    <qc.icon size={14} className={qc.color} />
                    {tNav(qc.labelKey)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notification bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { setBellOpen(!bellOpen); setQcOpen(false); setSysOpen(false); setUserMenuOpen(false); }}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-ck-dark-border text-ck-muted transition-colors hover:bg-ck-dark-border hover:text-white"
              title={tHeader('notifications')}
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ck-red px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                <div className="flex items-center justify-between border-b border-ck-dark-border px-4 py-2.5">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-ck-muted">{tHeader('notifications')}</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] text-ck-red hover:text-ck-red-hover">
                      {tHeader('allRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-ck-muted">{tHeader('noNotifications')}</div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        className={`flex gap-3 border-b border-ck-dark-border/50 px-4 py-3 transition-colors hover:bg-ck-dark-border/30 ${
                          !n.read ? 'bg-ck-red/5' : ''
                        }`}
                      >
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? 'bg-ck-red' : 'bg-transparent'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-white">{n.title}</div>
                          {n.body && <div className="truncate text-[11px] text-ck-muted">{n.body}</div>}
                          <div className="mt-0.5 text-[10px] text-ck-muted/60">{timeAgo(n.created_at)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link
                  href="/app/monitoring"
                  onClick={() => setBellOpen(false)}
                  className="flex items-center justify-center border-t border-ck-dark-border py-2.5 text-xs text-ck-red hover:text-ck-red-hover"
                >
                  {tHeader('viewAll')}
                </Link>
              </div>
            )}
          </div>

          {/* Cmd-K trigger */}
          <button
            onClick={() => setCmdkOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-ck-dark-border bg-ck-dark px-3 py-1.5 text-xs text-ck-muted transition-colors hover:border-ck-muted/30 hover:text-white"
          >
            <Search size={14} />
            <span className="hidden sm:inline">{tHeader('searchLabel')}</span>
            <kbd className="rounded border border-ck-dark-border px-1 py-0.5 font-mono text-[10px] text-ck-muted">
              ⌘K
            </kbd>
          </button>

          {/* System menu */}
          <div ref={sysRef} className="relative">
            <button
              onClick={() => { setSysOpen(!sysOpen); setQcOpen(false); setUserMenuOpen(false); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ck-dark-border text-ck-muted transition-colors hover:bg-ck-dark-border hover:text-white"
              title={tHeader('system')}
            >
              <Settings size={14} />
            </button>
            {sysOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                {sysRows.map((r, i) => {
                  if (r.kind === 'sep') {
                    return (
                      <div key={i} className="mt-1 px-3 pb-0.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ck-muted/50">
                        {tHeader(r.labelKey)}
                      </div>
                    );
                  }
                  if (r.kind === 'link') {
                    return (
                      <Link
                        key={r.href}
                        href={r.href}
                        onClick={() => setSysOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ck-muted-light transition-colors hover:bg-ck-dark-border/50 hover:text-white"
                      >
                        <r.icon size={14} />
                        {tHeader(r.labelKey)}
                      </Link>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setQcOpen(false); setSysOpen(false); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ck-dark-border text-ck-muted-light transition-colors hover:bg-ck-red hover:text-white"
            >
              <User size={16} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                <div className="border-b border-ck-dark-border px-4 py-3">
                  <div className="text-xs font-medium text-white">{tHeader('admin')}</div>
                  <div className="text-[11px] text-ck-muted">admin@colourking.nl</div>
                </div>
                <Link
                  href="/app/instellingen"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-ck-muted-light transition-colors hover:bg-ck-dark-border/50 hover:text-white"
                >
                  <Settings size={14} />
                  {tCommon('settings')}
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-red-400 transition-colors hover:bg-ck-dark-border/50 hover:text-red-300"
                >
                  <LogOut size={14} />
                  {tCommon('signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cmd-K palette */}
      {cmdkOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[20vh]"
          onClick={() => setCmdkOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-ck-dark-border bg-ck-dark-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-ck-dark-border px-4 py-3">
              <Search size={16} className="text-ck-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tHeader('searchPlaceholder')}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-ck-muted"
              />
              <kbd className="rounded border border-ck-dark-border px-1.5 py-0.5 font-mono text-[10px] text-ck-muted">
                ESC
              </kbd>
            </div>
            {results.length > 0 && (
              <div className="max-h-64 overflow-y-auto p-2">
                {results.map((s) => (
                  <Link
                    key={s.route}
                    href={s.route}
                    onClick={() => { setCmdkOpen(false); setQuery(''); }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ck-muted-light transition-colors hover:bg-ck-dark-border/50 hover:text-white"
                  >
                    <ScreenBadge id={s.id} />
                    <span>{s.titleNl}</span>
                    <span className="ml-auto text-[11px] text-ck-muted">{s.title}</span>
                  </Link>
                ))}
              </div>
            )}
            {query.length > 0 && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-ck-muted">
                {tHeader('noScreensFound')}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
