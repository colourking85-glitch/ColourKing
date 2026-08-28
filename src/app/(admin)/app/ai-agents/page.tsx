'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bot, CheckCircle2, XCircle, AlertTriangle, Zap, Eye, Settings,
  RefreshCw, Image as ImageIcon, FileText, MessageSquare, Calculator,
  Shield, Activity,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type ProviderId = 'anthropic' | 'google' | 'openai';

interface ProviderInfo {
  id: ProviderId;
  name: string;
  envKey: string;
  models: { vision: string; text: string };
  active: boolean;
}

interface AISettings {
  default_provider?: string;
  photo_check_enabled?: boolean;
  photo_check_provider?: string;
}

interface TestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

const PROVIDER_STYLES: Record<ProviderId, { icon: string; color: string; bg: string }> = {
  anthropic: { icon: '🤖', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-500/30' },
  google: { icon: '✨', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-500/30' },
  openai: { icon: '💬', color: 'text-green-400', bg: 'bg-green-900/20 border-green-500/30' },
};

interface FeatureConfig {
  id: string;
  icon: React.ReactNode;
  settingKey: string;
  providerKey: string;
  requiresVision: boolean;
}

const FEATURES: FeatureConfig[] = [
  { id: 'photo_check', icon: <ImageIcon size={16} />, settingKey: 'photo_check_enabled', providerKey: 'photo_check_provider', requiresVision: true },
];

export default function AIAgentsPage() {
  const t = useTranslations('sy');
  const tCommon = useTranslations('common');

  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [settings, setSettings] = useState<AISettings>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [provRes, settRes] = await Promise.all([
        fetch('/api/settings/ai/providers'),
        fetch('/api/settings/ai'),
      ]);
      if (provRes.ok) {
        const { providers: p } = await provRes.json();
        setProviders(p);
      }
      if (settRes.ok) {
        const s = await settRes.json();
        setSettings(s);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function testProvider(serviceId: string) {
    setTesting(serviceId);
    try {
      const res = await fetch('/api/infra/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', service: serviceId }),
      });
      if (res.ok) {
        const { results } = await res.json();
        setTestResults(prev => ({ ...prev, ...results }));
      }
    } finally {
      setTesting(null);
    }
  }

  async function saveSettings(update: Partial<AISettings>) {
    const newSettings = { ...settings, ...update };
    setSettings(newSettings);
    setSaving(true);
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  const activeProviders = providers.filter(p => p.active);
  const activeCount = activeProviders.length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-[#6b6b80]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">{t('aiAgentsTitle')}</h1>
            <ScreenBadge code="SY20" />
          </div>
          <p className="mt-1 text-sm text-[#6b6b80]">{t('aiAgentsDesc')}</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 size={14} />
            {tCommon('saved')}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[#6b6b80]" />
            <p className="text-xs text-[#6b6b80]">{t('aiProvidersAvailable')}</p>
          </div>
          <p className="mt-1 text-2xl font-medium text-white">{providers.length}</p>
        </div>
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <p className="text-xs text-[#6b6b80]">{t('aiProvidersActive')}</p>
          </div>
          <p className="mt-1 text-2xl font-medium text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <p className="text-xs text-[#6b6b80]">{t('aiFeaturesEnabled')}</p>
          </div>
          <p className="mt-1 text-2xl font-medium text-amber-400">
            {FEATURES.filter(f => settings[f.settingKey as keyof AISettings] !== false).length}/{FEATURES.length}
          </p>
        </div>
      </div>

      {/* Providers */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-[#6b6b80]">
          <Bot size={14} />
          {t('aiProviders')}
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {providers.map(provider => {
            const style = PROVIDER_STYLES[provider.id];
            const test = testResults[provider.id === 'google' ? 'google_ai' : provider.id];
            const isDefault = settings.default_provider === provider.id;
            const testServiceId = provider.id === 'google' ? 'google_ai' : provider.id;

            return (
              <div
                key={provider.id}
                className={`rounded-[10px] border p-4 transition-colors ${
                  provider.active
                    ? `${style.bg}`
                    : 'border-[#1e1e2a] bg-[#12121a] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <span className="text-sm font-medium text-white">{provider.name}</span>
                  </div>
                  {provider.active ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-400">
                      <CheckCircle2 size={10} /> {t('aiActive')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-900/30 px-2 py-0.5 text-xs text-red-400">
                      <XCircle size={10} /> {t('aiInactive')}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#6b6b80]">
                  <div className="flex justify-between">
                    <span>{t('aiEnvKey')}</span>
                    <code className="font-mono text-[#8b8ba0]">{provider.envKey}</code>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('aiVisionModel')}</span>
                    <span className="text-[#8b8ba0]">{provider.models.vision}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('aiTextModel')}</span>
                    <span className="text-[#8b8ba0]">{provider.models.text}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {provider.active && (
                    <>
                      <button
                        onClick={() => testProvider(testServiceId)}
                        disabled={testing === testServiceId}
                        className="flex items-center gap-1.5 rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] px-3 py-1.5 text-xs text-[#6b6b80] hover:text-white disabled:opacity-50"
                      >
                        {testing === testServiceId ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Zap size={12} />
                        )}
                        {t('aiTest')}
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => saveSettings({ default_provider: provider.id })}
                          disabled={saving}
                          className="flex items-center gap-1.5 rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] px-3 py-1.5 text-xs text-[#6b6b80] hover:text-white disabled:opacity-50"
                        >
                          <Settings size={12} />
                          {t('aiSetDefault')}
                        </button>
                      )}
                      {isDefault && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Shield size={12} />
                          {t('aiDefaultProvider')}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {test && (
                  <div className={`mt-2 rounded-lg p-2 text-xs ${test.ok ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-400'}`}>
                    {test.ok ? '✓' : '✗'} {test.message}
                    {test.latencyMs && <span className="ml-2 text-[#6b6b80]">{test.latencyMs}ms</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activeCount === 0 && (
          <div className="mt-3 rounded-[10px] border border-amber-500/30 bg-amber-950/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-400">{t('aiNoProviders')}</p>
                <p className="mt-1 text-xs text-[#6b6b80]">{t('aiNoProvidersDesc')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Features */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-[#6b6b80]">
          <Zap size={14} />
          {t('aiFeatures')}
        </h2>
        <div className="space-y-3">
          {FEATURES.map(feature => {
            const enabled = settings[feature.settingKey as keyof AISettings] !== false;
            const selectedProvider = (settings[feature.providerKey as keyof AISettings] as string) || settings.default_provider || '';

            return (
              <div key={feature.id} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${enabled ? 'bg-[#E8364E]/10 text-[#E8364E]' : 'bg-[#1e1e2a] text-[#6b6b80]'}`}>
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t(`aiFeature_${feature.id}`)}</p>
                      <p className="text-xs text-[#6b6b80]">{t(`aiFeature_${feature.id}_desc`)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Provider selector */}
                    <select
                      value={selectedProvider}
                      onChange={e => saveSettings({ [feature.providerKey]: e.target.value })}
                      disabled={!enabled || activeCount === 0}
                      className="rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] px-3 py-1.5 text-xs text-white disabled:opacity-40"
                    >
                      <option value="">{t('aiAutoSelect')}</option>
                      {activeProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    {/* Toggle */}
                    <button
                      onClick={() => saveSettings({ [feature.settingKey]: !enabled })}
                      disabled={activeCount === 0}
                      className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-40 ${
                        enabled ? 'bg-[#E8364E]' : 'bg-[#2e2e3a]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase text-[#6b6b80]">
          <Eye size={14} />
          {t('aiHowItWorks')}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8364E]/10 text-sm font-bold text-[#E8364E]">1</div>
            <p className="text-sm font-medium text-white">{t('aiStep1Title')}</p>
            <p className="mt-1 text-xs text-[#6b6b80]">{t('aiStep1Desc')}</p>
          </div>
          <div className="rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8364E]/10 text-sm font-bold text-[#E8364E]">2</div>
            <p className="text-sm font-medium text-white">{t('aiStep2Title')}</p>
            <p className="mt-1 text-xs text-[#6b6b80]">{t('aiStep2Desc')}</p>
          </div>
          <div className="rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8364E]/10 text-sm font-bold text-[#E8364E]">3</div>
            <p className="text-sm font-medium text-white">{t('aiStep3Title')}</p>
            <p className="mt-1 text-xs text-[#6b6b80]">{t('aiStep3Desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
