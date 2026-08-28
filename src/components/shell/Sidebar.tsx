'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, Inbox, Users, Car, FileText, Wrench,
  Package, Receipt, FolderOpen, CalendarDays, ClipboardList,
  BarChart3, Calculator, ShoppingCart, BookOpen, Settings, Bell,
  ChevronLeft, ChevronRight, ChevronDown, BookOpenCheck, Clock, Bot, Mail, HardDrive, Server,
  Plug, Zap, CarFront, Coins, Shield,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SCREEN_REGISTRY } from '@/lib/codes';
import { useSettings } from '@/components/SettingsProvider';
import { can, type Role } from '@/lib/auth';

// ── Nav types ────────────────────────────────────────────────────────────────
type NavLeaf = {
  label: string;
  href: string;
  icon: React.ElementType;
  code: string;
  permission?: string;
  soon?: boolean;
};

type NavItem = NavLeaf | {
  label: string;
  icon: React.ElementType;
  subitems: NavLeaf[];
};

type NavSection = {
  group: string;
  items: NavItem[];
};

function isLeaf(item: NavItem): item is NavLeaf {
  return 'href' in item && !('subitems' in item);
}

function getLeaves(item: NavItem): NavLeaf[] {
  if (isLeaf(item)) return [item];
  return item.subitems;
}

