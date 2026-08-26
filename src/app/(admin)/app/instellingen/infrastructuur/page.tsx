'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

interface ServiceInfo {
  name: string;
  key: string;
  status: 'connected' | 'configured' | 'missing';
  details: Record<string, string>;
}

interface PlatformInfo {
  framework: string;
  runtime: string;
  platform: string;
  region: string;
  environment: string;
  gitSha: string;
  domain: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  connected: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Connected' },
  configured: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Configured' },
  missing: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', label: 'Not configured' },
};

const SERVICE_ICONS: Record<string, string> = {
  supabase: '🗄️',
  imap: '📧',
  drive: '💾',
  mollie: '💳',
  resend: '✉️',
  rdw: '🚗',
};

export default function InfraPage() {
  const t = useTranslations('infra');
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/infra/status')
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services || []);
        setPlatform(data.platform || null);
      })
      .catch(() => setError('Failed to load infrastructure status'))
      .finally(() => setLoading(false));
  }, []);

  const connectedCount = services.filter((s) => s.status !== 'missing').length;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center text-ck-muted-light">
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScreenBadge code="SY35" />
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-ck-muted-light">{t('subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Platform card */}
      {platform && (
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">{t('platformTitle')}</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <InfoField label={t('framework')} value={platform.framework} />
            <InfoField label={t('runtime')} value={platform.runtime} />
            <InfoField label={t('hosting')} value={platform.platform} />
            <InfoField label={t('region')} value={platform.region} />
            <InfoField label={t('environment')} value={platform.environment} />
            <InfoField label={t('gitCommit')} value={platform.gitSha} mono />
            <InfoField label={t('domain')} value={platform.domain} />
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-lg border border-ck-dark-border bg-ck-dark-card px-5 py-3">
        <span className="text-sm text-ck-muted-light">{t('servicesStatus')}</span>
        <span className="text-sm font-semibold text-white">
          {connectedCount}/{services.length} {t('active')}
        </span>
        <div className="ml-auto flex gap-4">
          {(['connected', 'configured', 'missing'] as const).map((s) => {
            const count = services.filter((svc) => svc.status === s).length;
            if (count === 0) return null;
            const style = STATUS_STYLES[s];
            return (
              <span key={s} className="flex items-center gap-1.5 text-xs">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className={style.text}>
                  {count} {style.label}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Service cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((svc) => {
          const style = STATUS_STYLES[svc.status];
          const icon = SERVICE_ICONS[svc.key] || '⚙️';
          return (
            <div
              key={svc.key}
              className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-semibold text-white">{svc.name}</span>
                </div>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(svc.details).map(([key, val]) => (
                  <div key={key} className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-ck-muted-light">{key}</span>
                    <span className="truncate text-right font-mono text-[11px] text-white/70">
                      {val || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ck-muted-light">
        {label}
      </div>
      <div className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
