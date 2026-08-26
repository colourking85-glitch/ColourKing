'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    groupKey: 'navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], actionKey: 'searchScreens' },
      { keys: ['⌘', 'N'], actionKey: 'quickCreate' },
      { keys: ['⌘', 'B'], actionKey: 'toggleSidebar' },
      { keys: ['⌘', '/'], actionKey: 'toggleShortcuts' },
    ],
  },
  {
    groupKey: 'lists',
    shortcuts: [
      { keys: ['↑', '↓'], actionKey: 'navigateList' },
      { keys: ['Enter'], actionKey: 'openRecord' },
      { keys: ['Esc'], actionKey: 'closePanel' },
    ],
  },
  {
    groupKey: 'actions',
    shortcuts: [
      { keys: ['⌘', 'S'], actionKey: 'save' },
      { keys: ['⌘', 'E'], actionKey: 'edit' },
      { keys: ['⌘', '.'], actionKey: 'aiAssistant' },
    ],
  },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('shortcuts');

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-ck-dark-border bg-ck-dark-surface shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ck-dark-border px-5 py-3">
          <h2 className="text-sm font-semibold text-white">{t('title')}</h2>
          <button
            onClick={() => setOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.groupKey} className="mb-5 last:mb-0">
              <h3 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                {t(`groups.${group.groupKey}`)}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map(sc => (
                  <div
                    key={sc.actionKey}
                    className="flex items-center justify-between rounded-md px-2 py-1.5"
                  >
                    <span className="text-[13px] text-white/60">{t(`actions.${sc.actionKey}`)}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="flex h-6 min-w-[24px] items-center justify-center rounded border border-ck-dark-border bg-ck-dark px-1.5 font-mono text-[10px] text-white/50"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-ck-dark-border px-5 py-2.5">
          <p className="text-center text-[11px] text-white/20">{t('hint')}</p>
        </div>
      </div>
    </div>
  );
}
