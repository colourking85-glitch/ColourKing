'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';

interface Assessment {
  damageType: string;
  severity: 'light' | 'moderate' | 'severe';
  repairMethod: string;
  estimatedHours: { min: number; max: number };
  affectedPanels: string[];
  summary: string;
  confidence: number;
}

const SEVERITY_STYLES = {
  light: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
} as const;

export default function DamageAssessment({ locale }: { locale: string }) {
  const t = useTranslations('pub.damageAssess');
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Assessment | null>(null);
  const [error, setError] = useState('');

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('tooLarge'));
      return;
    }
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    assess(file);
  }

  async function assess(file: File) {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('locale', locale);
      const res = await fetch('/api/public/damage-assess', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) setError(t('notConfigured'));
        else if (res.status === 429) setError(t('rateLimit'));
        else setError(data.error || t('failed'));
        return;
      }
      setResult(await res.json());
    } catch {
      setError(t('failed'));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="rounded-xl border border-ck-border bg-ck-surface p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ck-red/10">
          <Camera className="h-5 w-5 text-ck-red" />
        </div>
        <div>
          <h3 className="font-semibold text-ck-text">{t('title')}</h3>
          <p className="text-sm text-ck-text-muted">{t('subtitle')}</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {!preview && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-ck-border p-8 text-ck-text-muted transition-colors hover:border-ck-red/50 hover:bg-ck-red/5"
        >
          <Upload className="h-8 w-8" />
          <span className="text-sm font-medium">{t('upload')}</span>
          <span className="text-xs">{t('maxSize')}</span>
        </button>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-lg">
            <img src={preview} alt="" className="w-full max-h-64 object-cover rounded-lg" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="flex items-center gap-2 rounded-lg bg-ck-surface px-4 py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-ck-red" />
                  <span className="text-sm font-medium text-ck-text">{t('analyzing')}</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3 rounded-lg border border-ck-border bg-ck-bg p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-ck-text">{t('result')}</h4>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[result.severity]}`}>
                  {t(`severity.${result.severity}`)}
                </span>
              </div>

              <p className="text-sm text-ck-text">{result.summary}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-ck-text-muted" />
                  <div>
                    <p className="text-xs text-ck-text-muted">{t('method')}</p>
                    <p className="text-ck-text">{result.repairMethod}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ck-text-muted" />
                  <div>
                    <p className="text-xs text-ck-text-muted">{t('estimated')}</p>
                    <p className="text-ck-text">{result.estimatedHours.min}–{result.estimatedHours.max} {t('hours')}</p>
                  </div>
                </div>
              </div>

              {result.affectedPanels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.affectedPanels.map((panel) => (
                    <span key={panel} className="rounded-full bg-ck-surface-2 px-2.5 py-0.5 text-xs text-ck-text-muted">
                      {panel}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-ck-text-muted">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('confidence', { pct: result.confidence })}
              </div>

              <p className="text-xs text-ck-text-faint italic">{t('disclaimer')}</p>
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-ck-red hover:text-ck-red-hover"
          >
            {t('tryAnother')}
          </button>
        </div>
      )}
    </div>
  );
}
