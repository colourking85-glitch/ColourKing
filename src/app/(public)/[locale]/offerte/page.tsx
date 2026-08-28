'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

interface PhotoScore {
  lighting: 'good' | 'warning' | 'bad';
  angle: 'good' | 'warning' | 'bad';
  focus: 'good' | 'warning' | 'bad';
  distance: 'good' | 'warning' | 'bad';
  damageVisible: 'good' | 'warning' | 'bad';
  overallScore: number;
  tips: string[];
}

interface VehicleInfo {
  kenteken: string;
  make: string;
  model: string;
  colour: string;
  fuel?: string;
  body_type?: string;
  year?: number;
  rdw_snapshot?: Record<string, unknown>;
}

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}

const SERVICE_TYPES = [
  'body_repair',
  'painting',
  'spot_repair',
  'pdr',
  'full_respray',
] as const;

const REPAIR_LOCATIONS = [
  'front_bumper',
  'rear_bumper',
  'hood',
  'roof',
  'left_side',
  'right_side',
  'trunk',
  'fender',
  'door',
  'other',
] as const;

export default function OffertePage() {
  const t = useTranslations('pub');
  const { locale } = useParams<{ locale: string }>();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    kenteken: '',
    damage: '',
    vehicle_vin: '',
    paint_code: '',
  });
  const [isForeignPlate, setIsForeignPlate] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualColour, setManualColour] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [repairLocations, setRepairLocations] = useState<string[]>([]);

  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwError, setRdwError] = useState('');

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiChecked, setAiChecked] = useState(true);
  const [photoScores, setPhotoScores] = useState<Record<number, PhotoScore>>({});
  const [photoChecking, setPhotoChecking] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch('/api/public/ai-config')
      .then(r => r.json())
      .then(data => {
        setAiEnabled(data.photo_check_enabled === true);
        setAiChecked(data.photo_check_enabled === true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isForeignPlate && brands.length === 0) {
      fetch('/api/vehicle-brands')
        .then(r => r.json())
        .then(data => setBrands(data))
        .catch(() => {});
    }
  }, [isForeignPlate, brands.length]);

  useEffect(() => {
    if (!selectedBrandId) { setModels([]); return; }
    fetch(`/api/vehicle-brands/${selectedBrandId}/models`)
      .then(r => r.json())
      .then(data => setModels(data))
      .catch(() => setModels([]));
  }, [selectedBrandId]);

  async function lookupPlate() {
    const plate = form.kenteken.replace(/[-\s]/g, '').toUpperCase();
    if (!plate || plate.length < 4) {
      setRdwError(t('offerte.rdwMinChars'));
      return;
    }
    setRdwLoading(true);
    setRdwError('');
    setVehicle(null);
    try {
      const res = await fetch(`/api/rdw?kenteken=${encodeURIComponent(plate)}`);
      if (!res.ok) {
        setRdwError(t('offerte.rdwNotFound'));
        return;
      }
      const data: VehicleInfo = await res.json();
      setVehicle(data);
      setForm(prev => ({ ...prev, kenteken: data.kenteken }));
    } catch {
      setRdwError(t('offerte.rdwError'));
    } finally {
      setRdwLoading(false);
    }
  }

  function toggleService(key: string) {
    setServiceTypes(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  }

  function toggleLocation(key: string) {
    setRepairLocations(prev =>
      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('offerte.requiredField');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = t('offerte.invalidEmail');
    }
    if (!isForeignPlate && !vehicle && form.kenteken.trim()) {
      e.kenteken = t('offerte.rdwValidateFirst');
    }
    if (isForeignPlate && !selectedBrandId) {
      e.brand = t('offerte.requiredField');
    }
    if (serviceTypes.length === 0) {
      e.service = t('offerte.selectService');
    }
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const selectedBrand = brands.find(b => b.id === selectedBrandId);
    const selectedModel = models.find(m => m.id === selectedModelId);

    setStatus('sending');
    try {
      const res = await fetch('/api/public/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          kenteken: form.kenteken || undefined,
          damage: form.damage || undefined,
          locale: locale || 'nl',
          vehicle_make: isForeignPlate ? selectedBrand?.name : vehicle?.make,
          vehicle_model: isForeignPlate ? selectedModel?.name : vehicle?.model,
          vehicle_year: isForeignPlate
            ? (manualYear ? parseInt(manualYear, 10) : undefined)
            : vehicle?.year,
          vehicle_colour: isForeignPlate ? manualColour || undefined : vehicle?.colour,
          vehicle_vin: form.vehicle_vin || undefined,
          paint_code: form.paint_code || undefined,
          is_foreign_plate: isForeignPlate,
          service_types: serviceTypes,
          repair_locations: repairLocations,
          rdw_snapshot: vehicle?.rdw_snapshot,
        }),
      });
      if (!res.ok) throw new Error('failed');
      const { id: leadId } = await res.json();

      if (files.length > 0 && leadId) {
        const fd = new FormData();
        fd.append('lead_id', leadId);
        for (const f of files) fd.append('files', f);
        await fetch('/api/public/lead-photos', { method: 'POST', body: fd });
      }

      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  async function checkPhoto(file: File, index: number) {
    setPhotoChecking(prev => ({ ...prev, [index]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('locale', locale || 'nl');
      const res = await fetch('/api/public/photo-check', { method: 'POST', body: fd });
      if (res.ok) {
        const score: PhotoScore = await res.json();
        setPhotoScores(prev => ({ ...prev, [index]: score }));
      }
    } catch {
      // silently fail — AI check is optional
    } finally {
      setPhotoChecking(prev => ({ ...prev, [index]: false }));
    }
  }

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const next = [...files];
    const startIdx = next.length;
    for (let i = 0; i < selected.length && next.length < MAX_FILES; i++) {
      const f = selected[i];
      if (f.type && !f.type.startsWith('image/')) continue;
      next.push(f);
    }
    const total = next.reduce((s, f) => s + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      alert(t('offerte.filesTooLarge'));
      return;
    }
    setFiles(next);

    if (aiChecked) {
      for (let i = startIdx; i < next.length; i++) {
        checkPhoto(next[i], i);
      }
    }
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPhotoScores(prev => {
      const next: Record<number, PhotoScore> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = Number(k);
        if (ki < idx) next[ki] = v;
        else if (ki > idx) next[ki - 1] = v;
      }
      return next;
    });
    setPhotoChecking(prev => {
      const next: Record<number, boolean> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = Number(k);
        if (ki < idx) next[ki] = v;
        else if (ki > idx) next[ki - 1] = v;
      }
      return next;
    });
  }

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  const inputClasses =
    'mt-1 w-full border border-ck-border bg-ck-bg px-4 py-3 text-sm text-ck-text placeholder-ck-text-faint outline-none transition-colors focus:border-ck-red/50';

  const checkboxClasses = (active: boolean) =>
    `cursor-pointer border px-3 py-2 text-xs font-medium transition-colors ${
      active
        ? 'border-ck-red bg-ck-red/10 text-ck-red'
        : 'border-ck-border bg-ck-bg text-ck-text-muted hover:border-ck-border-2 hover:text-ck-text-2'
    }`;

  return (
    <>
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-ck-red/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            {t('cta.eyebrow')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-ck-text sm:text-5xl lg:text-6xl">
            {t('offerte.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ck-text-muted">
            {t('offerte.subtitle')}
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-px bg-ck-border lg:grid-cols-5">
          <div className="bg-ck-bg p-8 sm:p-12 lg:col-span-3">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
              {t('offerte.formTitle')}
            </h2>

            {status === 'success' ? (
              <div className="mt-8 border border-green-900/30 bg-green-950/20 p-6">
                <p className="text-sm text-green-400">{t('offerte.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* --- Vehicle identification --- */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-red">
                    {t('offerte.vehicleSection')}
                  </h3>

                  <label className="flex items-center gap-2 text-xs text-ck-text-muted">
                    <input
                      type="checkbox"
                      checked={isForeignPlate}
                      onChange={() => {
                        setIsForeignPlate(!isForeignPlate);
                        setVehicle(null);
                        setRdwError('');
                      }}
                      className="accent-ck-red"
                    />
                    {t('offerte.foreignPlate')}
                  </label>

                  {!isForeignPlate ? (
                    <>
                      <div>
                        <label htmlFor="kenteken" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                          {t('offerte.kenteken')} *
                        </label>
                        <div className="mt-1 flex gap-2">
                          <input
                            id="kenteken"
                            type="text"
                            value={form.kenteken}
                            onChange={e => {
                              handleChange('kenteken', e.target.value.toUpperCase());
                              if (vehicle) setVehicle(null);
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupPlate(); } }}
                            placeholder="XX-XXX-X"
                            className={`${inputClasses} mt-0 flex-1 font-mono tracking-widest`}
                          />
                          <button
                            type="button"
                            onClick={lookupPlate}
                            disabled={rdwLoading}
                            className="whitespace-nowrap border border-ck-red bg-ck-red/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ck-red transition-colors hover:bg-ck-red/20 disabled:opacity-50"
                          >
                            {rdwLoading ? '...' : t('offerte.lookupPlate')}
                          </button>
                        </div>
                        {rdwError && <p className="mt-1 text-xs text-ck-red">{rdwError}</p>}
                        {errors.kenteken && <p className="mt-1 text-xs text-ck-red">{errors.kenteken}</p>}
                      </div>

                      {vehicle && (
                        <div className="border border-green-900/30 bg-green-950/10 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-ck-text">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ck-text-muted">
                                {vehicle.year && <span>{vehicle.year}</span>}
                                {vehicle.colour && <span>{vehicle.colour}</span>}
                                {vehicle.fuel && <span>{vehicle.fuel}</span>}
                                {vehicle.body_type && <span>{vehicle.body_type}</span>}
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-mono text-green-400">{vehicle.kenteken}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="brand" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                            {t('offerte.brand')} *
                          </label>
                          <select
                            id="brand"
                            value={selectedBrandId}
                            onChange={e => {
                              setSelectedBrandId(e.target.value);
                              setSelectedModelId('');
                              if (errors.brand) setErrors(prev => { const n = { ...prev }; delete n.brand; return n; });
                            }}
                            className={`${inputClasses} appearance-none`}
                          >
                            <option value="">{t('offerte.selectBrand')}</option>
                            {brands.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          {errors.brand && <p className="mt-1 text-xs text-ck-red">{errors.brand}</p>}
                        </div>
                        <div>
                          <label htmlFor="model" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                            {t('offerte.model')}
                          </label>
                          <select
                            id="model"
                            value={selectedModelId}
                            onChange={e => setSelectedModelId(e.target.value)}
                            disabled={!selectedBrandId}
                            className={`${inputClasses} appearance-none disabled:opacity-40`}
                          >
                            <option value="">{t('offerte.selectModel')}</option>
                            {models.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="year" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                            {t('offerte.year')}
                          </label>
                          <input
                            id="year"
                            type="number"
                            min="1960"
                            max="2026"
                            value={manualYear}
                            onChange={e => setManualYear(e.target.value)}
                            placeholder="2020"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="colour" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                            {t('offerte.colour')}
                          </label>
                          <input
                            id="colour"
                            type="text"
                            value={manualColour}
                            onChange={e => setManualColour(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="foreignKenteken" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                          {t('offerte.kentekenOptional')}
                        </label>
                        <input
                          id="foreignKenteken"
                          type="text"
                          value={form.kenteken}
                          onChange={e => handleChange('kenteken', e.target.value)}
                          className={inputClasses}
                        />
                      </div>
                    </>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="vin" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('offerte.vin')}
                      </label>
                      <input
                        id="vin"
                        type="text"
                        maxLength={17}
                        value={form.vehicle_vin}
                        onChange={e => handleChange('vehicle_vin', e.target.value.toUpperCase())}
                        placeholder="WVWZZZ3CZWE123456"
                        className={`${inputClasses} font-mono tracking-wider`}
                      />
                    </div>
                    <div>
                      <label htmlFor="paintCode" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('offerte.paintCode')}
                      </label>
                      <input
                        id="paintCode"
                        type="text"
                        value={form.paint_code}
                        onChange={e => handleChange('paint_code', e.target.value)}
                        className={inputClasses}
                      />
                      <p className="mt-1 text-[10px] text-ck-text-faint">{t('offerte.paintCodeHint')}</p>
                    </div>
                  </div>
                </div>

                {/* --- Service type --- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-red">
                    {t('offerte.serviceSection')} *
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TYPES.map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleService(key)}
                        className={checkboxClasses(serviceTypes.includes(key))}
                      >
                        {t(`offerte.service_${key}`)}
                      </button>
                    ))}
                  </div>
                  {errors.service && <p className="text-xs text-ck-red">{errors.service}</p>}
                </div>

                {/* --- Repair location --- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-text-muted">
                    {t('offerte.locationSection')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {REPAIR_LOCATIONS.map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleLocation(key)}
                        className={checkboxClasses(repairLocations.includes(key))}
                      >
                        {t(`offerte.loc_${key}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* --- Contact details --- */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-red">
                    {t('offerte.contactSection')}
                  </h3>
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                      {t('offerte.name')} *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      className={inputClasses}
                    />
                    {errors.name && <p className="mt-1 text-xs text-ck-red">{errors.name}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('offerte.email')}
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className={inputClasses}
                      />
                      {errors.email && <p className="mt-1 text-xs text-ck-red">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('offerte.phone')}
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </div>

                {/* --- Damage description --- */}
                <div>
                  <label htmlFor="damage" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                    {t('offerte.damageDescription')}
                  </label>
                  <textarea
                    id="damage"
                    rows={4}
                    value={form.damage}
                    onChange={e => handleChange('damage', e.target.value)}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                {/* --- Photos --- */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                      {t('offerte.photos')} ({files.length}/{MAX_FILES})
                    </label>
                    {aiEnabled && (
                      <label className="flex items-center gap-2 text-xs text-ck-text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiChecked}
                          onChange={() => setAiChecked(!aiChecked)}
                          className="accent-ck-red"
                        />
                        {t('offerte.aiPhotoCheck')}
                      </label>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="group relative">
                        <div className="relative h-20 w-20 overflow-hidden border border-ck-border">
                          <img
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute right-0 top-0 bg-black/70 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            &times;
                          </button>
                          {photoChecking[i] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            </div>
                          )}
                          {photoScores[i] && !photoChecking[i] && (
                            <div className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-center text-[9px] font-bold ${
                              photoScores[i].overallScore >= 70
                                ? 'bg-green-600/90 text-white'
                                : photoScores[i].overallScore >= 40
                                  ? 'bg-yellow-600/90 text-white'
                                  : 'bg-red-600/90 text-white'
                            }`}>
                              {photoScores[i].overallScore}/100
                            </div>
                          )}
                        </div>
                        {photoScores[i] && !photoChecking[i] && photoScores[i].tips.length > 0 && (
                          <div className="mt-1 w-48 space-y-0.5">
                            {photoScores[i].tips.map((tip, ti) => (
                              <p key={ti} className="text-[10px] leading-tight text-yellow-400">
                                ⚠ {tip}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {files.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex h-20 w-20 items-center justify-center border border-dashed border-ck-border text-ck-text-faint transition-colors hover:border-ck-red/50 hover:text-ck-red"
                      >
                        +
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
                  />
                  <p className="mt-1 text-[10px] text-ck-text-faint">{t('offerte.photosHint')}</p>
                </div>

                {status === 'error' && (
                  <p className="text-sm text-ck-red">{t('offerte.error')}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-ck-red px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover disabled:opacity-50"
                >
                  {status === 'sending' ? t('offerte.submitting') : t('offerte.submit')}
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-px bg-ck-border lg:col-span-2">
            <div className="bg-ck-bg p-8 sm:p-12">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
                {t('contact.infoTitle')}
              </h2>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('contact.address')}
                  </p>
                  <p className="mt-2 text-sm text-ck-text">{t('footer.address')}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('contact.phone')}
                  </p>
                  <a
                    href="tel:+31681631020"
                    className="mt-2 block font-heading text-2xl font-bold text-ck-text transition-colors hover:text-ck-red"
                  >
                    {t('footer.phone')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('contact.email')}
                  </p>
                  <a
                    href="mailto:info@colourking.nl"
                    className="mt-2 block text-sm text-ck-text transition-colors hover:text-ck-red"
                  >
                    {t('footer.email')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                    {t('footer.hours')}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-ck-text-muted">
                    <p>{t('footer.hoursWeekdays')}</p>
                    <p>{t('footer.hoursSaturday')}</p>
                    <p>{t('footer.hoursSunday')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-48 items-center justify-center bg-ck-bg lg:flex-1">
              <p className="text-xs text-ck-text-faint">{t('contact.mapPlaceholder')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