// ── Nav data ─────────────────────────────────────────────────────────────────
// Labels are translation keys resolved via useTranslations('nav')
const NAV: NavSection[] = [
  {
    group: 'groupOverview',
    items: [
      { label: 'dashboard', href: '/app', icon: LayoutDashboard, code: 'RP01' },
      { label: 'tasks', href: '/app/taken', icon: ClipboardList, code: 'TS05' },
    ],
  },
  {
    group: 'groupSales',
    items: [
      { label: 'leads', href: '/app/leads', icon: Inbox, code: 'LD05', permission: 'leads.read' },
      { label: 'customers', href: '/app/klanten', icon: Users, code: 'KL05', permission: 'customers.read' },
      { label: 'vehicles', href: '/app/voertuigen', icon: Car, code: 'VH05', permission: 'vehicles.read' },
      { label: 'offers', href: '/app/offertes', icon: FileText, code: 'ES05', permission: 'offers.read' },
    ],
  },
  {
    group: 'groupWorkshop',
    items: [
      { label: 'jobs', href: '/app/jobs', icon: Wrench, code: 'JB05', permission: 'jobs.read' },
      { label: 'workshopBoard', href: '/app/jobs/board', icon: ClipboardList, code: 'JB15', permission: 'jobs.read' },
      { label: 'parts', href: '/app/onderdelen', icon: Package, code: 'PT05', permission: 'parts.read' },
      { label: 'planning', href: '/app/planning', icon: CalendarDays, code: 'TS10', permission: 'tasks.own' },
    ],
  },
  {
    group: 'groupAdmin',
    items: [
      { label: 'invoices', href: '/app/facturen', icon: Receipt, code: 'FA05', permission: 'invoices.read' },
      { label: 'documents', href: '/app/documenten', icon: FolderOpen, code: 'DO05', permission: 'documents.read' },
      { label: 'handovers', href: '/app/afleverbon', icon: ClipboardList, code: 'DO21', permission: 'documents.read' },
      { label: 'appointments', href: '/app/afspraken', icon: CalendarDays, code: 'AP05', permission: 'appointments.read' },
    ],
  },
  {
    group: 'groupFinancial',
    items: [
      { label: 'vat', href: '/app/btw', icon: Calculator, code: 'BW05', permission: 'vat.read' },
      { label: 'purchases', href: '/app/inkoop', icon: ShoppingCart, code: 'PU05', permission: 'purchases.read' },
      { label: 'reports', href: '/app/rapportage', icon: BarChart3, code: 'RP10' },
      { label: 'bookkeeping', href: '/app/boekhouding', icon: BookOpen, code: 'BK10', permission: 'bookkeeping.read' },
      { label: 'btwCalculator', href: '/app/btw-calculator', icon: Calculator, code: 'BW40' },
    ],
  },
  {
    group: 'groupSystem',
    items: [
      {
        label: 'settings',
        icon: Settings,
        subitems: [
          { label: 'general', href: '/app/instellingen', icon: Settings, code: 'SY01' },
          { label: 'users', href: '/app/instellingen/gebruikers', icon: Users, code: 'SY02' },
          { label: 'numbering', href: '/app/instellingen/nummering', icon: Receipt, code: 'SY03' },
          { label: 'brandModels', href: '/app/instellingen/merken', icon: CarFront, code: 'SY40' },
          { label: 'labourRates', href: '/app/instellingen/tarieven', icon: Coins, code: 'SY45' },
        ],
      },
      {
        label: 'integrations',
        icon: Plug,
        subitems: [
          { label: 'emailMonitor', href: '/app/instellingen/email-monitor', icon: Mail, code: 'SY25' },
          { label: 'googleDrive', href: '/app/drive', icon: HardDrive, code: 'SY30' },
          { label: 'infrastructure', href: '/app/instellingen/infrastructuur', icon: Server, code: 'SY35' },
          { label: 'envSecrets', href: '/app/instellingen/integraties', icon: Shield, code: 'SY50' },
        ],
      },
      {
        label: 'automation',
        icon: Zap,
        subitems: [
          { label: 'monitoring', href: '/app/monitoring', icon: Bell, code: 'SY05' },
          { label: 'cronJobs', href: '/app/cron-jobs', icon: Clock, code: 'SY15' },
          { label: 'aiAgents', href: '/app/ai-agents', icon: Bot, code: 'SY20' },
        ],
      },
      { label: 'manual', href: '/app/handleiding', icon: BookOpenCheck, code: 'SY10' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isActive(href: string, pathname: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(href + '/');
}

function sectionActive(section: NavSection, pathname: string) {
  return section.items.some(item =>
    getLeaves(item).some(l => isActive(l.href, pathname))
  );
}

// ── Flyout submenu (appears when sidebar is collapsed) ───────────────────────
function FlyoutPanel({
  section,
  pathname,
  role,
  triggerRect,
  onClose,
  onKeepOpen,
}: {
  section: NavSection;
  pathname: string;
  role: Role;
  triggerRect: DOMRect;
  onClose: () => void;
  onKeepOpen: () => void;
}) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const MARGIN = 8;
  const spaceBelow = vh - triggerRect.top - MARGIN;
  const flipUp = spaceBelow < 160 && triggerRect.bottom > spaceBelow;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: triggerRect.right + 4,
    zIndex: 200,
    maxHeight: flipUp ? triggerRect.bottom - MARGIN : spaceBelow,
  };
  if (flipUp) {
    style.bottom = vh - triggerRect.bottom;
  } else {
    style.top = Math.max(MARGIN, triggerRect.top);
  }

  const allLeaves: { leaf: NavLeaf; parent: string | null }[] = section.items.flatMap(item => {
    if (isLeaf(item)) return [{ leaf: item, parent: null as string | null }];
    return item.subitems.map(l => ({ leaf: l, parent: item.label as string | null }));
  });

  let lastParent: string | null = null;

  return (
    <div
      className="w-56 overflow-y-auto rounded-lg border border-ck-dark-border bg-ck-dark-surface py-1.5 shadow-2xl"
      style={style}
      onMouseEnter={onKeepOpen}
      onMouseLeave={onClose}
    >
      <div className="mb-1 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ck-muted">
        {tNav(section.group)}
      </div>
      {allLeaves.map(({ leaf, parent }) => {
        if (!canSeeItem(leaf, role)) return null;
        const showParent = parent && parent !== lastParent;
        if (parent) lastParent = parent;

        return (
          <div key={leaf.href}>
            {showParent && (
              <div className="mt-2 px-3 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ck-muted/60">
                {tNav(parent)}
              </div>
            )}
            <FlyoutLeaf leaf={leaf} pathname={pathname} onClick={onClose} />
          </div>
        );
      })}
    </div>
  );
}

function FlyoutLeaf({ leaf, pathname, onClick }: { leaf: NavLeaf; pathname: string; onClick: () => void }) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const active = isActive(leaf.href, pathname);
  const reg = SCREEN_REGISTRY[leaf.href];

  if (leaf.soon) {
    return (
      <span className="flex cursor-not-allowed items-center gap-2 px-3 py-1.5 text-[12px] text-ck-muted/40">
        <leaf.icon size={14} strokeWidth={1.6} />
        <span className="flex-1 truncate">{tNav(leaf.label)}</span>
        <span className="rounded-full bg-ck-dark-border px-1.5 py-0.5 font-mono text-[8px] text-ck-muted/50">{tCommon('soon').toUpperCase()}</span>
      </span>
    );
  }

  return (
    <Link
      href={leaf.href}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? 'bg-ck-red/15 text-ck-red'
          : 'text-ck-muted-light hover:bg-ck-dark-border/50 hover:text-white'
      }`}
    >
      <leaf.icon size={14} strokeWidth={active ? 2.2 : 1.6} />
      <span className="flex-1 truncate">{tNav(leaf.label)}</span>
      {reg && (
        <span className={`font-mono text-[9px] ${active ? 'text-ck-red/60' : 'text-ck-muted/40'}`}>
          {reg.id}
        </span>
      )}
    </Link>
  );
}

// ── Role filtering ───────────────────────────────────────────────────────────
function canSeeItem(leaf: NavLeaf, role: Role): boolean {
  if (!leaf.permission) return true;
  return can(role, leaf.permission);
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { settings } = useSettings();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [flyout, setFlyout] = useState<{ section: NavSection; rect: DOMRect } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedSections = useRef(false);

  // TODO: get from session context
  const role: Role = 'admin';

  useEffect(() => {
    setCollapsed(settings.sidebarCollapsed);
  }, [settings.sidebarCollapsed]);

  useEffect(() => {
    if (initializedSections.current) return;
    initializedSections.current = true;
    if (!settings.navGroupsExpanded) {
      const allCollapsed: Record<string, boolean> = {};
      NAV.forEach(s => { allCollapsed[s.group] = true; });
      setCollapsedSections(allCollapsed);
    }
  }, [settings.navGroupsExpanded]);

  const scheduleFlyoutClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setFlyout(null), 120);
  }, []);

  const cancelFlyoutClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    return () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, []);

  function toggleGroup(label: string) {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  }

  function toggleSection(group: string) {
    setCollapsedSections(prev => ({ ...prev, [group]: !prev[group] }));
  }

  return (
    <>
      <aside
        className={`flex h-screen flex-col border-r border-ck-dark-border bg-ck-dark-surface transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-ck-dark-border px-4">
          {!collapsed && (
            <Link href="/app" className="flex items-center gap-2">
              <img
                src="/images/logo-colourking.svg"
                alt="Colourking"
                className="h-9 w-auto"
              />
            </Link>
          )}
          {collapsed && (
            <Link href="/app" className="mx-auto">
              <img
                src="/images/logo-colourking.svg"
                alt="CK"
                className="h-8 w-auto"
              />
            </Link>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto my-2 flex h-6 w-6 items-center justify-center rounded text-ck-muted transition-colors hover:bg-ck-dark-border hover:text-white"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((section) => {
            const visibleItems = section.items.filter(item => {
              const leaves = getLeaves(item);
              return leaves.some(l => canSeeItem(l, role));
            });
            if (visibleItems.length === 0) return null;

            return (
              <div
                key={section.group}
                className={`mb-2 rounded-lg transition-colors ${
                  !collapsed && !collapsedSections[section.group] && sectionActive(section, pathname)
                    ? 'bg-ck-red/10 ring-1 ring-ck-red/20'
                    : !collapsed && !collapsedSections[section.group]
                      ? 'bg-white/[0.06] ring-1 ring-white/[0.06]'
                      : ''
                }`}
              >
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.group)}
                    className={`mb-1 flex w-full items-center justify-between rounded-t-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                      !collapsedSections[section.group] && sectionActive(section, pathname)
                        ? 'text-ck-red hover:text-ck-red'
                        : !collapsedSections[section.group]
                          ? 'text-white/70 hover:text-white'
                          : 'text-ck-muted hover:text-white'
                    }`}
                  >
                    <span>{tNav(section.group)}</span>
                    <ChevronDown
                      size={10}
                      className={`transition-transform ${collapsedSections[section.group] ? '-rotate-90' : ''}`}
                    />
                  </button>
                )}

                {/* Collapsed: group icon row with flyout on hover */}
                {collapsed ? (
                  <div
                    className="mb-1"
                    onMouseEnter={(e) => {
                      cancelFlyoutClose();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setFlyout({ section: { ...section, items: visibleItems }, rect });
                    }}
                    onMouseLeave={scheduleFlyoutClose}
                  >
                    {visibleItems.map(item => {
                      const firstLeaf = getLeaves(item)[0];
                      if (!firstLeaf) return null;
                      const active = isLeaf(item) ? isActive(item.href, pathname) : getLeaves(item).some(l => isActive(l.href, pathname));
                      const Icon = isLeaf(item) ? item.icon : item.icon;
                      return (
                        <div
                          key={isLeaf(item) ? item.href : item.label}
                          title={tNav(item.label)}
                          className={`mb-0.5 flex items-center justify-center rounded-lg p-2 transition-colors ${
                            active ? 'bg-ck-red/15 text-ck-red' : 'text-ck-muted-light hover:bg-ck-dark-border/50 hover:text-white'
                          } ${firstLeaf.soon ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                        </div>
                      );
                    })}
                  </div>
                ) : collapsedSections[section.group] ? null : (
                  /* Expanded: full nav items */
                  visibleItems.map((item) => {
                    if (isLeaf(item)) {
                      return <SidebarLeaf key={item.href} item={item} pathname={pathname} />;
                    }

                    // Nested group with subitems
                    const isExpanded = expandedGroups[item.label] ?? sectionActive(section, pathname);
                    const active = item.subitems.some(l => isActive(l.href, pathname));
                    const Icon = item.icon;

                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => toggleGroup(item.label)}
                          className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                            active
                              ? 'bg-ck-red/15 text-ck-red'
                              : 'text-ck-muted-light hover:bg-ck-dark-border/50 hover:text-white'
                          }`}
                        >
                          <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
                          <span className="flex-1 truncate text-left">{tNav(item.label)}</span>
                          <ChevronDown
                            size={12}
                            className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="ml-4 border-l border-ck-dark-border/50 pl-2">
                            {item.subitems
                              .filter(l => canSeeItem(l, role))
                              .map(leaf => (
                                <SidebarLeaf key={leaf.href} item={leaf} pathname={pathname} nested />
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Flyout panel (collapsed hover) */}
      {flyout && collapsed && (
        <FlyoutPanel
          section={flyout.section}
          pathname={pathname}
          role={role}
          triggerRect={flyout.rect}
          onClose={scheduleFlyoutClose}
          onKeepOpen={cancelFlyoutClose}
        />
      )}
    </>
  );
}

// ── Single leaf link ─────────────────────────────────────────────────────────
function SidebarLeaf({ item, pathname, nested }: { item: NavLeaf; pathname: string; nested?: boolean }) {
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const active = isActive(item.href, pathname);
  const Icon = item.icon;

  if (item.soon) {
    return (
      <span
        className={`mb-0.5 flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ck-muted/30 ${nested ? 'py-1.5 text-[12px]' : ''}`}
      >
        <Icon size={nested ? 14 : 16} strokeWidth={1.6} className="flex-shrink-0" />
        <span className="flex-1 truncate">{tNav(item.label)}</span>
        <span className="rounded-full bg-ck-dark-border px-1.5 py-0.5 font-mono text-[7px] text-ck-muted/40">{tCommon('soon').toUpperCase()}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 ${nested ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]'} font-medium transition-colors ${
        active
          ? 'bg-ck-red/15 text-ck-red'
          : 'text-ck-muted-light hover:bg-ck-dark-border/50 hover:text-white'
      }`}
    >
      <Icon size={nested ? 14 : 16} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
      <span className="flex-1 truncate">{tNav(item.label)}</span>
      <ScreenBadge id={item.code} />
    </Link>
  );
}
