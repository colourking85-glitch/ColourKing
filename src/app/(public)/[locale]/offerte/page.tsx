'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

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

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const next = [...files];
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
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  }

  const inputClasses =
    'mt-1 w-full border border-ck-border bg-ck-dark px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-[#E8364E]/50';

  const checkboxClasses = (active: boolean) =>
    `cursor-pointer border px-3 py-2 text-xs font-medium transition-colors ${
      active
        ? 'border-[#E8364E] bg-[#E8364E]/10 text-[#E8364E]'
        : 'border-ck-border bg-ck-dark text-white/60 hover:border-white/30 hover:text-white/80'
    }`;

  return (
    <>
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8364E]/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('cta.eyebrow')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('offerte.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
            {t('offerte.subtitle')}
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-px bg-ck-border lg:grid-cols-5">
          <div className="bg-ck-dark p-8 sm:p-12 lg:col-span-3">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
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
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E8364E]">
                    {t('offerte.vehicleSection')}
                  </h3>

                  <label className="flex items-center gap-2 text-xs text-white/60">
                    <input
                      type="checkbox"
                      checked={isForeignPlate}
                      onChange={() => {
                        setIsForeignPlate(!isForeignPlate);
                        setVehicle(null);
                        setRdwError('');
                      }}
                      className="accent-[#E8364E]"
                    />
                    {t('offerte.foreignPlate')}
                  </label>

                  {!isForeignPlate ? (
                    <>
                      <div>
                        <label htmlFor="kenteken" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                            className="whitespace-nowrap border border-[#E8364E] bg-[#E8364E]/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#E8364E] transition-colors hover:bg-[#E8364E]/20 disabled:opacity-50"
                          >
                            {rdwLoading ? '...' : t('offerte.lookupPlate')}
                          </button>
                        </div>
                        {rdwError && <p className="mt-1 text-xs text-[#E8364E]">{rdwError}</p>}
                        {errors.kenteken && <p className="mt-1 text-xs text-[#E8364E]">{errors.kenteken}</p>}
                      </div>

                      {vehicle && (
                        <div className="border border-green-900/30 bg-green-950/10 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
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
                          <label htmlFor="brand" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                          {errors.brand && <p className="mt-1 text-xs text-[#E8364E]">{errors.brand}</p>}
                        </div>
                        <div>
                          <label htmlFor="model" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                          <label htmlFor="year" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                          <label htmlFor="colour" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                        <label htmlFor="foreignKenteken" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                      <label htmlFor="vin" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                      <label htmlFor="paintCode" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                        {t('offerte.paintCode')}
                      </label>
                      <input
                        id="paintCode"
                        type="text"
                        value={form.paint_code}
                        onChange={e => handleChange('paint_code', e.target.value)}
                        className={inputClasses}
                      />
                      <p className="mt-1 text-[10px] text-white/30">{t('offerte.paintCodeHint')}</p>
                    </div>
                  </div>
                </div>

                {/* --- Service type --- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E8364E]">
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
                  {errors.service && <p className="text-xs text-[#E8364E]">{errors.service}</p>}
                </div>

                {/* --- Repair location --- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
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
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E8364E]">
                    {t('offerte.contactSection')}
                  </h3>
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                      {t('offerte.name')} *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      className={inputClasses}
                    />
                    {errors.name && <p className="mt-1 text-xs text-[#E8364E]">{errors.name}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                        {t('offerte.email')}
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className={inputClasses}
                      />
                      {errors.email && <p className="mt-1 text-xs text-[#E8364E]">{errors.email}</p>}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                  <label htmlFor="damage" className="block text-xs font-semibold uppercase tracking-wider text-white/50">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                    {t('offerte.photos')} ({files.length}/{MAX_FILES})
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="group relative h-20 w-20 overflow-hidden border border-ck-border">
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
                      </div>
                    ))}
                    {files.length < MAX_FILES && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex h-20 w-20 items-center justify-center border border-dashed border-white/20 text-white/30 transition-colors hover:border-[#E8364E]/50 hover:text-[#E8364E]"
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
                  <p className="mt-1 text-[10px] text-white/30">{t('offerte.photosHint')}</p>
                </div>

                {status === 'error' && (
                  <p className="text-sm text-[#E8364E]">{t('offerte.error')}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-[#E8364E] px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44] disabled:opacity-50"
                >
                  {status === 'sending' ? t('offerte.submitting') : t('offerte.submit')}
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-px bg-ck-border lg:col-span-2">
            <div className="bg-ck-dark p-8 sm:p-12">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
                {t('contact.infoTitle')}
              </h2>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('contact.address')}
                  </p>
                  <p className="mt-2 text-sm text-white">{t('footer.address')}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('contact.phone')}
                  </p>
                  <a
                    href="tel:+31681631020"
                    className="mt-2 block font-heading text-2xl font-bold text-white transition-colors hover:text-[#E8364E]"
                  >
                    {t('footer.phone')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('contact.email')}
                  </p>
                  <a
                    href="mailto:info@colourking.nl"
                    className="mt-2 block text-sm text-white transition-colors hover:text-[#E8364E]"
                  >
                    {t('footer.email')}
                  </a>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {t('footer.hours')}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-white/60">
                    <p>{t('footer.hoursWeekdays')}</p>
                    <p>{t('footer.hoursSaturday')}</p>
                    <p>{t('footer.hoursSunday')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-48 items-center justify-center bg-ck-dark lg:flex-1">
              <p className="text-xs text-white/30">{t('contact.mapPlaceholder')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
