'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface AppSettings {
  style: string;
  textSize: string;
  density: string;
  highContrast: boolean;
  navIcons: boolean;
  compact: boolean;
  sidebarCollapsed: boolean;
  navGroupsExpanded: boolean;
  companyName: string;
  dateFormat: string;
  timezone: string;
  currency: string;
  notifLead: boolean;
  notifStage: boolean;
  notifEmail: boolean;
  notifAppointment: boolean;
}

const DEFAULTS: AppSettings = {
  style: 'midnight',
  textSize: 'medium',
  density: 'comfortable',
  highContrast: false,
  navIcons: true,
  compact: false,
  sidebarCollapsed: false,
  navGroupsExpanded: true,
  companyName: 'Colourking',
  dateFormat: 'dd-MM-yyyy',
  timezone: 'Europe/Amsterdam',
  currency: 'EUR',
  notifLead: true,
  notifStage: true,
  notifEmail: true,
  notifAppointment: false,
};

const STORAGE_KEY = 'ck-settings';

const TEXT_SIZE_MAP: Record<string, string> = {
  small: '13px',
  medium: '14px',
  large: '16px',
};

const DENSITY_MAP: Record<string, string> = {
  compact: '0.75',
  comfortable: '1',
  spacious: '1.25',
};

const STYLE_VARS: Record<string, Record<string, string>> = {
  midnight: {
    '--ck-bg': '#101114',
    '--ck-surface': '#16171b',
    '--ck-surface-2': '#1c1e23',
    '--ck-surface-3': '#232830',
    '--ck-border': '#26272c',
    '--ck-border-2': '#2b2d33',
    '--ck-accent': '#e11d48',
    '--ck-accent-hover': '#be123c',
    '--ck-text': '#f4f4f5',
    '--ck-text-2': '#e4e4e7',
    '--ck-text-3': '#a1a1aa',
    '--ck-text-muted': '#71717a',
    '--ck-text-faint': '#52525b',
    '--ck-icon-bg': '#ffffff',
    '--ck-icon-fg': '#101114',
  },
  flat: {
    '--ck-bg': '#111827',
    '--ck-surface': '#1f2937',
    '--ck-surface-2': '#283548',
    '--ck-surface-3': '#334155',
    '--ck-border': '#374151',
    '--ck-border-2': '#4b5563',
    '--ck-accent': '#3b82f6',
    '--ck-accent-hover': '#2563eb',
    '--ck-text': '#f9fafb',
    '--ck-text-2': '#e5e7eb',
    '--ck-text-3': '#9ca3af',
    '--ck-text-muted': '#6b7280',
    '--ck-text-faint': '#4b5563',
    '--ck-icon-bg': '#ffffff',
    '--ck-icon-fg': '#111827',
  },
  corporate: {
    '--ck-bg': '#0c1222',
    '--ck-surface': '#162032',
    '--ck-surface-2': '#1e2d42',
    '--ck-surface-3': '#263a52',
    '--ck-border': '#1e3a5f',
    '--ck-border-2': '#2a4a72',
    '--ck-accent': '#0ea5e9',
    '--ck-accent-hover': '#0284c7',
    '--ck-text': '#f0f9ff',
    '--ck-text-2': '#e0f2fe',
    '--ck-text-3': '#94a3b8',
    '--ck-text-muted': '#64748b',
    '--ck-text-faint': '#334155',
    '--ck-icon-bg': '#ffffff',
    '--ck-icon-fg': '#0c1222',
  },
  soft: {
    '--ck-bg': '#18181b',
    '--ck-surface': '#27272a',
    '--ck-surface-2': '#303035',
    '--ck-surface-3': '#3a3a40',
    '--ck-border': '#3f3f46',
    '--ck-border-2': '#52525b',
    '--ck-accent': '#a78bfa',
    '--ck-accent-hover': '#8b5cf6',
    '--ck-text': '#fafafa',
    '--ck-text-2': '#e4e4e7',
    '--ck-text-3': '#a1a1aa',
    '--ck-text-muted': '#71717a',
    '--ck-text-faint': '#52525b',
    '--ck-icon-bg': '#ffffff',
    '--ck-icon-fg': '#18181b',
  },
  polaris: {
    '--ck-bg': '#1a1f36',
    '--ck-surface': '#2d3250',
    '--ck-surface-2': '#363c5e',
    '--ck-surface-3': '#414770',
    '--ck-border': '#3d4470',
    '--ck-border-2': '#4e5580',
    '--ck-accent': '#6366f1',
    '--ck-accent-hover': '#4f46e5',
    '--ck-text': '#eef2ff',
    '--ck-text-2': '#c7d2fe',
    '--ck-text-3': '#a5b4fc',
    '--ck-text-muted': '#7c7fa0',
    '--ck-text-faint': '#4e5580',
    '--ck-icon-bg': '#ffffff',
    '--ck-icon-fg': '#1a1f36',
  },
  glossy: {
    '--ck-bg': '#0a0a0f',
    '--ck-surface': '#15151e',
    '--ck-surface-2': '#1c1c28',
    '--ck-surface-3': '#252535',
    '--ck-border': '#2a2a3a',
    '--ck-border-2': '#35354a',
    '--ck-accent': '#f43f5e',
    '--ck-accent-hover': '#e11d48',
    '--ck-text': '#fafafa',
    '--ck-text-2': '#e4e4e7',
    '--ck-text-3': '#a1a1aa',
    '--ck-text-muted': '#71717a',
    '--ck-text-faint': '#3a3a4a',
    '--ck-icon-bg': '#ffffff',
    '--ck-icon-fg': '#0a0a0f',
  },
  // Light themes
  clean: {
    '--ck-bg': '#f8f9fa',
    '--ck-surface': '#ffffff',
    '--ck-surface-2': '#f1f3f5',
    '--ck-surface-3': '#e9ecef',
    '--ck-border': '#dee2e6',
    '--ck-border-2': '#ced4da',
    '--ck-accent': '#e11d48',
    '--ck-accent-hover': '#be123c',
    '--ck-text': '#212529',
    '--ck-text-2': '#343a40',
    '--ck-text-3': '#495057',
    '--ck-text-muted': '#6c757d',
    '--ck-text-faint': '#adb5bd',
    '--ck-icon-bg': '#212529',
    '--ck-icon-fg': '#ffffff',
  },
  daylight: {
    '--ck-bg': '#faf8f5',
    '--ck-surface': '#ffffff',
    '--ck-surface-2': '#f5f0ea',
    '--ck-surface-3': '#ede5da',
    '--ck-border': '#e0d5c7',
    '--ck-border-2': '#cfc0ad',
    '--ck-accent': '#b45309',
    '--ck-accent-hover': '#92400e',
    '--ck-text': '#1c1917',
    '--ck-text-2': '#292524',
    '--ck-text-3': '#44403c',
    '--ck-text-muted': '#78716c',
    '--ck-text-faint': '#a8a29e',
    '--ck-icon-bg': '#292524',
    '--ck-icon-fg': '#ffffff',
  },
  arctic: {
    '--ck-bg': '#f0f4f8',
    '--ck-surface': '#ffffff',
    '--ck-surface-2': '#e8eef4',
    '--ck-surface-3': '#dce4ed',
    '--ck-border': '#c8d5e2',
    '--ck-border-2': '#b0c2d4',
    '--ck-accent': '#1d4ed8',
    '--ck-accent-hover': '#1e40af',
    '--ck-text': '#0f172a',
    '--ck-text-2': '#1e293b',
    '--ck-text-3': '#334155',
    '--ck-text-muted': '#64748b',
    '--ck-text-faint': '#94a3b8',
    '--ck-icon-bg': '#1e293b',
    '--ck-icon-fg': '#ffffff',
  },
};

