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
};

function applySettings(settings: AppSettings) {
  const root = document.documentElement;

  root.style.fontSize = TEXT_SIZE_MAP[settings.textSize] ?? '14px';
  root.style.setProperty('--ck-density', DENSITY_MAP[settings.density] ?? '1');

  const styleVars = STYLE_VARS[settings.style] ?? STYLE_VARS.midnight;
  let styleId = document.getElementById('ck-theme-vars') as HTMLStyleElement | null;
  if (!styleId) {
    styleId = document.createElement('style');
    styleId.id = 'ck-theme-vars';
    document.head.appendChild(styleId);
  }
  const cssVars = Object.entries(styleVars).map(([k, v]) => `${k}: ${v};`).join('\n  ');
  styleId.textContent = `.dark {\n  ${cssVars}\n}`;

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
