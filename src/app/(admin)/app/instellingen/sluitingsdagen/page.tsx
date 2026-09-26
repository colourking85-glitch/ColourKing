'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Blackout = {
  id: string;
  title: string;
  kind: 'holiday' | 'maintenance' | 'other';
  reason: string | null;
  start_date: string;
  end_date: string;
  resource_id: string | null;
  resources: { name: string } | null;
};

type Resource = { id: string; name: string; type: string };

const KIND_CLASS: Record<string, string> = {
  holiday: 'bg-amber-500/10 text-amber-400',
  maintenance: 'bg-blue-500/10 text-blue-400',
  other: 'bg-ck-surface-3 text-ck-text-muted',
};

export default function OffDaysPage() {
  const t = useTranslations('sy');
  const tc = useTranslations('common');
  const [rows, setRows] = useState<Blackout[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ title: '', start_date: today, end_date: today, kind: 'holiday', reason: '', resource_id: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const from = showPast ? '2000-01-01' : today;
    const [b, r] = await Promise.all([
      fetch(`/api/blackouts?from=${from}`).then((x) => (x.ok ? x.json() : [])),
      fetch('/api/resources').then((x) => (x.ok ? x.json() : [])),
    ]);
    setRows(b);
    setResources(r);
    setLoading(false);
  }, [showPast, today]);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/blackouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        start_date: form.start_date,
        end_date: form.end_date || form.start_date,
        kind: form.kind,
        reason: form.reason || null,
        resource_id: form.resource_id || null,
        all_day: true,
      }),
    });
    if (res.ok) {
      setForm({ title: '', start_date: today, end_date: today, kind: 'holiday', reason: '', resource_id: '' });
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? tc('saveFailed'));
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!window.confirm(t('offDayDeleteConfirm'))) return;
    const res = await fetch(`/api/blackouts/${id}`, { method: 'DELETE' });
    if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const inputClass = 'w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const KIND_LABEL: Record<string, string> = { holiday: t('offDayKindHoliday'), maintenance: t('offDayKindMaintenance'), other: t('offDayKindOther') };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="SY06" />
        <h1 className="font-display text-2xl font-bold text-white">{t('offDaysTitle')}</h1>
      </div>
      <p className="text-sm text-ck-muted">{t('offDaysDesc')}</p>

      <form onSubmit={add} className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Plus size={16} /> {t('offDayAdd')}</h2>
        <div className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-ck-muted">{t('offDayTitle')}</label>
            <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('offDayTitlePlaceholder')} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('offDayFrom')}</label>
            <input required type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value, end_date: form.end_date < e.target.value ? e.target.value : form.end_date })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('offDayTo')}</label>
            <input required type="date" min={form.start_date} className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('offDayKind')}</label>
            <select className={inputClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="holiday">{KIND_LABEL.holiday}</option>
              <option value="maintenance">{KIND_LABEL.maintenance}</option>
              <option value="other">{KIND_LABEL.other}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('offDayScope')}</label>
            <select className={inputClass} value={form.resource_id} onChange={(e) => setForm({ ...form, resource_id: e.target.value })}>
              <option value="">{t('offDayScopeCompany')}</option>
              {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs text-ck-muted">{t('offDayReason')}</label>
            <input className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-ck-red px-5 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50">
            <CalendarOff size={14} /> {saving ? t('saving') : t('offDayAdd')}
          </button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{t('offDayList')}</h2>
        <label className="flex items-center gap-2 text-xs text-ck-muted-light">
          <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} /> {t('offDayShowPast')}
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ck-dark-border bg-ck-dark-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ck-dark-border text-left text-[10px] font-semibold uppercase tracking-wider text-ck-muted">
              <th className="px-4 py-2">{t('offDayFrom')}</th>
              <th className="px-4 py-2">{t('offDayTo')}</th>
              <th className="px-4 py-2">{t('offDayTitle')}</th>
              <th className="px-4 py-2">{t('offDayKind')}</th>
              <th className="px-4 py-2">{t('offDayScope')}</th>
              <th className="px-4 py-2">{t('offDayReason')}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ck-dark-border">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-ck-muted">{tc('loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-ck-muted">{t('offDayEmpty')}</td></tr>
            ) : rows.map((r) => {
              const past = r.end_date < today;
              return (
                <tr key={r.id} className={past ? 'opacity-50' : ''}>
                  <td className="whitespace-nowrap px-4 py-2 text-white">{fmt(r.start_date)}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-white">{r.end_date === r.start_date ? '—' : fmt(r.end_date)}</td>
                  <td className="px-4 py-2 font-medium text-white">{r.title}</td>
                  <td className="px-4 py-2"><span className={`rounded-md px-2 py-0.5 text-xs ${KIND_CLASS[r.kind] ?? KIND_CLASS.other}`}>{KIND_LABEL[r.kind] ?? r.kind}</span></td>
                  <td className="px-4 py-2 text-ck-muted-light">{r.resources?.name ?? t('offDayScopeCompany')}</td>
                  <td className="px-4 py-2 text-ck-muted-light">{r.reason ?? ''}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => remove(r.id)} className="rounded-lg border border-red-500/30 p-1.5 text-red-400 hover:bg-red-500/10" title={tc('delete')}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
