'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Shield, RefreshCw, ExternalLink, CheckCircle2, XCircle,
  AlertTriangle, Eye, EyeOff, Loader2, Clock,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type SecretEntry = {
  key: string;
  label: string;
  required: boolean;
  isSet: boolean;
  masked: string;
  scope: 'server' | 'public';
};

type SecretGroup = {
  id: string;
  name: string;
  icon: string;
  description: string;
  docsUrl: string;
  secrets: SecretEntry[];
};

type TestResult = { ok: boolean; message: string; latencyMs?: number };

export default function IntegrationsPage() {
  const t = useTranslations('sy');
  const [groups, setGroups] = useState<SecretGroup[]>([]);
  const [summary, setSummary] = useState({ total: 0, set: 0, missing: 0 });
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const fetchSecrets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/infra/secrets');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
        setSummary(data.summary);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSecrets(); }, [fetchSecrets]);

  const testService = async (serviceId: string) => {
    setTesting(p => ({ ...p, [serviceId]: true }));
    try {
      const res = await fetch('/api/infra/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', service: serviceId }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResults(p => ({ ...p, ...data.results }));
      }
    } finally {
      setTesting(p => ({ ...p, [serviceId]: false }));
    }
  };

  const testAll = async () => {
    setTesting(p => {
      const next = { ...p };
      groups.forEach(g => { next[g.id] = true; });
      return next;
    });
    try {
      const res = await fetch('/api/infra/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResults(p => ({ ...p, ...data.results }));
      }
    } finally {
      setTesting({});
    }
  };

  const toggleValues = (groupId: string) => {
    setShowValues(p => ({ ...p, [groupId]: !p[groupId] }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  const setCount = summary.set;
  const totalCount = summary.total;
  const missingCount = summary.missing;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">{t('envSecrets')}</h1>
            <ScreenBadge code="SY50" />
          </div>
          <p className="mt-1 text-sm text-ck-text-muted">{t('envSecretsDesc')}</p>
        </div>
        <button
          onClick={testAll}
          disabled={Object.values(testing).some(Boolean)}
          className="flex items-center gap-2 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={Object.values(testing).some(Boolean) ? 'animate-spin' : ''} />
          {t('testAll')}
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <div className="flex items-center gap-2 text-sm text-ck-text-muted">
            <Shield size={14} />
            {t('totalSecrets')}
          </div>
          <p className="mt-1 text-2xl font-semibold text-white">{totalCount}</p>
        </div>
        <div className="rounded-[10px] border-[0.5px] border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 size={14} />
            {t('configured')}
          </div>
          <p className="mt-1 text-2xl font-semibold text-green-400">{setCount}</p>
        </div>
        <div className={`rounded-[10px] border-[0.5px] p-4 ${missingCount > 0 ? 'border-red-500/20 bg-red-500/5' : 'border-ck-border bg-ck-surface'}`}>
          <div className={`flex items-center gap-2 text-sm ${missingCount > 0 ? 'text-red-400' : 'text-ck-text-muted'}`}>
            <AlertTriangle size={14} />
            {t('missingRequired')}
          </div>
          <p className={`mt-1 text-2xl font-semibold ${missingCount > 0 ? 'text-red-400' : 'text-ck-text-muted'}`}>{missingCount}</p>
        </div>
      </div>

      {/* Service groups */}
      <div className="space-y-4">
        {groups.map((group) => {
          const allSet = group.secrets.every(s => s.isSet);
          const requiredMissing = group.secrets.filter(s => s.required && !s.isSet);
          const result = testResults[group.id];
          const isTesting = testing[group.id];
          const isExpanded = showValues[group.id];

          return (
            <div
              key={group.id}
              className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface"
            >
              {/* Group header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{group.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-medium text-white">{group.name}</h2>
                      {allSet ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                          <CheckCircle2 size={10} />
                          {t('allSet')}
                        </span>
                      ) : requiredMissing.length > 0 ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
                          <XCircle size={10} />
                          {requiredMissing.length} {t('missing')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          <AlertTriangle size={10} />
                          {t('optionalMissing')}
                        </span>
                      )}
                      {result && (
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          result.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {result.ok ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {result.message}
                          {result.latencyMs != null && ` (${result.latencyMs}ms)`}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ck-text-muted">{group.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {group.docsUrl && (
                    <a
                      href={group.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[8px] border-[0.5px] border-ck-border p-2 text-ck-text-muted hover:text-white transition-colors"
                      title="Documentation"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {['supabase', 'mollie', 'resend'].includes(group.id) && (
                    <button
                      onClick={() => testService(group.id)}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 rounded-[8px] border-[0.5px] border-ck-border px-3 py-1.5 text-xs text-ck-text-muted hover:border-ck-red hover:text-ck-red transition-colors disabled:opacity-50"
                    >
                      {isTesting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      {t('test')}
                    </button>
                  )}
                  <button
                    onClick={() => toggleValues(group.id)}
                    className="rounded-[8px] border-[0.5px] border-ck-border p-2 text-ck-text-muted hover:text-white transition-colors"
                  >
                    {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Secrets table */}
              <div className="border-t border-ck-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ck-border text-left text-xs text-ck-text-muted">
                      <th className="px-4 py-2 font-medium">{t('envVar')}</th>
                      <th className="px-4 py-2 font-medium">{t('label')}</th>
                      <th className="px-4 py-2 font-medium">{t('scope')}</th>
                      <th className="px-4 py-2 font-medium">{t('status')}</th>
                      <th className="px-4 py-2 font-medium">{t('value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.secrets.map((secret) => (
                      <tr key={secret.key} className="border-b border-ck-border last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 font-mono text-xs text-white">{secret.key}</td>
                        <td className="px-4 py-2.5 text-ck-text-muted">{secret.label}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            secret.scope === 'public'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {secret.scope}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {secret.isSet ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 size={12} />
                              <span className="text-xs">{t('set')}</span>
                            </span>
                          ) : secret.required ? (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle size={12} />
                              <span className="text-xs">{t('notSet')}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-ck-text-muted">
                              <Clock size={12} />
                              <span className="text-xs">{t('optional')}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-ck-text-muted">
                          {secret.isSet
                            ? isExpanded ? secret.masked : '••••••••'
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
