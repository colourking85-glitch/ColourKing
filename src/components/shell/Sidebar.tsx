'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Users, Car, FileText, Wrench,
  Package, Receipt, FolderOpen, CalendarDays, ClipboardList,
  BarChart3, Calculator, ShoppingCart, Settings, Bell,
  ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SCREEN_REGISTRY } from '@/lib/codes';
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
const NAV: NavSection[] = [
  {
    group: 'Overzicht',
    items: [
      { label: 'Dashboard', href: '/app', icon: LayoutDashboard, code: 'RP01' },
    ],
  },
  {
    group: 'Verkoop',
    items: [
      { label: 'Leads', href: '/app/leads', icon: Inbox, code: 'LD05', permission: 'leads.read' },
      { label: 'Klanten', href: '/app/klanten', icon: Users, code: 'KL05', permission: 'customers.read' },
      { label: 'Voertuigen', href: '/app/voertuigen', icon: Car, code: 'VH05', permission: 'vehicles.read' },
      { label: 'Offertes', href: '/app/offertes', icon: FileText, code: 'ES05', permission: 'offers.read', soon: true },
    ],
  },
  {
    group: 'Werkplaats',
    items: [
      { label: 'Opdrachten', href: '/app/jobs', icon: Wrench, code: 'JB05', permission: 'jobs.read' },
      { label: 'Werkplaatsbord', href: '/app/jobs/board', icon: ClipboardList, code: 'JB15', permission: 'jobs.read' },
      { label: 'Onderdelen', href: '/app/onderdelen', icon: Package, code: 'PT05', permission: 'parts.read', soon: true },
      { label: 'Planning', href: '/app/planning', icon: CalendarDays, code: 'TS10', permission: 'tasks.own', soon: true },
    ],
  },
  {
    group: 'Administratie',
    items: [
      { label: 'Facturen', href: '/app/facturen', icon: Receipt, code: 'FA05', permission: 'invoices.read', soon: true },
      { label: 'Documenten', href: '/app/documenten', icon: FolderOpen, code: 'DO05', permission: 'documents.read', soon: true },
      { label: 'Afspraken', href: '/app/afspraken', icon: CalendarDays, code: 'AP05', permission: 'appointments.read', soon: true },
    ],
  },
  {
    group: 'Financieel',
    items: [
      { label: 'BTW', href: '/app/btw', icon: Calculator, code: 'BW05', permission: 'vat.read', soon: true },
      { label: 'Inkoop', href: '/app/inkoop', icon: ShoppingCart, code: 'PU05', permission: 'purchases.read', soon: true },
      { label: 'Rapportage', href: '/app/rapportage', icon: BarChart3, code: 'RP10', soon: true },
    ],
  },
  {
    group: 'Systeem',
    items: [
      {
        label: 'Instellingen',
        icon: Settings,
        subitems: [
          { label: 'Algemeen', href: '/app/instellingen', icon: Settings, code: 'SY01' },
          { label: 'Monitoring', href: '/app/monitoring', icon: Bell, code: 'SY05' },
          { label: 'Gebruikers', href: '/app/instellingen/gebruikers', icon: Users, code: 'SY02', soon: true },
          { label: 'Nummering', href: '/app/instellingen/nummering', icon: Receipt, code: 'SY03', soon: true },
        ],
      },
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
        {section.group}
      </div>
      {allLeaves.map(({ leaf, parent }) => {
        if (!canSeeItem(leaf, role)) return null;
        const showParent = parent && parent !== lastParent;
        if (parent) lastParent = parent;

        return (
          <div key={leaf.href}>
            {showParent && (
              <div className="mt-2 px-3 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-ck-muted/60">
                {parent}
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
  const active = isActive(leaf.href, pathname);
  const reg = SCREEN_REGISTRY[leaf.href];

  if (leaf.soon) {
    return (
      <span className="flex cursor-not-allowed items-center gap-2 px-3 py-1.5 text-[12px] text-ck-muted/40">
        <leaf.icon size={14} strokeWidth={1.6} />
        <span className="flex-1 truncate">{leaf.label}</span>
        <span className="rounded-full bg-ck-dark-border px-1.5 py-0.5 font-mono text-[8px] text-ck-muted/50">SOON</span>
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
      <span className="flex-1 truncate">{leaf.label}</span>
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
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [flyout, setFlyout] = useState<{ section: NavSection; rect: DOMRect } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TODO: get from session context
  const role: Role = 'admin';

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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ck-red">
                <span className="font-display text-sm font-bold text-white">CK</span>
              </div>
              <span className="font-display text-sm font-bold tracking-wide text-white">
                COLOURKING
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/app" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-ck-red">
              <span className="font-display text-sm font-bold text-white">CK</span>
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
              <div key={section.group} className="mb-4">
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.group)}
                    className="mb-1 flex w-full items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ck-muted transition-colors hover:text-white"
                  >
                    <span>{section.group}</span>
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
                          title={isLeaf(item) ? item.label : item.label}
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
                          <span className="flex-1 truncate text-left">{item.label}</span>
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
  const active = isActive(item.href, pathname);
  const Icon = item.icon;

  if (item.soon) {
    return (
      <span
        className={`mb-0.5 flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ck-muted/30 ${nested ? 'py-1.5 text-[12px]' : ''}`}
      >
        <Icon size={nested ? 14 : 16} strokeWidth={1.6} className="flex-shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        <span className="rounded-full bg-ck-dark-border px-1.5 py-0.5 font-mono text-[7px] text-ck-muted/40">SOON</span>
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
      <span className="flex-1 truncate">{item.label}</span>
      <ScreenBadge id={item.code} />
    </Link>
  );
}
