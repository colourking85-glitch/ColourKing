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
    '--ck-border': '#26272c',
    '--ck-accent': '#e11d48',
    '--ck-accent-hover': '#be123c',
  },
  flat: {
    '--ck-bg': '#111827',
    '--ck-surface': '#1f2937',
    '--ck-surface-2': '#283548',
    '--ck-border': '#374151',
    '--ck-accent': '#3b82f6',
    '--ck-accent-hover': '#2563eb',
  },
  corporate: {
    '--ck-bg': '#0c1222',
    '--ck-surface': '#162032',
    '--ck-surface-2': '#1e2d42',
    '--ck-border': '#1e3a5f',
    '--ck-accent': '#0ea5e9',
    '--ck-accent-hover': '#0284c7',
  },
  soft: {
    '--ck-bg': '#18181b',
    '--ck-surface': '#27272a',
    '--ck-surface-2': '#303035',
    '--ck-border': '#3f3f46',
    '--ck-accent': '#a78bfa',
    '--ck-accent-hover': '#8b5cf6',
  },
  polaris: {
    '--ck-bg': '#1a1f36',
    '--ck-surface': '#2d3250',
    '--ck-surface-2': '#363c5e',
    '--ck-border': '#3d4470',
    '--ck-accent': '#6366f1',
    '--ck-accent-hover': '#4f46e5',
  },
};

function applySettings(settings: AppSettings) {
  const root = document.documentElement;

  root.style.fontSize = TEXT_SIZE_MAP[settings.textSize] ?? '14px';

  root.style.setProperty('--ck-density', DENSITY_MAP[settings.density] ?? '1');

  const styleVars = STYLE_VARS[settings.style] ?? STYLE_VARS.midnight;
  for (const [key, val] of Object.entries(styleVars)) {
    root.style.setProperty(key, val);
  }

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
