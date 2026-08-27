'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

type Brand = { id: string; name: string };
type Model = { id: string; name: string };

export default function NewVehiclePage() {
  const t = useTranslations('vh');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCustomer = searchParams.get('customer');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [kentekenInput, setKentekenInput] = useState('');
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwData, setRdwData] = useState<Record<string, string | number | boolean | null> | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState(presetCustomer ?? '');

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const [kentekenWarning, setKentekenWarning] = useState('');
  const [formKenteken, setFormKenteken] = useState('');

  useEffect(() => {
    fetch('/api/customers').then(r => r.ok ? r.json() : []).then(setCustomers);
    fetch('/api/vehicle-brands').then(r => r.ok ? r.json() : []).then(setBrands);
  }, []);

  useEffect(() => {
    if (!selectedBrandId || selectedBrandId === '__custom') { setModels([]); return; }
    fetch(`/api/vehicle-brands/${selectedBrandId}/models`)
      .then(r => r.ok ? r.json() : [])
      .then(setModels);
  }, [selectedBrandId]);

  useEffect(() => {
    if (!formKenteken.trim()) { setKentekenWarning(''); return; }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/vehicles/check-kenteken?kenteken=${encodeURIComponent(formKenteken)}`);
      if (res.ok) {
        const { exists } = await res.json();
        setKentekenWarning(exists ? t('kentekenExists') : '');
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [formKenteken, t]);

  function handleBrandChange(brandId: string) {
    setSelectedBrandId(brandId);
    if (brandId === '__custom') {
      setSelectedMake('');
    } else {
      const brand = brands.find(b => b.id === brandId);
      setSelectedMake(brand?.name ?? '');
    }
    setSelectedModel('');
  }

  async function lookupRdw() {
    if (!kentekenInput.trim()) return;
    setRdwLoading(true);
    setError('');
    const res = await fetch(`/api/rdw?kenteken=${encodeURIComponent(kentekenInput)}`);
    if (res.ok) {
      const data = await res.json();
      setRdwData(data);
      setFormKenteken(data.kenteken ?? kentekenInput);
      if (data.make) {
        const brand = brands.find(b => b.name.toLowerCase() === (data.make as string).toLowerCase());
        if (brand) {
          setSelectedBrandId(brand.id);
          setSelectedMake(brand.name);
        } else {
          setSelectedBrandId('__custom');
          setSelectedMake(data.make as string);
        }
      }
      if (data.model) setSelectedModel(data.model as string);
    } else {
      setError(t('rdwNotFound'));
      setRdwData(null);
    }
    setRdwLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const body = {
      customer_id: customerId,
      kenteken: formKenteken || null,
      vin: fd.get('vin') || null,
      make: selectedMake || null,
      model: selectedModel || null,
      year: fd.get('year') ? Number(fd.get('year')) : null,
      colour: fd.get('colour') || null,
      paint_code: fd.get('paint_code') || null,
      fuel: fd.get('fuel') || null,
      body_type: fd.get('body_type') || null,
      wok: fd.get('wok') === 'on',
      rdw_snapshot: rdwData?.rdw_snapshot ?? null,
      plate_origin: fd.get('plate_origin') || null,
      notes: fd.get('notes') || null,
    };

    if (!body.customer_id) {
      setError(t('selectOwner'));
      setSaving(false);
      return;
    }

    if (kentekenWarning && body.kenteken) {
      if (!confirm(t('kentekenExistsConfirm'))) {
        setSaving(false);
        return;
      }
    }

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const vehicle = await res.json();
      router.push(`/app/voertuigen/${vehicle.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? tCommon('saveFailed'));
      setSaving(false);
    }
  }

  const selectClass = 'w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';
  const inputClass = selectClass;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ScreenBadge code="VH01" />
        <h1 className="font-display text-2xl font-bold text-white">{t('new')}</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-ck-muted">{t('rdwLookup').toUpperCase()}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('registrationExample')}
            value={kentekenInput}
            onChange={e => setKentekenInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupRdw())}
            className="flex-1 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 font-mono text-sm uppercase text-white focus:border-ck-red focus:outline-none"
          />
          <button
            type="button"
            onClick={lookupRdw}
            disabled={rdwLoading}
            className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            <Search size={14} />
            {rdwLoading ? t('lookingUp') : t('rdwLookup')}
          </button>
        </div>
        {rdwData && (
          <p className="mt-2 text-xs text-green-400">
            {t('found')} {rdwData.make} {rdwData.model} ({rdwData.year}) — {rdwData.colour}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
        <div>
          <label className="mb-1 block text-xs text-ck-muted">{tCommon('customer')} *</label>
          <select
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('selectOwner')}...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('kenteken')}</label>
            <input
              name="kenteken"
              value={formKenteken}
              onChange={e => setFormKenteken(e.target.value)}
              className={`${inputClass} font-mono uppercase`}
            />
            {kentekenWarning && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle size={12} /> {kentekenWarning}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('plateOrigin')}</label>
            <input
              name="plate_origin"
              placeholder={t('plateOriginPlaceholder')}
              className={`${inputClass} uppercase`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('vin')}</label>
            <input name="vin" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('make')}</label>
            <SearchableSelect
              options={brands.map(b => ({ value: b.id, label: b.name }))}
              value={selectedBrandId}
              onChange={(val, label) => {
                if (val === '__custom') {
                  setSelectedBrandId('__custom');
                  setSelectedMake(label);
                } else {
                  handleBrandChange(val);
                }
              }}
              placeholder={`${t('selectMake')}...`}
              searchPlaceholder={`${t('make')}...`}
              allowCustom
              customLabel={t('otherMake')}
            />
            {selectedBrandId === '__custom' && (
              <input
                className={`${inputClass} mt-2`}
                placeholder={t('make')}
                value={selectedMake}
                onChange={e => setSelectedMake(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('model')}</label>
            {models.length > 0 && selectedBrandId !== '__custom' ? (
              <SearchableSelect
                options={models.map(m => ({ value: m.name, label: m.name }))}
                value={selectedModel}
                onChange={(_val, label) => setSelectedModel(label)}
                placeholder={`${t('selectModel')}...`}
                searchPlaceholder={`${t('model')}...`}
                allowCustom
                customLabel={t('otherModel')}
              />
            ) : (
              <input
                className={inputClass}
                placeholder={t('model')}
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('year')}</label>
            <input
              name="year"
              type="number"
              defaultValue={rdwData?.year as number ?? ''}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('colour')}</label>
            <input
              name="colour"
              defaultValue={rdwData?.colour as string ?? ''}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('paintCode')}</label>
            <input name="paint_code" className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('fuel')}</label>
            <input
              name="fuel"
              defaultValue={rdwData?.fuel as string ?? ''}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-ck-muted">{t('bodyType')}</label>
            <input
              name="body_type"
              defaultValue={rdwData?.body_type as string ?? ''}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-ck-muted-light">
              <input
                name="wok"
                type="checkbox"
                defaultChecked={rdwData?.wok as boolean ?? false}
                className="rounded border-ck-dark-border bg-ck-dark-surface"
              />
              {t('wok')}
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-ck-muted">{t('notes')}</label>
          <textarea
            name="notes"
            rows={3}
            placeholder={t('notesPlaceholder')}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-ck-red px-6 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
          >
            {saving ? tCommon('saving') : tCommon('save')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-ck-dark-border px-6 py-2 text-sm text-ck-muted-light hover:text-white"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
