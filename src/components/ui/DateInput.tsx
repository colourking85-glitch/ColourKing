'use client';

import { useState, useEffect } from 'react';

function isoToDisplay(iso: string, sep: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}${sep}${m}${sep}${y}` : iso;
}

function displayToIso(display: string, sep: string): string {
  if (!display) return '';
  const [d, m, y] = display.split(sep);
  return d && m && y ? `${y}-${m}-${d}` : display;
}

export function DateInput({
  value,
  onChange,
  separator = '-',
  className,
}: {
  value: string;
  onChange: (iso: string) => void;
  separator?: '-' | '.';
  className?: string;
}) {
  const [display, setDisplay] = useState(isoToDisplay(value, separator));

  useEffect(() => { setDisplay(isoToDisplay(value, separator)); }, [value, separator]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const allowed = separator === '.' ? /[^\d.]/g : /[^\d-]/g;
    let v = e.target.value.replace(allowed, '');
    if (v.length === 2 && !v.includes(separator)) v += separator;
    else if (v.length === 5 && v.split(separator).length === 2) v += separator;
    if (v.length > 10) v = v.slice(0, 10);
    setDisplay(v);
    const pattern = separator === '.'
      ? /^\d{2}\.\d{2}\.\d{4}$/
      : /^\d{2}-\d{2}-\d{4}$/;
    if (pattern.test(v)) {
      onChange(displayToIso(v, separator));
    }
  }

  const placeholder = separator === '.' ? 'dd.mm.yyyy' : 'dd-mm-yyyy';

  return (
    <input
      type="text"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={10}
      className={className ?? 'w-full rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text focus:border-blue-500 focus:outline-none'}
    />
  );
}
