'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, CheckCircle2, Circle, Clock, Car, Wrench, ShieldCheck, PackageCheck, PartyPopper } from 'lucide-react';

type StageStatus = 'completed' | 'active' | 'pending';

interface TrackingStage {
  key: string;
  status: StageStatus;
  timestamp: string | null;
}

interface TrackingResult {
  tracking_code: string;
  current_stage: string;
  stages: TrackingStage[];
  vehicle: { make: string; model: string; colour?: string } | null;
  job_number: number;
  error?: string;
}

const STAGE_ICONS: Record<string, typeof Clock> = {
  received: Clock,
  scheduled: Car,
  repairing: Wrench,
  quality_check: ShieldCheck,
  ready: PackageCheck,
  completed: PartyPopper,
};

export default function TrackingPage() {
  const t = useTranslations('pub.tracking');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/public/tracking?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'not_found') {
          setError(t('notFound'));
        } else if (data.error === 'tracking_disabled') {
          setError(t('disabled'));
        } else {
          setError(t('error'));
        }
        return;
      }

      setResult(data);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ck-text sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-ck-text-muted">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ck-text-muted" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('placeholder')}
            maxLength={12}
            className="w-full rounded-lg border border-ck-border bg-ck-surface py-3 pl-10 pr-4 text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none focus:ring-2 focus:ring-ck-red/20 font-mono tracking-widest text-lg"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-lg bg-ck-red px-6 py-3 font-semibold text-white transition-colors hover:bg-ck-red-hover disabled:opacity-50"
        >
          {loading ? t('searching') : t('search')}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-8">
          {result.vehicle && (
            <div className="flex items-center justify-between rounded-lg border border-ck-border bg-ck-surface p-4">
              <div>
                <p className="text-sm text-ck-text-muted">{t('vehicle')}</p>
                <p className="text-lg font-semibold text-ck-text">
                  {result.vehicle.make} {result.vehicle.model}
                  {result.vehicle.colour && (
                    <span className="ml-2 text-sm font-normal text-ck-text-muted">
                      ({result.vehicle.colour})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-ck-text-muted">{t('trackingCode')}</p>
                <p className="font-mono text-lg font-semibold tracking-widest text-ck-text">
                  {result.tracking_code}
                </p>
              </div>
            </div>
          )}

          <div className="relative">
            {result.stages.map((stage, i) => {
              const Icon = STAGE_ICONS[stage.key] || Circle;
              const isLast = i === result.stages.length - 1;

              return (
                <div key={stage.key} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <div
                      className={`absolute left-5 top-10 h-full w-0.5 ${
                        stage.status === 'completed'
                          ? 'bg-ck-red'
                          : 'bg-ck-border'
                      }`}
                    />
                  )}

                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      stage.status === 'completed'
                        ? 'bg-ck-red text-white'
                        : stage.status === 'active'
                          ? 'border-2 border-ck-red bg-ck-surface text-ck-red ring-4 ring-ck-red/20'
                          : 'border-2 border-ck-border bg-ck-surface text-ck-text-muted'
                    }`}
                  >
                    {stage.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="pt-1.5">
                    <p
                      className={`font-semibold ${
                        stage.status === 'pending'
                          ? 'text-ck-text-muted'
                          : 'text-ck-text'
                      }`}
                    >
                      {t(`stages.${stage.key}`)}
                    </p>
                    <p className="text-sm text-ck-text-muted">
                      {t(`stageDesc.${stage.key}`)}
                    </p>
                    {stage.timestamp && (
                      <p className="mt-1 text-xs text-ck-text-muted">
                        {new Date(stage.timestamp).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-ck-text-muted">
            {t('questions')}{' '}
            <a href="/nl/contact" className="font-semibold text-ck-red hover:text-ck-red-hover">
              {t('contactUs')}
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
