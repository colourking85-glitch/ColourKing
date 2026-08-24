'use client';

import { MODULE_COLORS } from '@/lib/codes';

export function ScreenBadge({ id, code }: { id?: string; code?: string }) {
  const screenId = id ?? code ?? '';
  const mod = screenId.slice(0, 2);
  const color = MODULE_COLORS[mod] ?? 'bg-slate-700/30 text-slate-400';

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide ${color}`}
    >
      {screenId}
    </span>
  );
}
