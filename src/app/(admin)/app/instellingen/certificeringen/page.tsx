'use client';

import { useState, useEffect } from 'react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-ck-red' : 'bg-ck-border'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface CertificationsSettings {
  bovag: boolean;
  rdw_apk: boolean;
  erkend_leerbedrijf: boolean;
  erkend_duurzaam: boolean;
  paint_system: string;
  insurer_partners: string;
  google_review_score: string;
  google_review_count: number;
  response_sla_hours: number;
  show_replacement_vehicle: boolean;
  show_pickup_delivery: boolean;
}

const DEFAULTS: CertificationsSettings = {
  bovag: false,
  rdw_apk: false,
  erkend_leerbedrijf: false,
  erkend_duurzaam: false,
  paint_system: '',
  insurer_partners: '',
  google_review_score: '',
  google_review_count: 0,
  response_sla_hours: 0,
  show_replacement_vehicle: false,
  show_pickup_delivery: false,
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function CertificationsPage() {
  const [settings, setSettings] = useState<CertificationsSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/certifications')
      .then((r) => (r.ok ? r.json() : DEFAULTS))
      .then((data) => setSettings({ ...DEFAULTS, ...(data?.certifications ?? data) }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/certifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setToast('Instellingen opgeslagen');
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast('Fout bij opslaan');
        setTimeout(() => setToast(null), 4000);
      }
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof CertificationsSettings>(key: K, value: CertificationsSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  const inputClass =
    'w-full rounded-lg border border-ck-border bg-ck-surface px-3 py-2 text-sm text-white placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-medium text-white">Certificeringen &amp; Website</h1>
          <ScreenBadge code="SY55" />
        </div>
        <p className="mt-1 text-sm text-ck-text-muted">
          Beheer certificeringen, social proof en diensten die op de website getoond worden.
        </p>
      </div>

      {/* Section 1: Certificeringen */}
      <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        <div className="border-b border-ck-border px-5 py-3">
          <h2 className="text-sm font-medium text-white">Certificeringen</h2>
        </div>
        <div className="divide-y divide-ck-border">
          {/* BOVAG */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-ck-text-muted">BOVAG lid</span>
            <Toggle checked={settings.bovag} onChange={(v) => update('bovag', v)} />
          </div>

          {/* RDW APK */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-ck-text-muted">RDW APK Erkend</span>
            <Toggle checked={settings.rdw_apk} onChange={(v) => update('rdw_apk', v)} />
          </div>

          {/* Erkend Leerbedrijf */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-ck-text-muted">Erkend Leerbedrijf</span>
            <Toggle checked={settings.erkend_leerbedrijf} onChange={(v) => update('erkend_leerbedrijf', v)} />
          </div>

          {/* Erkend Duurzaam */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-ck-text-muted">Erkend Duurzaam</span>
            <Toggle checked={settings.erkend_duurzaam} onChange={(v) => update('erkend_duurzaam', v)} />
          </div>

          {/* Paint system */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-sm text-ck-text-muted">Verfsysteem certificering</label>
            <input
              type="text"
              className={inputClass}
              value={settings.paint_system}
              onChange={(e) => update('paint_system', e.target.value)}
              placeholder="bijv. Standox, Sikkens, Spies Hecker"
            />
          </div>

          {/* Insurer partners */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-sm text-ck-text-muted">Verzekeringspartners</label>
            <input
              type="text"
              className={inputClass}
              value={settings.insurer_partners}
              onChange={(e) => update('insurer_partners', e.target.value)}
              placeholder="bijv. Univé, Centraal Beheer, OHRA"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Social Proof */}
      <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        <div className="border-b border-ck-border px-5 py-3">
          <h2 className="text-sm font-medium text-white">Social Proof</h2>
        </div>
        <div className="divide-y divide-ck-border">
          {/* Google review score */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-sm text-ck-text-muted">Google Reviews score</label>
            <input
              type="text"
              className={inputClass}
              value={settings.google_review_score}
              onChange={(e) => update('google_review_score', e.target.value)}
              placeholder="bijv. 4.8"
            />
          </div>

          {/* Google review count */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-sm text-ck-text-muted">Aantal Google Reviews</label>
            <input
              type="number"
              className={inputClass}
              value={settings.google_review_count}
              onChange={(e) => update('google_review_count', parseInt(e.target.value, 10) || 0)}
              placeholder="0"
              min={0}
            />
          </div>
        </div>
      </section>

      {/* Section 3: Diensten & Responstijd */}
      <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface">
        <div className="border-b border-ck-border px-5 py-3">
          <h2 className="text-sm font-medium text-white">Diensten &amp; Responstijd</h2>
        </div>
        <div className="divide-y divide-ck-border">
          {/* Response SLA hours */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-sm text-ck-text-muted">Reactietijd (uren)</label>
            <input
              type="number"
              className={inputClass}
              value={settings.response_sla_hours}
              onChange={(e) => update('response_sla_hours', parseInt(e.target.value, 10) || 0)}
              min={0}
            />
            <p className="mt-1 text-xs text-ck-text-muted">0 = niet tonen op website</p>
          </div>

          {/* Show replacement vehicle */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-ck-text-muted">Vervangend vervoer aanbieden</span>
            <Toggle
              checked={settings.show_replacement_vehicle}
              onChange={(v) => update('show_replacement_vehicle', v)}
            />
          </div>

          {/* Show pickup & delivery */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-ck-text-muted">Haal- en brengservice aanbieden</span>
            <Toggle
              checked={settings.show_pickup_delivery}
              onChange={(v) => update('show_pickup_delivery', v)}
            />
          </div>
        </div>
      </section>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-ck-red px-6 py-2.5 text-sm font-semibold text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
