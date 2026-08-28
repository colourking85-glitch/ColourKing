'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Plus, Trash2, ChevronDown, ChevronRight, Clock, Camera, Upload, X } from 'lucide-react';

type SelectOption = { id: string; name: string; kenteken?: string; make?: string; model?: string; customer_id?: string };
type Staff = { id: string; name: string };
type OfferOption = {
  id: string;
  offer_number: string | null;
  customer_id: string;
  vehicle_id: string | null;
  notes: string | null;
  total_cents: number;
  customers?: { id: string; name: string } | null;
  vehicles?: { id: string; kenteken: string; make: string; model: string } | null;
};

type ProcessItem = {
  tempId: string;
  title: string;
  estimated_hours: string;
};

const JOB_TYPES = ['bodywork', 'mechanical', 'paint', 'electrical', 'diagnostics', 'apk', 'maintenance'] as const;
const PRIORITIES = ['normal', 'urgent', 'rush'] as const;
const PAYER_TYPES = ['casco', 'wa', 'particulier', 'lease'] as const;

const PROCESS_PRESETS = [
  'process_bodywork',
  'process_paint',
  'process_assembly',
  'process_disassembly',
  'process_mechanical',
  'process_diagnostics',
  'process_polish',
  'process_prep',
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  normal: 'border-ck-dark-border',
  urgent: 'border-amber-500/60 bg-amber-500/5',
  rush: 'border-red-500/60 bg-red-500/5',
};

function emptyProcess(): ProcessItem {
  return { tempId: crypto.randomUUID(), title: '', estimated_hours: '' };
}

