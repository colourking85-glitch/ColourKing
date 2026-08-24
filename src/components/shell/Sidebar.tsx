'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Users,
  Car,
  FileText,
  Wrench,
  Package,
  Receipt,
  FolderOpen,
  CalendarDays,
  ClipboardList,
  BarChart3,
  Calculator,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  code: string;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    group: 'Overzicht',
    items: [
      { label: 'Dashboard', href: '/app', icon: LayoutDashboard, code: 'RP01' },
    ],
  },
  {
    group: 'Verkoop',
    items: [
      { label: 'Leads', href: '/app/leads', icon: Inbox, code: 'LD05' },
      { label: 'Klanten', href: '/app/klanten', icon: Users, code: 'KL05' },
      { label: 'Voertuigen', href: '/app/voertuigen', icon: Car, code: 'VH05' },
      { label: 'Offertes', href: '/app/offertes', icon: FileText, code: 'ES05' },
    ],
  },
  {
    group: 'Werkplaats',
    items: [
      { label: 'Opdrachten', href: '/app/jobs', icon: Wrench, code: 'JB05' },
      { label: 'Werkplaatsbord', href: '/app/jobs/board', icon: ClipboardList, code: 'JB15' },
      { label: 'Onderdelen', href: '/app/onderdelen', icon: Package, code: 'PT05' },
      { label: 'Planning', href: '/app/planning', icon: CalendarDays, code: 'TS10' },
    ],
  },
  {
    group: 'Administratie',
    items: [
      { label: 'Facturen', href: '/app/facturen', icon: Receipt, code: 'FA05' },
      { label: 'Documenten', href: '/app/documenten', icon: FolderOpen, code: 'DO05' },
      { label: 'Afspraken', href: '/app/afspraken', icon: CalendarDays, code: 'AP05' },
    ],
  },
  {
    group: 'Financieel',
    items: [
      { label: 'BTW', href: '/app/btw', icon: Calculator, code: 'BW05' },
      { label: 'Inkoop', href: '/app/inkoop', icon: ShoppingCart, code: 'PU05' },
      { label: 'Rapportage', href: '/app/rapportage', icon: BarChart3, code: 'RP10' },
    ],
  },
  {
    group: 'Systeem',
    items: [
      { label: 'Instellingen', href: '/app/instellingen', icon: Settings, code: 'SY01' },
    ],
  },
];

function isActive(href: string, pathname: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
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
        className="mx-auto my-2 flex h-6 w-6 items-center justify-center rounded text-ck-muted hover:bg-ck-dark-border hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {NAV.map((section) => (
          <div key={section.group} className="mb-4">
            {!collapsed && (
              <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ck-muted">
                {section.group}
              </div>
            )}
            {section.items.map((item) => {
              const active = isActive(item.href, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-ck-red/15 text-ck-red'
                      : 'text-ck-muted-light hover:bg-ck-dark-border/50 hover:text-white'
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      <ScreenBadge id={item.code} />
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
