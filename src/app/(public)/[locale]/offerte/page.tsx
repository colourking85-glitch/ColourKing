'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import CarDamagePicker from '@/modules/public/CarDamagePicker';
import DamageAssessment from '@/modules/public/DamageAssessment';

const MIN_PHOTOS = 3;
const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

type IntentType = 'quote' | 'insurance' | 'lease';

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
  const searchParams = useSearchParams();

  const [intent, setIntent] = useState<IntentType>('quote');
  const [insurerName, setInsurerName] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [leaseCompany, setLeaseCompany] = useState('');
  const [leaseContract, setLeaseContract] = useState('');
  const [slaHours, setSlaHours] = useState(0);

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
  const [photoGuideOpen, setPhotoGuideOpen] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  useEffect(() => {
    const preKenteken = searchParams.get('kenteken');
    if (preKenteken) {
      setForm(prev => ({ ...prev, kenteken: preKenteken.toUpperCase() }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/public/ai-config')
      .then(r => r.json())
      .then(data => {
        setAiEnabled(data.photo_check_enabled === true);
        setAiChecked(data.photo_check_enabled === true);
      })
      .catch(() => {});
    fetch('/api/public/site-config')
      .then(r => r.json())
      .then(data => {
        if (data.certifications?.response_sla_hours > 0) {
          setSlaHours(data.certifications.response_sla_hours);
        }
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
    if (!form.email.trim()) {
      e.email = t('offerte.requiredField');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
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
    if (!form.damage.trim()) {
      e.damage = t('offerte.requiredField');
    } else if (form.damage.trim().length < 10) {
      e.damage = t('offerte.damageMinLength');
    }
    if (files.length < MIN_PHOTOS) {
      e.photos = t('offerte.photosRequiredError');
    }
    if (!privacyConsent) {
      e.privacy = t('offerte.privacyRequired');
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
          intent,
          insurer_name: intent === 'insurance' ? insurerName || undefined : undefined,
          claim_number: intent === 'insurance' ? claimNumber || undefined : undefined,
          lease_company: intent === 'lease' ? leaseCompany || undefined : undefined,
          lease_contract: intent === 'lease' ? leaseContract || undefined : undefined,
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
    `cursor-pointer border px-4 py-3.5 text-xs font-medium transition-colors ${
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
        <div className="mx-auto max-w-7xl space-y-px">
          <div className="bg-ck-bg p-8 sm:p-12">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
              {t('offerte.formTitle')}
            </h2>

            {status === 'success' ? (
              <div className="mt-8 border border-green-900/30 bg-green-950/20 p-6">
                <p className="text-sm text-green-400">{t('offerte.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* --- Intent selector --- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-red">
                    {t('offerte.intentSection')}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(['quote', 'insurance', 'lease'] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIntent(key)}
                        className={`border p-4 text-left transition-colors ${
                          intent === key
                            ? 'border-ck-red bg-ck-red/10'
                            : 'border-ck-border bg-ck-bg hover:border-ck-border-2'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${intent === key ? 'text-ck-red' : 'text-ck-text'}`}>
                          {t(`offerte.intent_${key}`)}
                        </p>
                        <p className="mt-1 text-xs text-ck-text-muted">
                          {t(`offerte.intent${key.charAt(0).toUpperCase() + key.slice(1)}Desc`)}
                        </p>
                      </button>
                    ))}
                  </div>

                  {intent === 'insurance' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="insurerName" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                          {t('offerte.insurerName')}
                        </label>
                        <input
                          id="insurerName"
                          type="text"
                          value={insurerName}
                          onChange={(e) => setInsurerName(e.target.value)}
                          placeholder={t('offerte.insurerNamePlaceholder')}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label htmlFor="claimNumber" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                          {t('offerte.claimNumber')}
                        </label>
                        <input
                          id="claimNumber"
                          type="text"
                          value={claimNumber}
                          onChange={(e) => setClaimNumber(e.target.value)}
                          placeholder={t('offerte.claimNumberPlaceholder')}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  )}

                  {intent === 'lease' && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="leaseCompany" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                          {t('offerte.leaseCompany')}
                        </label>
                        <input
                          id="leaseCompany"
                          type="text"
                          value={leaseCompany}
                          onChange={(e) => setLeaseCompany(e.target.value)}
                          placeholder={t('offerte.leaseCompanyPlaceholder')}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label htmlFor="leaseContract" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                          {t('offerte.leaseContract')}
                        </label>
                        <input
                          id="leaseContract"
                          type="text"
                          value={leaseContract}
                          onChange={(e) => setLeaseContract(e.target.value)}
                          placeholder={t('offerte.leaseContractPlaceholder')}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* --- Vehicle identification --- */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-red">
                    {t('offerte.vehicleSection')}
                  </h3>

                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-xs text-ck-text-muted">
                    <input
                      type="checkbox"
                      checked={isForeignPlate}
                      onChange={() => {
                        setIsForeignPlate(!isForeignPlate);
                        setVehicle(null);
                        setRdwError('');
                      }}
                      className="h-4 w-4 accent-ck-red"
                    />
                    {t('offerte.foreignPlate')}
                  </label>

                  {!isForeignPlate ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-3">
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
                    </>
                  )}
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

                {/* --- Repair location (visual car picker) --- */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-text-muted">
                    {t('offerte.locationSection')}
                  </h3>
                  <CarDamagePicker
                    selected={repairLocations}
                    onToggle={toggleLocation}
                  />
                </div>

                {/* --- Damage description --- */}
                <div>
                  <label htmlFor="damage" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                    {t('offerte.damageDescription')} <span className="text-ck-red">*</span>
                  </label>
                  <textarea
                    id="damage"
                    rows={4}
                    value={form.damage}
                    onChange={e => handleChange('damage', e.target.value)}
                    className={`${inputClasses} resize-none`}
                  />
                  {errors.damage && <p className="mt-1 text-xs text-ck-red">{errors.damage}</p>}
                </div>

                {/* --- AI damage assessment --- */}
                <DamageAssessment locale={locale as string} />

                {/* --- Photo guide --- */}
                <div className="border border-ck-border/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPhotoGuideOpen(!photoGuideOpen)}
                    className="flex w-full items-center justify-between gap-2 bg-ck-surface/50 px-4 py-3 text-left transition-colors hover:bg-ck-surface"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ck-red">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 4.5v4M8 10.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {t('offerte.photoGuideTitle')}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" className={`text-ck-text-muted transition-transform ${photoGuideOpen ? 'rotate-180' : ''}`}>
                      <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </button>

                  {photoGuideOpen && (
                    <div className="border-t border-ck-border/50 bg-ck-surface/30 px-4 py-5 space-y-5">
                      <p className="text-xs text-ck-text-muted leading-relaxed">
                        {t('offerte.photoGuideIntro')}
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          { img: '/images/photo-guide/good-lighting.svg', good: true, tip: 'photoGuideTip1' },
                          { img: '/images/photo-guide/good-angles.svg', good: true, tip: 'photoGuideTip2' },
                          { img: '/images/photo-guide/good-closeup.svg', good: true, tip: 'photoGuideTip3' },
                          { img: '/images/photo-guide/bad-dark.svg', good: false, tip: 'photoGuideTip4' },
                          { img: '/images/photo-guide/bad-far.svg', good: false, tip: 'photoGuideTip5' },
                          { img: '/images/photo-guide/bad-blurry.svg', good: false, tip: 'photoGuideTip6' },
                        ].map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="relative aspect-[4/3] border border-ck-border/30 overflow-hidden bg-[#1a1f2e]">
                              {/* Replace SVG src with real photo path (e.g. /images/photo-guide/good-lighting.jpg) */}
                              <img
                                src={item.img}
                                alt={t(`offerte.${item.tip}`)}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className={`text-[11px] font-semibold ${item.good ? 'text-green-400' : 'text-red-400'}`}>
                                {item.good ? t('offerte.photoGuideGood') : t('offerte.photoGuideBad')}
                              </p>
                              <p className="text-[10px] text-ck-text-faint leading-relaxed">
                                {t(`offerte.${item.tip}`)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {/* END: to swap in real photos, replace .svg paths above with .jpg/.png */}
                      </div>

                      <div className="border-t border-ck-border/30 pt-4">
                        <p className="text-[10px] text-ck-text-faint leading-relaxed">
                          {t('offerte.photoGuideNote')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- Photos (required) --- */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                      {t('offerte.photosRequired')} ({files.length}/{MAX_FILES}) <span className="text-ck-red">*</span>
                    </label>
                    {aiEnabled && (
                      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-xs text-ck-text-muted">
                        <input
                          type="checkbox"
                          checked={aiChecked}
                          onChange={() => setAiChecked(!aiChecked)}
                          className="h-4 w-4 accent-ck-red"
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
                  {errors.photos && <p className="mt-1 text-xs text-ck-red">{errors.photos}</p>}
                </div>

                {/* --- Contact details --- */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ck-red">
                    {t('offerte.contactSection')}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('offerte.name')} <span className="text-ck-red">*</span>
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
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
                        {t('offerte.email')} <span className="text-ck-red">*</span>
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

                {/* --- Privacy consent --- */}
                <div className={`border rounded-lg p-4 transition-colors ${privacyConsent ? 'border-green-500/40 bg-green-500/5' : errors.privacy ? 'border-ck-red/40 bg-ck-red/5' : 'border-ck-border/30 bg-ck-bg-raised/30'}`}>
                  <label className="flex items-start gap-4 cursor-pointer">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={privacyConsent}
                        onChange={() => {
                          setPrivacyConsent(!privacyConsent);
                          if (errors.privacy) setErrors(prev => { const n = { ...prev }; delete n.privacy; return n; });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-6 h-6 border-2 border-ck-border/50 rounded transition-colors peer-checked:border-green-500 peer-checked:bg-green-500 flex items-center justify-center">
                        {privacyConsent && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-ck-text-muted leading-relaxed">
                      {t('offerte.privacyConsent')} <span className="text-ck-red">*</span>
                    </span>
                  </label>
                  {errors.privacy && <p className="mt-2 ml-10 text-xs text-ck-red">{errors.privacy}</p>}
                </div>

                {status === 'error' && (
                  <p className="text-sm text-ck-red">{t('offerte.error')}</p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-ck-red px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover disabled:opacity-50"
                  >
                    {status === 'sending' ? t('offerte.submitting') : t('offerte.submitDefault')}
                  </button>
                  {slaHours > 0 && (
                    <p className="mt-2 text-center text-xs text-ck-text-muted">
                      {t('offerte.submitSla', { hours: slaHours })}
                    </p>
                  )}
                  <p className="mt-4 text-center text-sm text-ck-text-muted">
                    {t('offerte.bookAppointment')}{' '}
                    <a
                      href={`/${locale}/afspraak`}
                      className="font-semibold text-ck-red transition-colors hover:text-ck-red-hover"
                    >
                      {t('booking.title')}
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>

          <div className="grid gap-px bg-ck-border lg:grid-cols-2">
            <div className="bg-ck-bg p-8 sm:p-12">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
                {t('contact.infoTitle')}
              </h2>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
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
                    className="mt-2 block font-heading text-xl font-bold text-ck-text transition-colors hover:text-ck-red"
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

            <div className="bg-ck-bg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2462.5!2d4.4851!3d51.8925!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c434a3a7a08d7d%3A0x5e6a4a4a5e6a4a4a!2sSatijnbloem%206%2C%203068%20JP%20Rotterdam!5e0!3m2!1snl!2snl!4v1"
                className="h-full min-h-[280px] w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Colourking location"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
