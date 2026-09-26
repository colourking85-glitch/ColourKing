'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Check } from 'lucide-react';

type Props = {
  label: string;
  endpoint: string;
  body?: Record<string, unknown>;
  recipient: string | null | undefined;
  entityType: string;
  entityId: string;
  /** Filter the "last sent" lookup to one template (subject snippet contains `[template]`). */
  template?: string;
  onSent?: () => void;
  variant?: 'primary' | 'secondary';
};

/** Staff-triggered customer email with a confirm dialog and a "last sent" line read from email_log. */
export function SendEmailButton({ label, endpoint, body, recipient, entityType, entityId, template, onSent, variant = 'secondary' }: Props) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const loadLast = useCallback(() => {
    const q = new URLSearchParams({ entity_type: entityType, entity_id: entityId });
    if (template) q.set('template', template);
    fetch(`/api/email-log?${q}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ received_at: string | null; created_at: string }>) => {
        setLastSent(rows[0] ? rows[0].received_at ?? rows[0].created_at : null);
      })
      .catch(() => {});
  }, [entityType, entityId, template]);

  useEffect(() => { loadLast(); }, [loadLast]);

  async function send() {
    setBusy(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    if (res.ok) {
      setOpen(false);
      loadLast();
      onSent?.();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error === 'no_email' ? t('emailNoAddress') : `${t('emailFailed')}${data.error ? `: ${data.error}` : ''}`);
    }
    setBusy(false);
  }

  const cls = variant === 'primary'
    ? 'bg-ck-red text-white hover:bg-ck-red-hover'
    : 'border-[0.5px] border-ck-border bg-ck-surface text-ck-text-3 hover:border-blue-500/50 hover:text-blue-400';

  return (
    <>
      <div className="flex flex-col items-end gap-0.5">
        <button
          type="button"
          onClick={() => { setError(null); setOpen(true); }}
          disabled={!recipient}
          title={!recipient ? t('emailNoAddress') : undefined}
          className={`flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-sm transition-colors disabled:opacity-50 ${cls}`}
        >
          <Mail size={14} />
          {label}
        </button>
        {lastSent && (
          <span className="flex items-center gap-1 text-[10px] text-ck-text-muted">
            <Check size={10} className="text-emerald-400" /> {t('emailLastSent')} {new Date(lastSent).toLocaleString('nl-NL')}
          </span>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-ck-dark-border bg-ck-dark-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 text-base font-semibold text-white"><Mail size={18} /> {label}</h3>
            <p className="mt-2 text-sm text-ck-muted-light">{t('emailConfirmSendTo')}</p>
            <p className="mt-1 font-mono text-xs text-ck-muted">{recipient}</p>
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} disabled={busy} className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:text-white disabled:opacity-50">{t('emailNotNow')}</button>
              <button onClick={send} disabled={busy} className="rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50">{busy ? t('emailSending') : t('emailYesSend')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
