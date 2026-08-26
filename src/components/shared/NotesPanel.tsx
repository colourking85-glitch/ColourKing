'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Send, MessageCircle } from 'lucide-react';
import type { NoteEntityType } from '@/types/database';

type Note = {
  id: string;
  entity_type: string;
  entity_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export function NotesPanel({
  entityType,
  entityId,
}: {
  entityType: NoteEntityType;
  entityId: string;
}) {
  const t = useTranslations('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes?entity_type=${entityType}&entity_id=${entityId}`);
      if (res.ok) setNotes(await res.json());
    } catch { /* ignore */ }
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          body: input.trim(),
        }),
      });
      if (res.ok) {
        setInput('');
        load();
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
      <div className="flex items-center gap-2 border-b border-ck-border px-4 py-3">
        <MessageCircle size={14} className="text-ck-text-muted" />
        <h3 className="text-xs font-medium uppercase tracking-wider text-ck-text-muted">
          {t('title')}
        </h3>
        <span className="ml-auto text-[10px] text-ck-text-faint">{notes.length}</span>
      </div>
      <div ref={scrollRef} className="max-h-64 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-ck-text-faint">{t('noNotes')}</div>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              className="border-b border-ck-border/30 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-ck-text-muted">
                  {t('internalNote')}
                </span>
                <span className="text-[10px] text-ck-text-faint">{timeAgo(note.created_at)}</span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-ck-text-3">{note.body}</p>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-ck-border p-3">
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('placeholder')}
            className="flex-1 rounded-md border border-ck-border bg-ck-bg px-3 py-2 text-sm text-ck-text outline-none placeholder:text-ck-text-faint focus:border-ck-red/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-ck-red text-white transition-colors hover:bg-ck-red-hover disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
