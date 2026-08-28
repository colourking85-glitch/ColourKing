'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Sun, Moon } from 'lucide-react';

const OPTIONS = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-ck-border bg-ck-surface p-1">
      {OPTIONS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={`rounded-md p-1.5 transition-colors ${
            theme === value
              ? 'bg-ck-text text-ck-bg'
              : 'text-ck-text-muted hover:text-ck-text'
          }`}
          aria-label={value}
        >
          <Icon size={14} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