export default function CreateJobPage() {
  const t = useTranslations('jb');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [allVehicles, setAllVehicles] = useState<SelectOption[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customer_id: '',
    vehicle_id: '',
    offer_id: '',
    job_type: 'bodywork' as string,
    priority: 'normal' as string,
    payer_type: '' as string,
    assigned_to: '' as string,
    estimated_hours: '',
    target_date: '',
    estimated_delivery_at: '',
    intake_km: '',
    notes: '',
  });

  const [processesOpen, setProcessesOpen] = useState(false);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [stagedPhotos, setStagedPhotos] = useState<{ file: File; preview: string; phase: string }[]>([]);
  const [photoPhase, setPhotoPhase] = useState('before');
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => { if (Array.isArray(d)) setCustomers(d); });
    fetch('/api/vehicles').then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setAllVehicles(d);
        setVehicles(d);
      }
    });
    fetch('/api/staff').then(r => r.json()).then(d => { if (Array.isArray(d)) setStaff(d); });
    fetch('/api/offers?status=approved').then(r => r.json()).then(d => { if (Array.isArray(d)) setOffers(d); });
  }, []);

  useEffect(() => {
    if (form.customer_id) {
      setVehicles(allVehicles.filter((v: SelectOption) => v.customer_id === form.customer_id));
    } else {
      setVehicles(allVehicles);
    }
  }, [form.customer_id, allVehicles]);

  function handleOfferSelect(offerId: string) {
    if (!offerId) {
      setForm(f => ({ ...f, offer_id: '' }));
      return;
    }
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    setForm(f => ({
      ...f,
      offer_id: offerId,
      customer_id: offer.customer_id || f.customer_id,
      vehicle_id: offer.vehicle_id || f.vehicle_id,
      notes: offer.notes || f.notes,
    }));
  }

  function addPreset(presetKey: string) {
    const existing = processes.some(p => p.title === t(presetKey));
    if (existing) return;
    setProcesses(prev => [...prev, { tempId: crypto.randomUUID(), title: t(presetKey), estimated_hours: '' }]);
    if (!processesOpen) setProcessesOpen(true);
  }

  function handlePhotoStage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      phase: photoPhase,
    }));
    setStagedPhotos(prev => [...prev, ...newPhotos]);
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  function removeStagedPhoto(idx: number) {
    setStagedPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body: Record<string, unknown> = {
      customer_id: form.customer_id || undefined,
      vehicle_id: form.vehicle_id || undefined,
      job_type: form.job_type,
      priority: form.priority,
    };
    if (form.offer_id) body.offer_id = form.offer_id;
    if (form.payer_type) body.payer_type = form.payer_type;
    if (form.assigned_to) body.assigned_to = form.assigned_to;
    if (form.estimated_hours) body.estimated_hours = parseFloat(form.estimated_hours);
    if (form.target_date) body.target_date = form.target_date;
    if (form.estimated_delivery_at) body.estimated_delivery_at = new Date(form.estimated_delivery_at).toISOString();
    if (form.intake_km) body.intake_km = parseInt(form.intake_km);
    if (form.notes) body.notes = form.notes;

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t('createFailed'));
      setSaving(false);
      return;
    }

    const job = await res.json();

    const validProcesses = processes.filter(p => p.title.trim());
    if (validProcesses.length > 0) {
      for (let i = 0; i < validProcesses.length; i++) {
        const p = validProcesses[i];
        const hours = parseFloat(p.estimated_hours);
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.id,
            title: p.title,
            estimated_minutes: hours > 0 ? Math.round(hours * 60) : null,
            sort_order: i,
          }),
        });
      }
    }

    if (stagedPhotos.length > 0) {
      for (const photo of stagedPhotos) {
        const fd = new FormData();
        fd.append('file', photo.file);
        fd.append('phase', photo.phase);
        await fetch(`/api/jobs/${job.id}/photos`, { method: 'POST', body: fd });
      }
    }

    router.push(`/app/jobs/${job.id}`);
  }

  const inputClass = 'w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';
  const selectClass = inputClass;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="JB01" />
        <h1 className="font-display text-2xl font-bold text-white">{t('new')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-5 rounded-lg border bg-ck-dark-card p-6 ${PRIORITY_COLORS[form.priority]}`}>
        {/* Linked Offer (optional) */}
        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('linkedOffer')}</label>
          <SearchableSelect
            options={offers.map(o => ({
              value: o.id,
              label: [o.offer_number ?? '—', o.customers?.name, o.vehicles?.kenteken ? `(${o.vehicles.kenteken})` : null, `€${((o.total_cents ?? 0) / 100).toFixed(2)}`].filter(Boolean).join(' — '),
            }))}
            value={form.offer_id}
            onChange={(val) => handleOfferSelect(val)}
            placeholder={t('selectOfferPlaceholder')}
            searchPlaceholder={`${t('linkedOffer')}...`}
          />
        </div>

        {/* Customer & Vehicle */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('customer')} *</label>
            <SearchableSelect
              options={customers.map(c => ({ value: c.id, label: c.name }))}
              value={form.customer_id}
              onChange={(val) => setForm(f => ({ ...f, customer_id: val, vehicle_id: '' }))}
              placeholder={t('selectCustomerPlaceholder')}
              searchPlaceholder={`${t('customer')}...`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('vehicle')} *</label>
            <SearchableSelect
              options={vehicles.map(v => ({
                value: v.id,
                label: `${v.kenteken ?? ''} — ${v.make ?? ''} ${v.model ?? ''}`.trim(),
              }))}
              value={form.vehicle_id}
              onChange={(val) => setForm(f => ({ ...f, vehicle_id: val }))}
              placeholder={t('selectVehiclePlaceholder')}
              searchPlaceholder={`${t('vehicle')}...`}
            />
          </div>
        </div>

        {/* Job Type & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('jobType')}</label>
            <select value={form.job_type} onChange={set('job_type')} className={selectClass}>
              {JOB_TYPES.map(jt => (
                <option key={jt} value={jt}>{t(`type_${jt}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('priority')}</label>
            <select value={form.priority} onChange={set('priority')} className={selectClass}>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{t(`priority_${p}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Payer & Technician */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('payerType')}</label>
            <select value={form.payer_type} onChange={set('payer_type')} className={selectClass}>
              <option value="">—</option>
              {PAYER_TYPES.map(p => (
                <option key={p} value={p}>{t(`payer_${p}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('assignedTo')}</label>
            <SearchableSelect
              options={staff.map(s => ({ value: s.id, label: s.name }))}
              value={form.assigned_to}
              onChange={(val) => setForm(f => ({ ...f, assigned_to: val }))}
              placeholder={t('selectTechnicianPlaceholder')}
              searchPlaceholder={`${t('assignedTo')}...`}
            />
          </div>
        </div>

        {/* Estimated hours, Target date, Estimated delivery, Intake KM */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('estimatedHours')}</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={form.estimated_hours}
              onChange={set('estimated_hours')}
              className={inputClass}
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('intakeKm')}</label>
            <input
              type="number"
              value={form.intake_km}
              onChange={set('intake_km')}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('targetDate')}</label>
            <input
              type="date"
              value={form.target_date}
              onChange={set('target_date')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('estimatedDelivery')}</label>
            <input
              type="datetime-local"
              value={form.estimated_delivery_at}
              onChange={set('estimated_delivery_at')}
              className={inputClass}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('notes')}</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Photos (intake) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-ck-muted">
              <Camera size={14} /> {t('photos')}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={photoPhase}
                onChange={e => setPhotoPhase(e.target.value)}
                className="rounded border border-ck-dark-border bg-ck-dark-surface px-2 py-1 text-xs text-white focus:border-ck-red focus:outline-none"
              >
                <option value="before">{t('before')}</option>
                <option value="during">{t('during')}</option>
                <option value="after">{t('after')}</option>
              </select>
              <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover">
                <Upload size={12} />
                {t('upload')}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="hidden"
                  onChange={handlePhotoStage}
                />
              </label>
            </div>
          </div>
          {stagedPhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {stagedPhotos.map((p, idx) => (
                <div key={idx} className="group relative">
                  <img
                    src={p.preview}
                    alt={`${p.phase} ${idx + 1}`}
                    className="h-24 w-full rounded-lg border border-ck-dark-border object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                    {t(p.phase)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStagedPhoto(idx)}
                    className="absolute right-1 top-1 hidden rounded bg-red-600 p-1 text-white group-hover:block"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processes (optional, collapsible) */}
        <div className="rounded-lg border border-ck-dark-border">
          <button
            type="button"
            onClick={() => setProcessesOpen(!processesOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm text-ck-muted-light hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{t('processes')}</span>
              {processes.length > 0 && (
                <span className="rounded-full bg-ck-dark-surface px-2 py-0.5 text-[10px] tabular-nums text-ck-muted">
                  {processes.length}
                </span>
              )}
            </div>
            {processesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {processesOpen && (
            <div className="border-t border-ck-dark-border px-4 py-3 space-y-3">
              {/* Preset buttons */}
              <div className="flex flex-wrap gap-1.5">
                {PROCESS_PRESETS.map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => addPreset(key)}
                    className="flex items-center gap-1 rounded-md border border-ck-dark-border px-2 py-1 text-[11px] text-ck-muted-light hover:border-ck-red hover:text-ck-red transition-colors"
                  >
                    <Plus size={10} />
                    {t(key)}
                  </button>
                ))}
              </div>

              {/* Process rows */}
              {processes.length > 0 && (
                <div className="space-y-2">
                  {processes.map((proc) => (
                    <div key={proc.tempId} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={proc.title}
                        onChange={e => setProcesses(prev => prev.map(p => p.tempId === proc.tempId ? { ...p, title: e.target.value } : p))}
                        className="flex-1 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2.5 py-1.5 text-xs text-white focus:border-ck-red focus:outline-none"
                        placeholder={t('processName')}
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={proc.estimated_hours}
                          onChange={e => setProcesses(prev => prev.map(p => p.tempId === proc.tempId ? { ...p, estimated_hours: e.target.value } : p))}
                          className="w-16 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-xs tabular-nums text-white focus:border-ck-red focus:outline-none"
                          placeholder="0.0"
                        />
                        <span className="text-[10px] text-ck-muted">{t('hoursShort')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProcesses(prev => prev.filter(p => p.tempId !== proc.tempId))}
                        className="text-ck-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {/* Total hours */}
                  {processes.some(p => parseFloat(p.estimated_hours) > 0) && (
                    <div className="flex justify-end pr-8 text-xs text-ck-muted">
                      {t('totalHours')}: <span className="ml-1 tabular-nums text-white">{processes.reduce((sum, p) => sum + (parseFloat(p.estimated_hours) || 0), 0).toFixed(1)}h</span>
                    </div>
                  )}
                </div>
              )}

              {/* Add custom */}
              <button
                type="button"
                onClick={() => { setProcesses(prev => [...prev, emptyProcess()]); }}
                className="flex items-center gap-1 text-[11px] text-ck-muted hover:text-ck-red transition-colors"
              >
                <Plus size={10} />
                {t('addCustomProcess')}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:bg-ck-dark-surface"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            {saving ? tCommon('saving') : t('createJob')}
          </button>
        </div>
      </form>
    </div>
  );
}
