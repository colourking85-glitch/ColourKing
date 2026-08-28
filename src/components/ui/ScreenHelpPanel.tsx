'use client';

import { useEffect, useRef } from 'react';
import { X, Workflow, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Bot } from 'lucide-react';
import { getScreenDoc, type ScreenDoc } from '@/lib/screen-docs';
import { MODULE_COLORS } from '@/lib/codes';

type Props = {
  screenCode: string;
  onClose: () => void;
};

function Section({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) {
  return (
    <div className="border-b border-ck-dark-border/50 px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
        <Icon size={12} />
        {title}
      </div>
      <div className="whitespace-pre-line text-[12px] leading-relaxed text-white/70">{content}</div>
    </div>
  );
}

export function ScreenHelpPanel({ screenCode, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const doc: ScreenDoc | undefined = getScreenDoc(screenCode);
  const mod = screenCode.slice(0, 2);
  const color = MODULE_COLORS[mod] ?? 'bg-slate-700/30 text-slate-400';

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!doc) {
    return (
      <div
        ref={panelRef}
        className="fixed right-0 top-12 z-[90] h-[calc(100vh-3rem)] w-80 border-l border-ck-dark-border bg-ck-dark-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-ck-dark-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide ${color}`}>
              {screenCode}
            </span>
            <span className="text-xs font-medium text-white/60">Screen Help</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-8 text-center text-xs text-white/30">
          No documentation available for {screenCode}.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-12 z-[90] flex h-[calc(100vh-3rem)] w-96 flex-col border-l border-ck-dark-border bg-ck-dark-surface shadow-2xl"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-ck-dark-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide ${color}`}>
            {screenCode}
          </span>
          <span className="text-xs font-medium text-white/60">Screen Help</span>
        </div>
        <button onClick={onClose} className="rounded p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60">
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Section icon={Workflow} title="User Flow" content={doc.userFlow} />
        <Section icon={ArrowDownToLine} title="Inputs" content={doc.inputs} />
        <Section icon={ArrowUpFromLine} title="Outputs" content={doc.outputs} />
        <Section icon={ArrowRightLeft} title="Cross-Screen Effects" content={doc.crossScreen} />
        <Section icon={Bot} title="AI Agent Notes" content={doc.agentNotes} />
      </div>
    </div>
  );
}
