'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search, User, LogOut, Plus, Settings, HelpCircle,
  Inbox, Users, Car, Wrench, Bell, Sparkles,
  ClipboardList, ChevronDown,
} from 'lucide-react';
import { getScreen, searchScreens, type ScreenMeta } from '@/lib/codes';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { signOut } from '@/lib/auth';
import { getFavorites, getRecentItems, addRecentItem, type FavoriteItem } from '@/lib/favorites';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Star, FileText } from 'lucide-react';

type EntityResult = {
  type: 'customer' | 'vehicle' | 'job' | 'lead' | 'invoice';
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

const QUICK_CREATE = [
  { labelKey: 'leads', href: '/app/leads/nieuw', icon: Inbox, color: 'text-amber-400' },
  { labelKey: 'customers', href: '/app/klanten/nieuw', icon: Users, color: 'text-purple-400' },
  { labelKey: 'vehicles', href: '/app/voertuigen/nieuw', icon: Car, color: 'text-blue-400' },
  { labelKey: 'jobs', href: '/app/jobs/nieuw', icon: Wrench, color: 'text-cyan-400' },
];

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
  const [entityResults, setEntityResults] = useState<EntityResult[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [recentItems, setRecentItems] = useState<FavoriteItem[]>([]);
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

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: staff } = await supabase
        .from('staff')
        .select('name, email, role')
        .eq('id', user.id)
        .single();
      if (staff) setCurrentUser(staff);
      else setCurrentUser({ name: user.email?.split('@')[0] ?? '', email: user.email ?? '', role: '' });
    }
    loadUser();
  }, []);

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
    if (cmdkOpen) {
      inputRef.current?.focus();
      setFavorites(getFavorites());
      setRecentItems(getRecentItems());
    } else {
      setQuery('');
      setEntityResults([]);
    }
  }, [cmdkOpen]);

  useEffect(() => {
    setResults(query.length > 0 ? searchScreens(query) : []);

    if (query.length >= 2) {
      const controller = new AbortController();
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : [])
        .then(setEntityResults)
        .catch(() => {});
      return () => controller.abort();
    } else {
      setEntityResults([]);
    }
  }, [query]);

  const sysRows: SysRow[] = [
    { kind: 'sep', labelKey: 'settingsSection' },
    { kind: 'link', labelKey: 'generalSettings', href: '/app/instellingen', icon: Settings },
    { kind: 'sep', labelKey: 'supportSection' },
    { kind: 'link', labelKey: 'helpDocs', href: '/app/help', icon: HelpCircle },
  ];

  function closeAll() {
    setQcOpen(false);
    setBellOpen(false);
    setSysOpen(false);
    setUserMenuOpen(false);
  }

  return (
    <>
      <header className="flex h-12 items-center border-b border-ck-dark-border bg-white/[0.03]">
        {/* ── Left: Logo + Screen context ──────────────────────────────── */}
        <div className="flex items-center gap-3 pl-4 pr-3">
          <div className="flex items-center gap-2">
            {screen && <ScreenBadge id={screen.id} />}
            <span className="hidden text-[13px] font-medium text-white/80 sm:inline">
              {screen?.titleNl ?? tCommon('appName')}
            </span>
          </div>
        </div>

        {/* ── Center: Actions + Search ─────────────────────────────────── */}
        <div className="flex flex-1 items-center gap-1 px-2">
          {/* Notification bell */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { closeAll(); setBellOpen(v => !v); }}
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80"
              title={tHeader('notifications')}
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ck-red px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-lg border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                <div className="flex items-center justify-between border-b border-ck-dark-border px-4 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{tHeader('notifications')}</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] text-ck-red hover:text-ck-red-hover">
                      {tHeader('allRead')}
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-white/30">{tHeader('noNotifications')}</div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        className={`flex gap-3 border-b border-ck-dark-border/50 px-4 py-3 transition-colors hover:bg-white/[0.03] ${
                          !n.read ? 'bg-ck-red/5' : ''
                        }`}
                      >
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? 'bg-ck-red' : 'bg-transparent'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-white">{n.title}</div>
                          {n.body && <div className="truncate text-[11px] text-white/40">{n.body}</div>}
                          <div className="mt-0.5 text-[10px] text-white/20">{timeAgo(n.created_at)}</div>
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

          {/* AI */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-panel'))}
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80"
            title={tHeader('ai')}
          >
            <Sparkles size={14} />
            <span className="hidden text-xs font-medium sm:inline">{tHeader('ai')}</span>
          </button>

          <div className="h-5 w-px bg-ck-dark-border" />

          {/* Quick Create */}
          <div ref={qcRef} className="relative">
            <button
              onClick={() => { closeAll(); setQcOpen(v => !v); }}
              className="flex h-8 items-center gap-1.5 rounded-md bg-ck-red/90 px-3 text-xs font-semibold text-white transition-colors hover:bg-ck-red"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">{tHeader('quickCreate')}</span>
            </button>
            {qcOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-lg border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                  {tHeader('quickCreate')}
                </div>
                {QUICK_CREATE.map(qc => (
                  <Link
                    key={qc.href}
                    href={qc.href}
                    onClick={() => setQcOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <qc.icon size={14} className={qc.color} />
                    {tNav(qc.labelKey)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* My Work */}
          <Link
            href="/app/taken"
            className="flex h-8 items-center gap-1.5 rounded-md border border-ck-dark-border px-3 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80"
          >
            <ClipboardList size={13} />
            <span className="hidden sm:inline">{tHeader('myWork')}</span>
          </Link>

          {/* Persistent search bar (desktop) */}
          <div className="ml-2 hidden flex-1 md:block">
            <button
              onClick={() => setCmdkOpen(true)}
              className="flex h-8 w-full max-w-md items-center gap-2 rounded-md border border-ck-dark-border bg-white/[0.03] px-3 text-left transition-colors hover:border-white/10"
            >
              <Search size={13} className="shrink-0 text-white/30" />
              <span className="flex-1 truncate text-xs text-white/25">
                {tHeader('searchByCode')}
              </span>
              <kbd className="shrink-0 rounded border border-ck-dark-border px-1 py-0.5 font-mono text-[9px] text-white/20">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Mobile search icon */}
          <button
            onClick={() => setCmdkOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 md:hidden"
          >
            <Search size={15} />
          </button>
        </div>

        {/* ── Right: System + Env badge + User ─────────────────────────── */}
        <div className="flex items-center gap-1.5 pr-4">
          {/* System */}
          <div ref={sysRef} className="relative">
            <button
              onClick={() => { closeAll(); setSysOpen(v => !v); }}
              className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80"
              title={tHeader('system')}
            >
              <Settings size={14} />
              <span className="hidden text-xs font-medium lg:inline">{tHeader('system')}</span>
            </button>
            {sysOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                {sysRows.map((r, i) => {
                  if (r.kind === 'sep') {
                    return (
                      <div key={i} className="mt-1 px-3 pb-0.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">
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
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
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

          <div className="h-5 w-px bg-ck-dark-border" />

          {/* User avatar + name */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => { closeAll(); setUserMenuOpen(v => !v); }}
              className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ck-dark-border text-white/60">
                <User size={14} />
              </div>
              <div className="hidden text-left lg:block">
                <div className="text-xs font-medium leading-tight text-white/70">{currentUser?.name || tHeader('admin')}</div>
                <div className="text-[10px] leading-tight text-white/30">{currentUser?.role || tHeader('viewer')}</div>
              </div>
              <ChevronDown size={12} className="hidden text-white/30 lg:block" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-lg border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                <div className="border-b border-ck-dark-border px-4 py-3">
                  <div className="text-xs font-medium text-white">{currentUser?.name || tHeader('admin')}</div>
                  <div className="text-[11px] text-white/40">{currentUser?.email || ''}</div>
                </div>
                <Link
                  href="/app/instellingen"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Settings size={14} />
                  {tCommon('settings')}
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-red-400 transition-colors hover:bg-white/[0.06] hover:text-red-300"
                >
                  <LogOut size={14} />
                  {tCommon('signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Cmd-K palette ─────────────────────────────────────────────── */}
      {cmdkOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[20vh]"
          onClick={() => setCmdkOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-ck-dark-border bg-ck-dark-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-ck-dark-border px-4 py-3">
              <Search size={16} className="text-white/30" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tHeader('searchPlaceholder')}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
              <kbd className="rounded border border-ck-dark-border px-1.5 py-0.5 font-mono text-[10px] text-white/30">
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {/* No query: show favorites + recents */}
              {query.length === 0 && (
                <>
                  {favorites.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">
                        <Star size={10} className="mr-1 inline" />
                        {tCommon('search') !== 'Search' ? 'Favorieten' : 'Favorites'}
                      </div>
                      {favorites.map(fav => (
                        <Link
                          key={fav.href}
                          href={fav.href}
                          onClick={() => { setCmdkOpen(false); addRecentItem(fav); }}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          <Star size={12} className="text-amber-400" />
                          <span>{fav.label}</span>
                          <span className="ml-auto text-[10px] text-white/20">{fav.type}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {recentItems.length > 0 && (
                    <div className="border-t border-ck-dark-border/50 p-2">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">
                        {tCommon('search') !== 'Search' ? 'Recent' : 'Recent'}
                      </div>
                      {recentItems.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { setCmdkOpen(false); addRecentItem(item); }}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                        >
                          <span className="text-[11px] text-white/20">↻</span>
                          <span>{item.label}</span>
                          <span className="ml-auto text-[10px] text-white/20">{item.type}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {favorites.length === 0 && recentItems.length === 0 && (
                    <div className="px-4 py-6 text-center text-xs text-white/20">
                      {tHeader('searchPlaceholder')}
                    </div>
                  )}
                </>
              )}

              {/* Screen results */}
              {results.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">
                    Screens
                  </div>
                  {results.map((s) => (
                    <Link
                      key={s.route}
                      href={s.route}
                      onClick={() => {
                        setCmdkOpen(false);
                        addRecentItem({ href: s.route, label: s.titleNl, screenId: s.id, type: 'screen' });
                      }}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <ScreenBadge id={s.id} />
                      <span>{s.titleNl}</span>
                      <span className="ml-auto text-[11px] text-white/30">{s.title}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Entity results */}
              {entityResults.length > 0 && (
                <div className="border-t border-ck-dark-border/50 p-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/20">
                    Records
                  </div>
                  {entityResults.map((er) => {
                    const iconMap = { customer: Users, vehicle: Car, job: Wrench, lead: Inbox, invoice: FileText };
                    const colorMap = { customer: 'text-purple-400', vehicle: 'text-blue-400', job: 'text-cyan-400', lead: 'text-amber-400', invoice: 'text-emerald-400' };
                    const Icon = iconMap[er.type];
                    return (
                      <Link
                        key={`${er.type}-${er.id}`}
                        href={er.href}
                        onClick={() => {
                          setCmdkOpen(false);
                          addRecentItem({ href: er.href, label: er.title, type: er.type });
                        }}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <Icon size={14} className={colorMap[er.type]} />
                        <span>{er.title}</span>
                        <span className="ml-auto text-[11px] text-white/20">{er.subtitle}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* No results */}
              {query.length > 0 && results.length === 0 && entityResults.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-white/30">
                  {tHeader('noScreensFound')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