const LIGHT_THEMES = new Set(['clean', 'daylight', 'arctic']);

/** Tailwind palette: [700 shade for text, 500 shade for tinted badge backgrounds]. */
const PALETTE: Record<string, [string, string]> = {
  red: ['#b91c1c', '#ef4444'], amber: ['#b45309', '#f59e0b'], yellow: ['#a16207', '#eab308'],
  green: ['#15803d', '#22c55e'], emerald: ['#047857', '#10b981'], teal: ['#0f766e', '#14b8a6'],
  cyan: ['#0e7490', '#06b6d4'], sky: ['#0369a1', '#0ea5e9'], blue: ['#1d4ed8', '#3b82f6'],
  indigo: ['#4338ca', '#6366f1'], violet: ['#6d28d9', '#8b5cf6'], purple: ['#7e22ce', '#a855f7'],
  fuchsia: ['#a21caf', '#d946ef'], pink: ['#be185d', '#ec4899'], rose: ['#be123c', '#f43f5e'],
  orange: ['#c2410c', '#f97316'], lime: ['#4d7c0f', '#84cc16'],
  slate: ['#334155', '#64748b'], gray: ['#374151', '#6b7280'], zinc: ['#3f3f46', '#71717a'],
};

const esc = (cls: string) => cls.replace(/[/:.[\]#]/g, (c) => `\\${c}`);
const rule = (classes: string[], decl: string, pseudo = '') =>
  `${classes.map((c) => `.dark .${esc(c)}${pseudo}`).join(', ')} { ${decl} }`;
const tint = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/**
 * The admin UI was written dark-first with many literal Tailwind colours
 * (text-white/60, text-red-400, bg-[#12121a] …). Light themes remap every
 * such class to the theme tokens / darker palette shades in one place.
 */
function lightOverrides(v: Record<string, string>): string {
  const text = v['--ck-text'], text2 = v['--ck-text-2'], text3 = v['--ck-text-3'];
  const muted = v['--ck-text-muted'], faint = v['--ck-text-faint'];
  const bg = v['--ck-bg'], surface = v['--ck-surface'], surface2 = v['--ck-surface-2'], surface3 = v['--ck-surface-3'];
  const border = v['--ck-border'], border2 = v['--ck-border-2'];
  const imp = (d: string) => `${d} !important`;

  const out: string[] = [
    // white text at various opacities → grey ramp
    rule(['text-white'], imp(`color: ${text}`)),
    rule(['text-white/90', 'text-white/80', 'text-white/70'], imp(`color: ${text2}`)),
    rule(['text-white/60', 'text-white/50'], imp(`color: ${text3}`)),
    rule(['text-white/40', 'text-white/30'], imp(`color: ${muted}`)),
    rule(['text-white/25', 'text-white/20'], imp(`color: ${faint}`)),
    rule(['hover:text-white', 'hover:text-white/80', 'hover:text-white/60'], imp(`color: ${text}`), ':hover'),
    rule(['placeholder:text-white/30', 'placeholder:text-white/25'], imp(`color: ${muted}`), '::placeholder'),
    // white/black surfaces
    rule(['bg-white'], imp(`background-color: ${surface}`)),
    rule(['bg-white/5', 'bg-white/10', 'bg-white/20', 'bg-white/[0.03]', 'bg-white/[0.06]'], imp(`background-color: ${surface2}`)),
    rule(['hover:bg-white/5', 'hover:bg-white/10', 'hover:bg-white/20', 'hover:bg-white/[0.02]', 'hover:bg-white/[0.03]', 'hover:bg-white/[0.06]'], imp(`background-color: ${surface3}`), ':hover'),
    rule(['bg-black', 'bg-black/50', 'bg-black/40'], imp(`background-color: ${bg}`)),
    rule(['border-white/10', 'border-white/20', 'border-white/30', 'border-white/40'], imp(`border-color: ${border}`)),
    rule(['hover:border-white/10', 'hover:border-white/50', 'hover:border-white/70'], imp(`border-color: ${border2}`), ':hover'),
    rule(['ring-white/10', 'ring-white/[0.06]'], imp(`--tw-ring-color: ${border}`)),
    rule(['hover:ring-white/20'], imp(`--tw-ring-color: ${border2}`), ':hover'),
    `.dark .divide-white\\/10 > :not([hidden]) ~ :not([hidden]) { border-color: ${border} !important; }`,
    // literal dark hex colours (manual, cron, AI screens)
    rule(['text-[#6b6b80]'], imp(`color: ${text3}`)),
    rule(['text-[#c0c0cc]'], imp(`color: ${text2}`)),
    rule(['text-[#8b8ba0]', 'text-[#4a4a5a]', 'text-[#3a3a50]'], imp(`color: ${muted}`)),
    rule(['bg-[#12121a]'], imp(`background-color: ${surface}`)),
    rule(['bg-[#0a0a0f]', 'bg-[#1e1e2a]', 'bg-[#2e2e3a]'], imp(`background-color: ${surface2}`)),
    rule(['hover:bg-[#1e1e2a]/30'], imp(`background-color: ${surface3}`), ':hover'),
    rule(['border-[#1e1e2a]', 'border-[#1e1e2a]/50'], imp(`border-color: ${border}`)),
    `.dark select option { background-color: ${surface}; color: ${text}; }`,
  ];

  // pastel -300/-400 text is unreadable on light surfaces → 700 shade; dark -900/x badge tints → light 500/12%
  for (const [name, [dark, mid]] of Object.entries(PALETTE)) {
    out.push(rule([`text-${name}-300`, `text-${name}-400`, `text-${name}-400/60`], imp(`color: ${dark}`)));
    out.push(rule([`hover:text-${name}-400`, `hover:text-${name}-300`], imp(`color: ${dark}`), ':hover'));
    out.push(rule(
      [`bg-${name}-900/20`, `bg-${name}-900/30`, `bg-${name}-900/40`, `bg-${name}-900/50`, `bg-${name}-950/20`, `bg-${name}-950/10`, `bg-${name}-700/30`, `bg-${name}-700/50`],
      imp(`background-color: ${tint(mid, 0.14)}`),
    ));
    out.push(rule([`border-${name}-900/30`, `border-${name}-700/40`], imp(`border-color: ${tint(mid, 0.35)}`)));
  }

  return '\n' + out.join('\n') + '\n';
}

function applySettings(settings: AppSettings) {
  const root = document.documentElement;

  root.style.fontSize = TEXT_SIZE_MAP[settings.textSize] ?? '14px';
  root.style.setProperty('--ck-density', DENSITY_MAP[settings.density] ?? '1');

  const styleVars = STYLE_VARS[settings.style] ?? STYLE_VARS.midnight;
  const isLight = LIGHT_THEMES.has(settings.style);

  let styleEl = document.getElementById('ck-theme-vars') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ck-theme-vars';
    document.head.appendChild(styleEl);
  }

  const cssVars = Object.entries(styleVars).map(([k, v]) => `${k}: ${v};`).join('\n  ');
  let css = `.dark {\n  ${cssVars}\n}`;

  if (isLight) css += lightOverrides(styleVars);

  styleEl.textContent = css;

  if (settings.highContrast) {
    root.classList.add('ck-high-contrast');
  } else {
    root.classList.remove('ck-high-contrast');
  }

  if (settings.compact) {
    root.classList.add('ck-compact');
  } else {
    root.classList.remove('ck-compact');
  }
}

const SettingsContext = createContext<{
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}>({
  settings: DEFAULTS,
  updateSettings: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULTS, ...parsed };
        setSettings(merged);
        applySettings(merged);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      applySettings(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
