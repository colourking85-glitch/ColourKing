'use client';

import { MODULE_COLORS } from '@/lib/codes';

type Props = {
  id?: string;
  code?: string;
  onClick?: () => void;
};

export function ScreenBadge({ id, code, onClick }: Props) {
  const screenId = id ?? code ?? '';
  const mod = screenId.slice(0, 2);
  const color = MODULE_COLORS[mod] ?? 'bg-slate-700/30 text-slate-400';

  const cls = `inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide ${color}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cls} cursor-pointer transition-opacity hover:opacity-80 hover:ring-1 hover:ring-white/20`}
      >
        {screenId}
      </button>
    );
  }

  return <span className={cls}>{screenId}</span>;
}
