'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

type Option = { value: string; label: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customLabel?: string;
  className?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  allowCustom = false,
  customLabel = 'Other...',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? '';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  function select(opt: Option) {
    onChange(opt.value, opt.label);
    setOpen(false);
    setQuery('');
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('', '');
    setQuery('');
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-left text-sm text-white focus:border-ck-red focus:outline-none"
      >
        <span className={selectedLabel ? 'text-white' : 'text-ck-muted'}>
          {selectedLabel || placeholder}
        </span>
        <span className="flex items-center gap-1">
          {value && (
            <X
              size={14}
              className="text-ck-muted hover:text-white"
              onClick={clear}
            />
          )}
          <ChevronDown size={14} className={`text-ck-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-ck-dark-border bg-ck-dark-card shadow-xl">
          <div className="flex items-center gap-2 border-b border-ck-dark-border px-3 py-2">
            <Search size={14} className="text-ck-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-white placeholder:text-ck-muted focus:outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 && !allowCustom && (
              <div className="px-3 py-2 text-xs text-ck-muted">No results</div>
            )}
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => select(opt)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-ck-dark-surface ${
                  opt.value === value ? 'text-ck-red font-medium' : 'text-ck-muted-light'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {allowCustom && query.trim() && !filtered.some(o => o.label.toLowerCase() === query.toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  onChange('__custom', query.trim());
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ck-muted-light hover:bg-ck-dark-surface"
              >
                <span className="text-ck-muted">{customLabel}</span> {query.trim()}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
