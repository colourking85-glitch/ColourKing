'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Search, User, LogOut } from 'lucide-react';
import { getScreen, searchScreens, type ScreenMeta } from '@/lib/codes';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { signOut } from '@/lib/auth';
import Link from 'next/link';

export function Header() {
  const pathname = usePathname();
  const screen = getScreen(pathname);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScreenMeta[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdkOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setCmdkOpen(false);
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
    if (query.length > 0) {
      setResults(searchScreens(query));
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-ck-dark-border bg-ck-dark-surface px-6">
        {/* Current screen info */}
        <div className="flex items-center gap-3">
          {screen && <ScreenBadge id={screen.id} />}
          <h1 className="text-sm font-semibold text-white">
            {screen?.titleNl ?? 'Colourking'}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Cmd-K trigger */}
          <button
            onClick={() => setCmdkOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-ck-dark-border bg-ck-dark px-3 py-1.5 text-xs text-ck-muted transition-colors hover:border-ck-muted/30 hover:text-white"
          >
            <Search size={14} />
            <span>Zoeken...</span>
            <kbd className="rounded border border-ck-dark-border px-1 py-0.5 font-mono text-[10px] text-ck-muted">
              ⌘K
            </kbd>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ck-dark-border text-ck-muted-light transition-colors hover:bg-ck-red hover:text-white"
            >
              <User size={16} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-ck-dark-border bg-ck-dark-surface shadow-xl">
                <div className="border-b border-ck-dark-border px-4 py-3">
                  <div className="text-xs font-medium text-white">Admin</div>
                  <div className="text-[11px] text-ck-muted">admin@colourking.nl</div>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-ck-muted-light transition-colors hover:bg-ck-dark-border/50 hover:text-white"
                >
                  <LogOut size={14} />
                  Uitloggen
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
                placeholder="Zoek scherm of code (bijv. JB05, Facturen)..."
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
                    onClick={() => {
                      setCmdkOpen(false);
                      setQuery('');
                    }}
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
                Geen schermen gevonden
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
