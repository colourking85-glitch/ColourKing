'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Info = { dossier: { id: string; dossier_number: string | null; status: string } | null; canConvert: boolean };

/**
 * JB10: convert a completed work order into a project dossier (admin only).
 * The dossier number is generated immediately; values are copied from the
 * work order, photos are queued for plate redaction in PF10.
 */
export function ConvertToDossier({ jobId, photoCount }: { jobId: string; photoCount: number }) {
  const t = useTranslations('pf');
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}/portfolio`).then(r => (r.ok ? r.json() : null)).then(setInfo);
  }, [jobId]);

  if (!info) return null;

  if (info.dossier) {
    return (
      <Link
        href={`/app/portfolio/${info.dossier.id}`}
        className="flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 px-4 py-3 text-sm font-medium text-fuchsia-300 hover:border-fuchsia-500/50"
      >
        <Award size={16} />
        {t('dossierLink', { n: info.dossier.dossier_number ?? '—' })}
      </Link>
    );
  }

  if (!info.canConvert) return null;

  async function convert() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/jobs/${jobId}/portfolio`, { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (res.ok) router.push(`/app/portfolio/${json.id}`);
    else if (json.existingId) router.push(`/app/portfolio/${json.existingId}`);
    else { setError(json.error ?? t('saveFailed')); setBusy(false); }
  }

  return (
    <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 p-4 text-sm">
      {!open ? (
        <button onClick={() => setOpen(true)} className="flex w-full items-center gap-2 font-medium text-fuchsia-300">
          <Award size={16} /> {t('convertButton')}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-medium text-fuchsia-300"><Award size={16} /> {t('convertButton')}</p>
          <p className="text-xs text-ck-muted-light">{t('convertExplain')}</p>
          <ul className="list-inside list-disc text-xs text-ck-muted-light">
            <li>{t('convertCopies')}</li>
            <li>{t('convertNever')}</li>
            <li>{t('convertPhotos', { n: photoCount })}</li>
          </ul>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={convert} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50">
              {busy && <Loader2 size={12} className="animate-spin" />} {t('convertConfirm')}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light">{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
