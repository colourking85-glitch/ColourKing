'use client';

import { useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeLabel: string;
  afterLabel: string;
  beforeSrc?: string;
  afterSrc?: string;
  ariaLabel?: string;
}

export function BeforeAfterSlider({
  beforeLabel,
  afterLabel,
  beforeSrc,
  afterSrc,
  ariaLabel = 'Compare before and after',
}: BeforeAfterSliderProps) {
  const afterRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const sync = useCallback((value: number) => {
    if (afterRef.current) afterRef.current.style.clipPath = `inset(0 0 0 ${value}%)`;
    if (handleRef.current) handleRef.current.style.left = `${value}%`;
  }, []);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-ck-border bg-ck-surface touch-none">
      {/* Before layer */}
      <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(45deg,var(--tw-gradient-from)_0_12px,var(--tw-gradient-to)_12px_24px)] from-ck-surface to-ck-bg">
        {beforeSrc ? (
          <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="rounded-md border border-ck-border bg-ck-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ck-text-muted">
            {beforeLabel}
          </span>
        )}
      </div>

      {/* After layer */}
      <div
        ref={afterRef}
        className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ck-surface to-ck-bg"
        style={{ clipPath: 'inset(0 0 0 50%)' }}
      >
        {afterSrc ? (
          <img src={afterSrc} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="rounded-md border border-ck-border bg-ck-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ck-text-muted">
            {afterLabel}
          </span>
        )}
      </div>

      {/* Range input */}
      <input
        type="range"
        min="0"
        max="100"
        defaultValue={50}
        aria-label={ariaLabel}
        className="absolute inset-0 z-[4] m-0 h-full w-full cursor-ew-resize opacity-0"
        onInput={(e) => sync(Number((e.target as HTMLInputElement).value))}
      />

      {/* Handle line */}
      <div
        ref={handleRef}
        className="pointer-events-none absolute bottom-0 top-0 z-[3] w-0.5 bg-ck-red"
        style={{ left: '50%' }}
      >
        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ck-red text-[15px] text-white shadow-lg">
          ↔
        </span>
      </div>
    </div>
  );
}
