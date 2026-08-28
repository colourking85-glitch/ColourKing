'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { PhotoCapture } from '@/components/ui/PhotoCapture';
import { STATUS_LABELS, type InsStatus } from '@/modules/inspectie/machine';
import { GUIDED_SHOTS, getShotProgress, type ShotKey } from '@/modules/inspectie/checklist';
import { suggestHours } from '@/modules/inspectie/suggest-hours';

// ──────── types ────────

type Vehicle = {
  id: string;
  kenteken: string | null;
  make: string | null;
  model: string | null;
  colour: string | null;
  year: number | null;
  customer_id: string;
  customers: { id: string; name: string } | null;
};

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type Component = {
  key: string;
  name_nl: string;
  name_en: string | null;
  name_tr: string | null;
  zone: string;
  panel_group: string;
  paintable: boolean;
  panel_size: string;
  sort_order: number;
  active: boolean;
};

type DamageType = {
  code: string;
  name_nl: string;
  name_en: string | null;
  name_tr: string | null;
  implies_paint: boolean;
  sort_order: number;
};

type Finding = {
  id: string;
  reference: string;
  sequence_no: number;
  component_key: string;
  sub_location: string | null;
  damage_types: string[];
  severity: number;
  origin: string;
  disposition: string;
  repair_hours: number;
  repair_technique: string | null;
  paint_required: boolean;
  paint_operation: string | null;
  paint_hours: number;
  blend_components: string[];
  hidden_damage_possible: boolean;
  hidden_damage_note: string | null;
  adas_possible: boolean;
  description: string | null;
  ins_finding_parts: FindingPart[];
};

type FindingPart = {
  id: string;
  description: string;
  part_number: string | null;
  qty: number;
  unit_price_cents: number | null;
  source: string;
};

type Photo = {
  id: string;
  reference: string;
  shot_key: string | null;
  kind: string;
  finding_id: string | null;
  caption: string | null;
};

type Inspection = {
  id: string;
  reference: string;
  status: InsStatus;
  purpose: string;
  vehicle_id: string;
  customer_id: string | null;
  licence_plate: string;
  vin: string | null;
  make: string | null;
  model: string | null;
  first_reg_date: string | null;
  fuel: string | null;
  odometer_km: number | null;
  rdw_verified: boolean;
  event_date: string | null;
  event_description: string | null;
  insurer_name: string | null;
  claim_number: string | null;
  finding_count: number;
  photo_count: number;
  total_hours: number | null;
  indicative_total_cents: number | null;
  ins_findings: Finding[];
  ins_photos: Photo[];
};

// ──────── constants ────────

const STEP_TITLE_KEYS = ['wizard.stepVehicle', 'wizard.stepPhotos', 'wizard.stepDamage', 'wizard.stepPreExistent', 'wizard.stepRepairPlan', 'wizard.stepCheck', 'wizard.stepApproval'] as const;
const STEP_KEYS = ['voertuig', 'fotos', 'schade', 'preexistent', 'herstelplan', 'controle', 'akkoord'] as const;
type StepKey = typeof STEP_KEYS[number];

const PURPOSES = ['particulier', 'verzekering', 'intern'] as const;
const PURPOSE_LABEL_KEYS: Record<string, string> = { particulier: 'wizard.purposePrivate', verzekering: 'wizard.purposeInsurance', intern: 'wizard.purposeInternal' };

const SEVERITY_KEYS = [
  { value: 1, labelKey: 'wizard.severityLight', bar: '●○○○' },
  { value: 2, labelKey: 'wizard.severityModerate', bar: '●●○○' },
  { value: 3, labelKey: 'wizard.severityHeavy', bar: '●●●○' },
  { value: 4, labelKey: 'wizard.severityVeryHeavy', bar: '●●●●' },
];

const DISPOSITIONS = ['herstellen', 'vervangen', 'onderzoeken', 'geen_actie'] as const;
const DISP_LABEL_KEYS: Record<string, string> = {
  herstellen: 'wizard.dispRepair', vervangen: 'wizard.dispReplace',
  onderzoeken: 'wizard.dispInvestigate', geen_actie: 'wizard.dispNoAction',
};

const TECHNIQUES = [
  { value: 'uitdeuken', labelKey: 'wizard.techDent' },
  { value: 'uitdeuken_plamuren', labelKey: 'wizard.techDentFill' },
  { value: 'richten', labelKey: 'wizard.techAlign' },
  { value: 'demontage_montage', labelKey: 'wizard.techDismount' },
  { value: 'polijsten', labelKey: 'wizard.techPolish' },
  { value: 'nader_onderzoeken', labelKey: 'wizard.techFurtherInv' },
];

const PAINT_OPS = [
  { value: '', labelKey: 'wizard.paintNone' },
  { value: 'spot', labelKey: 'wizard.paintSpot' },
  { value: 'paneel', labelKey: 'wizard.paintPanel' },
  { value: 'paneel_inspuiten', labelKey: 'wizard.paintPanelBlend' },
  { value: 'polijsten_lak', labelKey: 'wizard.paintPolish' },
];

const ZONES = ['voor', 'achter', 'links', 'rechts', 'dak', 'glas', 'wielen', 'interieur'] as const;
const ZONE_LABEL_KEYS: Record<string, string> = {
  voor: 'wizard.zoneFront', achter: 'wizard.zoneRear', links: 'wizard.zoneLeft',
  rechts: 'wizard.zoneRight', dak: 'wizard.zoneRoof', glas: 'wizard.zoneGlass',
  wielen: 'wizard.zoneWheels', interieur: 'wizard.zoneInterior',
};

const RATES_CENTS = { plaat: 7800, spuit: 8200, voor: 6800 };

const FLAG_SVG: Record<string, React.ReactNode> = {
  NL: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="30" height="7" fill="#AE1C28"/><rect y="7" width="30" height="7" fill="#FFF"/><rect y="14" width="30" height="6" fill="#21468B"/></svg>,
  BE: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="10" height="20" fill="#2D2926"/><rect x="10" width="10" height="20" fill="#FDDA24"/><rect x="20" width="10" height="20" fill="#EF3340"/></svg>,
  DE: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="30" height="7" fill="#000"/><rect y="7" width="30" height="7" fill="#DD0000"/><rect y="14" width="30" height="6" fill="#FFCC00"/></svg>,
  FR: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#FFF"/><rect x="20" width="10" height="20" fill="#ED2939"/></svg>,
  LU: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="30" height="7" fill="#EF3340"/><rect y="7" width="30" height="7" fill="#FFF"/><rect y="14" width="30" height="6" fill="#00A3E0"/></svg>,
  AT: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="30" height="7" fill="#ED2939"/><rect y="7" width="30" height="7" fill="#FFF"/><rect y="14" width="30" height="6" fill="#ED2939"/></svg>,
  PL: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="30" height="10" fill="#FFF"/><rect y="10" width="30" height="10" fill="#DC143C"/></svg>,
  IT: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#FFF"/><rect x="20" width="10" height="20" fill="#CE2B37"/></svg>,
  ES: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="30" height="5" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/><rect y="15" width="30" height="5" fill="#AA151B"/></svg>,
  TR: <svg viewBox="0 0 30 20" className="h-5 w-7 rounded-[3px] shadow-sm"><rect width="30" height="20" fill="#E30A17"/><circle cx="12" cy="10" r="5" fill="#FFF"/><circle cx="13.5" cy="10" r="4" fill="#E30A17"/><polygon points="16,10 18,7 15.5,9 18,13 15.5,11" fill="#FFF" transform="translate(-0.5,0)"/></svg>,
};

const COUNTRIES = [
  { code: 'NL', label: 'Netherlands' },
  { code: 'BE', label: 'Belgium' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'LU', label: 'Luxembourg' },
  { code: 'AT', label: 'Austria' },
  { code: 'PL', label: 'Poland' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'TR', label: 'Turkey' },
] as const;

type Brand = { id: string; name: string };
type Model = { id: string; name: string };

const num = (n: number) => n.toFixed(1).replace('.', ',');
const eur = (cents: number) => '€ ' + Math.round(cents / 100).toLocaleString('nl-NL');

const CHECKLIST_KEYS = [
  { titleKey: 'wizard.checkPlate', check: 'plate' },
  { titleKey: 'wizard.checkOdometer', check: 'odo' },
  { titleKey: 'wizard.checkTenPhotos', check: 'photos' },
  { titleKey: 'wizard.checkDamageRecorded', check: 'findings' },
  { titleKey: 'wizard.checkPhotoPerFinding', check: 'findingPhotos' },
  { titleKey: 'wizard.checkHoursPerFinding', check: 'hours' },
  { titleKey: 'wizard.checkPartsForReplace', check: 'parts' },
] as const;

// ──────── chip style helper ────────

const chipStyle = (on: boolean, extra: React.CSSProperties = {}): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 6, minHeight: 40,
  padding: '8px 12px', border: `1px solid ${on ? 'var(--ck-red)' : 'var(--ck-dark-border)'}`,
  borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: 13,
  background: on ? 'rgba(239,68,68,0.08)' : 'var(--ck-dark-card)',
  color: on ? 'var(--ck-red)' : 'var(--ck-muted-light)',
  ...extra,
});

// ──────── main component ────────

export default function InspectieNieuwPage() {
  const router = useRouter();
  const t = useTranslations('in');

  // wizard state
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inspection, setInspection] = useState<Inspection | null>(null);

  // step 1: vehicle
  const [plate, setPlate] = useState('');
  const [plateCountry, setPlateCountry] = useState('NL');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isForeignPlate, setIsForeignPlate] = useState(false);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwData, setRdwData] = useState<Record<string, string> | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purpose, setPurpose] = useState<typeof PURPOSES[number]>('particulier');
  const [odometer, setOdometer] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [insurerName, setInsurerName] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [vin, setVin] = useState('');
  const [manualMake, setManualMake] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualColour, setManualColour] = useState('');
  const [manualPaintCode, setManualPaintCode] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');

  // step 2: photos
  const [activeShot, setActiveShot] = useState(0);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  // step 3+4: findings
  const [components, setComponents] = useState<Component[]>([]);
  const [damageTypes, setDamageTypes] = useState<DamageType[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [editingFinding, setEditingFinding] = useState<Partial<Finding> | null>(null);

  // step 7: approval
  const [signMode, setSignMode] = useState<'tablet' | 'remote'>('tablet');
  const [signName, setSignName] = useState('');
  const [signRecipient, setSignRecipient] = useState('');

  // ──── data loading ────

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles).catch(() => {});
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {});
    fetch('/api/inspections/catalog/components').then(r => r.json()).then(setComponents).catch(() => {});
    fetch('/api/inspections/catalog/damage-types').then(r => r.json()).then(setDamageTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (isForeignPlate && brands.length === 0) {
      fetch('/api/vehicle-brands').then(r => r.json()).then(setBrands).catch(() => {});
    }
  }, [isForeignPlate, brands.length]);

  useEffect(() => {
    if (!selectedBrandId) { setModels([]); return; }
    fetch(`/api/vehicle-brands/${selectedBrandId}/models`).then(r => r.json()).then(setModels).catch(() => setModels([]));
  }, [selectedBrandId]);

  // ──── derived ────

  const findings = inspection?.ins_findings ?? [];
  const photos = inspection?.ins_photos ?? [];
  const schadeFindings = findings.filter(f => f.origin === 'schade');
  const preFindings = findings.filter(f => f.origin === 'pre_existent');
  const capturedShotKeys = photos.filter(p => p.shot_key).map(p => p.shot_key!);
  const shotProgress = getShotProgress(capturedShotKeys);

  const repairTotal = useMemo(() => schadeFindings.reduce((a, f) => a + f.repair_hours, 0), [schadeFindings]);
  const paintTotal = useMemo(() => schadeFindings.reduce((a, f) => a + f.paint_hours, 0), [schadeFindings]);
  const partCount = useMemo(() => schadeFindings.reduce((a, f) => a + (f.ins_finding_parts?.length ?? 0), 0), [schadeFindings]);
  const prepHours = Math.round(paintTotal * 0.55 * 10) / 10;
  const indicativeMoneyCents = Math.round(repairTotal * RATES_CENTS.plaat + paintTotal * RATES_CENTS.spuit + prepHours * RATES_CENTS.voor);

  const stepKey = STEP_KEYS[step];
  const isPreStep = stepKey === 'preexistent';
  const currentFindings = isPreStep ? preFindings : schadeFindings;

  const selFinding = currentFindings.find(f => f.id === selectedFindingId) || currentFindings[0] || null;

  // ──── issues for right sidebar ────

  const issues = useMemo(() => {
    if (!inspection) return [];
    const list: { text: string; where: string; step: number; block: boolean }[] = [];
    if (!odometer && !inspection.odometer_km) list.push({ text: t('wizard.issueOdometerMissing'), where: `${t('wizard.stepOf', { current: 1 })} · ${t('wizard.stepVehicle')}`, step: 0, block: true });
    const missingShots = GUIDED_SHOTS.filter(s => s.required && !capturedShotKeys.includes(s.key)).length;
    if (missingShots) list.push({ text: t('wizard.issueMissingShots', { count: missingShots }), where: `${t('wizard.stepOf', { current: 2 })} · ${t('wizard.stepPhotos')}`, step: 1, block: true });
    if (!schadeFindings.length) list.push({ text: t('wizard.issueNoDamage'), where: `${t('wizard.stepOf', { current: 3 })} · ${t('wizard.stepDamage')}`, step: 2, block: true });
    const noPhoto = schadeFindings.filter(f => !photos.some(p => p.finding_id === f.id));
    if (noPhoto.length) list.push({ text: t('wizard.issueFindingsNoPhoto', { count: noPhoto.length }), where: noPhoto.map(f => f.reference).join(' '), step: 2, block: true });
    const noHours = schadeFindings.filter(f => f.disposition === 'herstellen' && f.repair_hours === 0 && f.paint_hours === 0);
    if (noHours.length) list.push({ text: t('wizard.issueFindingsNoHours', { count: noHours.length }), where: noHours.map(f => f.reference).join(' '), step: 4, block: true });
    const noPart = schadeFindings.filter(f => f.disposition === 'vervangen' && (!f.ins_finding_parts || f.ins_finding_parts.length === 0));
    if (noPart.length) list.push({ text: t('wizard.issueReplaceNoPart', { count: noPart.length }), where: noPart.map(f => f.reference).join(' '), step: 2, block: false });
    return list;
  }, [inspection, odometer, capturedShotKeys, schadeFindings, photos, t]);

  const blockingIssues = issues.filter(i => i.block).length;

  // ──── checklist checks ────

  const checkResults = useMemo(() => {
    const noPhoto = schadeFindings.filter(f => !photos.some(p => p.finding_id === f.id));
    const noHours = schadeFindings.filter(f => f.disposition === 'herstellen' && f.repair_hours === 0 && f.paint_hours === 0);
    const noPart = schadeFindings.filter(f => f.disposition === 'vervangen' && (!f.ins_finding_parts || f.ins_finding_parts.length === 0));
    const missingShots = GUIDED_SHOTS.filter(s => s.required && !capturedShotKeys.includes(s.key));
    return CHECKLIST_KEYS.map(c => {
      const base = { titleKey: c.titleKey, check: c.check };
      switch (c.check) {
        case 'plate': return { ...base, ok: !!(plate || inspection?.licence_plate), detail: plate || inspection?.licence_plate || t('wizard.detailMissing'), warn: false };
        case 'odo': return { ...base, ok: !!(odometer || inspection?.odometer_km), detail: odometer || String(inspection?.odometer_km || '') || t('wizard.detailMissing'), warn: false };
        case 'photos': return { ...base, ok: missingShots.length === 0, detail: missingShots.length ? missingShots.map(s => s.label.nl).join(', ') : t('wizard.detailPhotosComplete'), warn: false };
        case 'findings': return { ...base, ok: schadeFindings.length > 0, detail: t('wizard.detailFindingsInOrder', { count: schadeFindings.length }), warn: false };
        case 'findingPhotos': return { ...base, ok: noPhoto.length === 0, detail: noPhoto.length ? noPhoto.map(f => f.reference).join(' · ') : t('wizard.detailEveryFindingHasPhoto'), warn: false };
        case 'hours': return { ...base, ok: noHours.length === 0, detail: noHours.length ? noHours.map(f => f.reference).join(' · ') + ' ' + t('wizard.detailWithoutHours') : `${num(repairTotal)} ${t('wizard.labelBodyworkHours')} · ${num(paintTotal)} ${t('wizard.labelPaintHours')}`, warn: false };
        case 'parts': return { ...base, ok: noPart.length === 0, detail: noPart.length ? noPart.map(f => f.reference).join(' · ') : t('wizard.detailAllPartsSpecified'), warn: true };
        default: return { ...base, ok: false, detail: '', warn: false };
      }
    });
  }, [plate, odometer, inspection, capturedShotKeys, schadeFindings, photos, repairTotal, paintTotal, t]);

  // ──── RDW lookup ────

  const lookupRdw = useCallback(async () => {
    if (!plate.trim()) return;
    setRdwLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/rdw?kenteken=${encodeURIComponent(plate)}`);
      if (!res.ok) { setError(t('wizard.errorPlateNotFound')); setRdwData(null); return; }
      const data = await res.json();
      setRdwData(data);
      const checkRes = await fetch(`/api/vehicles/check-kenteken?kenteken=${encodeURIComponent(plate)}`);
      const checkData = await checkRes.json();
      if (checkData.exists && checkData.vehicles?.length) {
        const match = vehicles.find(v => v.id === checkData.vehicles[0].id);
        if (match) setSelectedVehicle(match);
      }
    } catch { setError(t('wizard.errorRdwFailed')); }
    finally { setRdwLoading(false); }
  }, [plate, vehicles, t]);

  // ──── reload ────

  const reloadInspection = useCallback(async (id: string) => {
    const res = await fetch(`/api/inspections/${id}`);
    if (res.ok) setInspection(await res.json());
  }, []);

  // ──── create inspection ────

  const createInspection = useCallback(async () => {
    if (!isForeignPlate && !selectedVehicle && !rdwData) { setError(t('wizard.errorSelectVehicle')); return false; }
    if (isForeignPlate && !manualMake) { setError(t('wizard.errorSelectVehicle')); return false; }
    setSaving(true); setError('');
    try {
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      const selectedMdl = models.find(m => m.id === selectedModelId);
      const body = {
        vehicle_id: selectedVehicle?.id || null,
        customer_id: selectedCustomer?.id || selectedVehicle?.customer_id || null,
        purpose,
        licence_plate: plate.trim().toUpperCase() || selectedVehicle?.kenteken || '',
        vin: vin || null,
        make: isForeignPlate ? (selectedBrand?.name || manualMake) : (rdwData?.make || selectedVehicle?.make || null),
        model: isForeignPlate ? (selectedMdl?.name || manualModel) : (rdwData?.model || selectedVehicle?.model || null),
        first_reg_date: isForeignPlate ? (manualYear ? `${manualYear}-01-01` : null) : (rdwData?.year ? `${rdwData.year}-01-01` : (selectedVehicle?.year ? `${selectedVehicle.year}-01-01` : null)),
        fuel: rdwData?.fuel || null,
        odometer_km: odometer ? parseInt(odometer, 10) : null,
        rdw_verified: !isForeignPlate && !!rdwData,
        rdw_payload: isForeignPlate ? null : (rdwData || null),
        event_date: eventDate || null,
        event_description: eventDesc || null,
        insurer_name: purpose === 'verzekering' ? insurerName || null : null,
        claim_number: purpose === 'verzekering' ? claimNumber || null : null,
        plate_country: plateCountry,
        colour: isForeignPlate ? manualColour || null : (rdwData?.colour || selectedVehicle?.colour || null),
        paint_code: isForeignPlate ? manualPaintCode || null : null,
      };
      const res = await fetch('/api/inspections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || t('wizard.errorCreateFailed')); }
      const ins = await res.json();
      await reloadInspection(ins.id);
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : t('wizard.errorCreateFailed')); return false; }
    finally { setSaving(false); }
  }, [selectedVehicle, selectedCustomer, purpose, plate, vin, rdwData, odometer, eventDate, eventDesc, insurerName, claimNumber, reloadInspection, isForeignPlate, manualMake, manualModel, manualYear, manualColour, manualPaintCode, plateCountry, brands, selectedBrandId, models, selectedModelId, t]);

  // ──── finding CRUD ────

  const saveFinding = useCallback(async (finding: Partial<Finding> & { component_key: string; origin: string }) => {
    if (!inspection) return;
    setSaving(true); setError('');
    try {
      const body = { id: finding.id || crypto.randomUUID(), inspection_id: inspection.id, ...finding };
      const res = await fetch(`/api/inspections/${inspection.id}/findings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || t('wizard.errorSaveFailed')); }
      await reloadInspection(inspection.id);
      setEditingFinding(null);
      setShowPicker(false);
    } catch (err) { setError(err instanceof Error ? err.message : t('wizard.errorSaveFailed')); }
    finally { setSaving(false); }
  }, [inspection, reloadInspection, t]);

  const deleteFinding = useCallback(async (findingId: string) => {
    if (!inspection) return;
    setSaving(true);
    try {
      await fetch(`/api/inspections/${inspection.id}/findings/${findingId}`, { method: 'DELETE' });
      await reloadInspection(inspection.id);
      setSelectedFindingId(null);
      setEditingFinding(null);
    } catch { setError(t('wizard.errorDeleteFailed')); }
    finally { setSaving(false); }
  }, [inspection, reloadInspection, t]);

  // ──── submit ────

  const submitForApproval = useCallback(async () => {
    if (!inspection) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/inspections/${inspection.id}/transition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: 'TER_AKKOORD' }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || t('wizard.errorSubmitFailed')); }
      router.push(`/app/inspecties/${inspection.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : t('wizard.errorSubmitFailed')); }
    finally { setSaving(false); }
  }, [inspection, router, t]);

  // ──── navigation ────

  const canGoNext = useCallback(() => {
    if (step === 0) {
      if (isForeignPlate) return !!manualMake && !!plate.trim();
      return (!!selectedVehicle || !!rdwData) && !!plate.trim();
    }
    return true;
  }, [step, selectedVehicle, plate, isForeignPlate, manualMake, rdwData]);

  const goNext = useCallback(async () => {
    if (step === 0 && !inspection) {
      const ok = await createInspection();
      if (!ok) return;
    }
    if (step === 6) { await submitForApproval(); return; }
    setStep(s => Math.min(s + 1, 6));
    setError('');
  }, [step, inspection, createInspection, submitForApproval]);

  const goPrev = useCallback(() => { setStep(s => Math.max(s - 1, 0)); setError(''); }, []);

  // ──── filtered vehicles ────

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return vehicles.slice(0, 10);
    const q = vehicleSearch.toLowerCase();
    return vehicles.filter(v =>
      v.kenteken?.toLowerCase().includes(q) || v.make?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [vehicles, vehicleSearch]);

  // ──── grouped components for picker modal ────

  const componentGroups = useMemo(() => {
    const active = components.filter(c => c.active);
    const zones = Array.from(new Set(active.map(c => c.zone)));
    return zones.map(zone => ({
      zone,
      zoneKey: ZONE_LABEL_KEYS[zone] || '',
      items: active.filter(c => c.zone === zone).map(c => ({
        ...c,
        hasFinding: findings.some(f => f.component_key === c.key),
      })),
    }));
  }, [components, findings]);

  // ──── start new finding from picker ────

  const startNewFinding = useCallback((comp: Component) => {
    const origin = isPreStep ? 'pre_existent' : 'schade';
    const suggested = suggestHours({
      panelSize: comp.panel_size as 'xs' | 's' | 'm' | 'l' | 'xl',
      severity: 2,
      disposition: origin === 'pre_existent' ? 'geen_actie' : 'herstellen',
      paintRequired: comp.paintable,
      paintOperation: comp.paintable ? 'paneel' : null,
      damageTypes: [],
    });
    setEditingFinding({
      component_key: comp.key,
      sub_location: null,
      damage_types: [],
      severity: 2,
      origin,
      disposition: origin === 'pre_existent' ? 'geen_actie' : 'herstellen',
      repair_hours: suggested.repairHours,
      repair_technique: null,
      paint_required: comp.paintable,
      paint_operation: comp.paintable ? 'paneel' : null,
      paint_hours: suggested.paintHours,
      blend_components: [],
      hidden_damage_possible: false,
      hidden_damage_note: null,
      adas_possible: false,
      description: null,
    });
    setShowPicker(false);
  }, [isPreStep]);

  // ──── recalc hours helper ────

  const recalcHours = useCallback((finding: Partial<Finding>) => {
    const c = components.find(c => c.key === finding.component_key);
    if (!c) return;
    const suggested = suggestHours({
      panelSize: c.panel_size as 'xs' | 's' | 'm' | 'l' | 'xl',
      severity: finding.severity ?? 2,
      disposition: finding.disposition ?? 'herstellen',
      paintRequired: finding.paint_required ?? c.paintable,
      paintOperation: finding.paint_operation,
      damageTypes: finding.damage_types ?? [],
    });
    setEditingFinding(prev => prev ? { ...prev, repair_hours: suggested.repairHours, paint_hours: suggested.paintHours } : null);
  }, [components]);

  // helper: find technique label
  const techLabel = (val: string | null) => {
    if (!val) return '—';
    const found = TECHNIQUES.find(te => te.value === val);
    return found ? t(found.labelKey) : val;
  };

  const paintOpLabel = (val: string | null) => {
    if (!val) return t('wizard.paintNone');
    const found = PAINT_OPS.find(p => p.value === val);
    return found ? t(found.labelKey) : val;
  };

  const dispLabel = (val: string) => t(DISP_LABEL_KEYS[val] || 'wizard.dispRepair');

  // ════════════════════════════════
  //           R E N D E R
  // ════════════════════════════════

  return (
    <div className="-m-6 flex h-screen lg:h-[calc(100vh-48px)] flex-col overflow-hidden bg-ck-dark">

      {/* ═══ HEADER ═══ */}
      <header className="flex-none flex items-center gap-2 sm:gap-4 px-3 sm:px-5 h-[56px] sm:h-[60px] bg-ck-dark-card border-b border-ck-dark-border whitespace-nowrap overflow-x-auto">
        <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-md bg-ck-red text-white font-mono text-xs font-semibold">
          CK
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-semibold text-white truncate">{t('wizard.headerTitle')}</span>
          <span className="font-mono text-[11px] text-ck-muted truncate">
            {inspection ? `${inspection.reference} · ${STATUS_LABELS[inspection.status].nl.toLowerCase()}` : t('wizard.headerNewDraft')}
          </span>
        </div>

        {inspection && (
          <div className="hidden md:flex items-baseline gap-2 pl-4 ml-1 border-l border-ck-dark-border">
            <span className="text-sm font-semibold text-white">{inspection.make} {inspection.model}</span>
            {inspection.licence_plate && (
              <span className="font-mono text-xs px-1.5 py-0.5 border border-ck-dark-border rounded text-white">{inspection.licence_plate}</span>
            )}
            {inspection.odometer_km && (
              <span className="text-xs text-ck-muted">{inspection.odometer_km.toLocaleString('nl-NL')} km</span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {saving && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-ck-dark-surface px-3 py-1.5">
            <Loader2 size={12} className="animate-spin text-ck-muted" />
            <span className="text-xs font-medium text-ck-muted-light">{t('wizard.saving')}</span>
          </div>
        )}
        {!saving && inspection && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-ck-dark-surface px-3 py-1.5">
            <span className="h-[7px] w-[7px] rounded-full bg-ck-green" />
            <span className="text-xs font-medium text-ck-muted-light">{t('wizard.saved')}</span>
          </div>
        )}

        <button
          onClick={() => router.push('/app/inspecties')}
          className="flex-none rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-[13px] font-medium text-ck-muted-light hover:text-white"
        >
          {t('wizard.pauseInspection')}
        </button>
      </header>

      {/* ═══ MOBILE STEP BAR ═══ */}
      <div className="flex lg:hidden flex-none items-center gap-1 px-3 h-[44px] bg-ck-dark-card border-b border-ck-dark-border overflow-x-auto">
        {STEP_TITLE_KEYS.map((titleKey, i) => {
          const active = i === step;
          const done = i < step || (inspection !== null && i === 0);
          const isReachable = inspection ? true : i === 0;
          return (
            <button
              key={i}
              onClick={() => { if (isReachable) { setStep(i); setError(''); } }}
              disabled={!isReachable}
              className="flex-none flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={{
                background: active ? 'rgba(239,68,68,0.15)' : done ? 'rgba(74,222,128,0.08)' : 'transparent',
                color: active ? 'var(--ck-red)' : done ? 'var(--ck-green)' : isReachable ? 'var(--ck-muted-light)' : 'var(--ck-muted)',
                opacity: isReachable ? 1 : 0.35,
                border: active ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
              }}
            >
              <span className="font-mono text-[11px]">{i + 1}</span>
              <span className="hidden sm:inline">{t(titleKey)}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ BODY: 3-PANEL ═══ */}
      <div className="flex flex-1 min-h-0">

        {/* ─── LEFT SIDEBAR: STEPS ─── */}
        <nav className="hidden lg:flex w-[232px] flex-none flex-col bg-ck-dark-card border-r border-ck-dark-border">
          <div className="flex flex-col gap-0.5 p-3">
            {STEP_TITLE_KEYS.map((titleKey, i) => {
              const active = i === step;
              const done = i < step || (inspection !== null && i === 0);
              const isReachable = inspection ? true : i === 0;
              const count = i === 2 ? schadeFindings.length : i === 3 ? preFindings.length : i === 1 ? `${shotProgress.done}/${shotProgress.total}` : undefined;
              return (
                <button
                  key={i}
                  onClick={() => { if (isReachable) { setStep(i); setError(''); } }}
                  disabled={!isReachable}
                  className="flex items-center gap-2 w-full rounded-md px-2.5 text-left"
                  style={{
                    minHeight: 44,
                    background: active ? 'rgba(239,68,68,0.08)' : 'transparent',
                    cursor: isReachable ? 'pointer' : 'default',
                    opacity: isReachable ? 1 : 0.35,
                  }}
                >
                  <span className="w-[22px] font-mono text-[11px] font-medium" style={{ color: active ? 'var(--ck-red)' : isReachable ? 'var(--ck-muted)' : 'var(--ck-muted)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-left text-[13px]" style={{
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--ck-red)' : done ? 'white' : isReachable ? 'var(--ck-muted-light)' : 'var(--ck-muted)',
                  }}>
                    {t(titleKey)}
                  </span>
                  {count !== undefined && (
                    <span className="font-mono text-[11px]" style={{ color: active ? 'var(--ck-red)' : 'var(--ck-muted)' }}>
                      {count}
                    </span>
                  )}
                  {done && count === undefined && (
                    <span className="font-mono text-[11px] text-ck-muted">{t('wizard.stepDone')}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <div className="border-t border-ck-dark-border px-3 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('wizard.autoSavedTitle')}</span>
            <span className="block text-[11px] text-ck-muted mt-1">
              {inspection ? t('wizard.savedLocalAndServer') : t('wizard.draftNotSaved')}
            </span>
          </div>
        </nav>

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex flex-1 flex-col min-w-0 min-h-0">
          <div className="flex-1 overflow-auto p-3 sm:p-6 pb-10">

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* ═══ STEP 1: VOERTUIG ═══ */}
            {stepKey === 'voertuig' && (
              <div style={{ maxWidth: 820 }}>
                <h2 className="text-[24px] font-semibold text-white mb-1">{t('wizard.vehicleTitle')}</h2>
                <p className="text-[13px] text-ck-muted mb-6">{t('wizard.vehicleSubtitle')}</p>

                {/* Country prefix + Kenteken + RDW */}
                <div className="grid gap-3 sm:gap-4 items-end grid-cols-[60px_1fr] sm:grid-cols-[80px_220px_1fr]">
                  {/* Country picker */}
                  <div>
                    <label className="block text-[12px] text-ck-muted mb-1.5">&nbsp;</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="w-full flex items-center justify-center gap-1 rounded-lg border border-ck-dark-border bg-ck-dark-card px-2 py-2.5 text-sm font-medium text-white hover:border-ck-red"
                        style={{ minHeight: 48 }}
                      >
                        {FLAG_SVG[plateCountry]}
                        <span className="text-[10px] text-ck-muted">▼</span>
                      </button>
                      {showCountryPicker && (
                        <div className="absolute left-0 top-full z-20 mt-1 w-[220px] rounded-lg border border-ck-dark-border bg-ck-dark-card shadow-xl overflow-hidden">
                          {COUNTRIES.map(c => (
                            <button
                              key={c.code}
                              onClick={() => {
                                setPlateCountry(c.code);
                                setShowCountryPicker(false);
                                if (c.code !== 'NL') { setIsForeignPlate(true); setRdwData(null); setSelectedVehicle(null); }
                                else setIsForeignPlate(false);
                              }}
                              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm hover:bg-ck-dark-surface ${plateCountry === c.code ? 'bg-ck-red/10 text-ck-red' : 'text-white'}`}
                            >
                              {FLAG_SVG[c.code]}
                              <span>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plate input */}
                  <div>
                    <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelLicencePlate')}</label>
                    <input
                      type="text"
                      value={plate}
                      onChange={e => setPlate(e.target.value.toUpperCase())}
                      placeholder="XX-123-X"
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 font-mono text-lg font-semibold tracking-wider text-white uppercase placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
                      style={{ minHeight: 48 }}
                    />
                  </div>

                  {/* RDW button or foreign plate toggle */}
                  <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
                    {!isForeignPlate && plateCountry === 'NL' && (
                      <>
                        <button
                          onClick={lookupRdw}
                          disabled={rdwLoading || !plate.trim()}
                          className="rounded-lg bg-ck-red px-5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          style={{ minHeight: 48 }}
                        >
                          {rdwLoading ? t('wizard.rdwFetching') : t('wizard.rdwFetch')}
                        </button>
                        {rdwData && (
                          <span className="flex items-center gap-1.5 text-[12px] text-ck-green">
                            <span className="h-[7px] w-[7px] rounded-full bg-ck-green" />
                            {t('wizard.rdwVerified')}
                          </span>
                        )}
                        {!rdwData && !rdwLoading && plate.trim() && (
                          <span className="flex items-center gap-1.5 text-[12px] text-ck-muted">
                            <span className="h-[7px] w-[7px] rounded-full bg-ck-muted" />
                            {t('wizard.rdwNotFetched')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Foreign plate / manual entry toggle */}
                {plateCountry === 'NL' && (
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isForeignPlate}
                      onChange={e => { setIsForeignPlate(e.target.checked); if (e.target.checked) { setRdwData(null); setSelectedVehicle(null); } }}
                      className="h-4 w-4 rounded border-ck-dark-border accent-ck-red"
                    />
                    <span className="text-[13px] text-ck-muted-light">{t('wizard.foreignPlateToggle')}</span>
                  </label>
                )}

                {/* RDW result card */}
                {rdwData && !isForeignPlate && (
                  <div className="mt-6 rounded-lg border border-ck-dark-border bg-ck-dark-card p-4 grid gap-4 grid-cols-2 sm:grid-cols-3">
                    {[
                      [t('wizard.rdwMakeModel'), `${rdwData.make || ''} ${rdwData.model || ''}`.trim()],
                      [t('wizard.rdwFirstReg'), rdwData.year || '—'],
                      [t('wizard.rdwFuel'), rdwData.fuel || '—'],
                      ['VIN', vin || '—'],
                      [t('wizard.rdwColour'), rdwData.colour || '—'],
                      [t('wizard.rdwMass'), '—'],
                    ].map(([k, v]) => (
                      <div key={k as string}>
                        <span className="block text-[12px] text-ck-muted mb-1">{k}</span>
                        <span className="block text-sm font-medium text-white">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manual entry fields for foreign plates */}
                {isForeignPlate && (
                  <div className="mt-6 rounded-lg border border-ck-dark-border bg-ck-dark-card p-4 space-y-4">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelBrand')}</label>
                        <select
                          value={selectedBrandId}
                          onChange={e => { setSelectedBrandId(e.target.value); setSelectedModelId(''); const brand = brands.find(b => b.id === e.target.value); setManualMake(brand?.name || ''); }}
                          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm text-white focus:outline-none focus:border-ck-red"
                          style={{ minHeight: 48 }}
                        >
                          <option value="">{t('wizard.selectBrand')}</option>
                          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelModel')}</label>
                        <select
                          value={selectedModelId}
                          onChange={e => { setSelectedModelId(e.target.value); const mdl = models.find(m => m.id === e.target.value); setManualModel(mdl?.name || ''); }}
                          disabled={!selectedBrandId}
                          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm text-white focus:outline-none focus:border-ck-red disabled:opacity-50"
                          style={{ minHeight: 48 }}
                        >
                          <option value="">{t('wizard.selectModel')}</option>
                          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                      <div>
                        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelYear')}</label>
                        <input
                          type="text"
                          value={manualYear}
                          onChange={e => setManualYear(e.target.value)}
                          placeholder="2022"
                          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm font-mono text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
                          style={{ minHeight: 48 }}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelColour')}</label>
                        <input
                          type="text"
                          value={manualColour}
                          onChange={e => setManualColour(e.target.value)}
                          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
                          style={{ minHeight: 48 }}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelPaintCode')}</label>
                        <input
                          type="text"
                          value={manualPaintCode}
                          onChange={e => setManualPaintCode(e.target.value)}
                          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm font-mono text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
                          style={{ minHeight: 48 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelVin')}</label>
                      <input
                        type="text"
                        value={vin}
                        onChange={e => setVin(e.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm font-mono text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
                        style={{ minHeight: 48 }}
                      />
                    </div>
                  </div>
                )}

                {/* Vehicle selector (when no RDW data and not foreign) */}
                {!rdwData && !isForeignPlate && (
                  <div className="mt-6">
                    <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelSelectVehicle')}</label>
                    <input
                      type="text"
                      value={vehicleSearch}
                      onChange={e => setVehicleSearch(e.target.value)}
                      placeholder={t('wizard.placeholderSearchVehicle')}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-sm text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red mb-2"
                      style={{ minHeight: 48 }}
                    />
                    <div className="max-h-[200px] overflow-auto">
                      {filteredVehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVehicle(v);
                            if (v.kenteken) setPlate(v.kenteken);
                            if (v.customers) setSelectedCustomer({ ...v.customers, email: null, phone: null });
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                            selectedVehicle?.id === v.id ? 'bg-ck-red/10 border border-ck-red/30' : 'hover:bg-ck-dark-surface border border-transparent'
                          }`}
                        >
                          <span className="font-mono text-ck-muted-light">{v.kenteken || '—'}</span>
                          <span className="text-white">{v.make} {v.model}</span>
                          {v.customers && <span className="ml-auto text-xs text-ck-muted">{v.customers.name}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details grid */}
                <div className="grid gap-4 mt-6 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelOdometer')}</label>
                    <input
                      type="text"
                      value={odometer}
                      onChange={e => setOdometer(e.target.value)}
                      placeholder="84521"
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-sm font-mono text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
                      style={{ minHeight: 48 }}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelPurpose')}</label>
                    <div className="flex gap-1">
                      {PURPOSES.map(p => (
                        <button
                          key={p}
                          onClick={() => setPurpose(p)}
                          style={chipStyle(purpose === p, { flex: 1, justifyContent: 'center', minHeight: 48 })}
                        >
                          {t(PURPOSE_LABEL_KEYS[p])}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelDamageDate')}</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-sm text-white focus:outline-none focus:border-ck-red"
                      style={{ minHeight: 48 }}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelClaimNumber')}</label>
                    <input
                      type="text"
                      value={claimNumber}
                      onChange={e => setClaimNumber(e.target.value)}
                      placeholder={t('wizard.placeholderNotApplicable')}
                      className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-sm text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
                      style={{ minHeight: 48 }}
                    />
                  </div>
                </div>

                {/* Toedracht */}
                <div className="mt-4">
                  <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelCircumstances')}</label>
                  <textarea
                    value={eventDesc}
                    onChange={e => setEventDesc(e.target.value)}
                    className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-sm text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red resize-y"
                    style={{ minHeight: 88 }}
                  />
                </div>
              </div>
            )}

            {/* ═══ STEP 2: FOTO'S ═══ */}
            {stepKey === 'fotos' && inspection && (
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[24px] font-semibold text-white mb-1">{t('wizard.photosTitle')}</h2>
                    <p className="text-[13px] text-ck-muted">{t('wizard.photosSubtitle')}</p>
                  </div>
                  <span className="font-mono text-[13px] font-medium text-ck-muted-light tabular-nums">
                    {t('wizard.photosProgress', { done: shotProgress.done, total: shotProgress.total })}
                  </span>
                </div>

                <div className="grid gap-6 mt-6 items-start grid-cols-1 md:grid-cols-[1.35fr_1fr]">
                  {/* Viewfinder */}
                  <div>
                    <div className="relative rounded-xl bg-ck-dark-surface overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="absolute rounded-lg border-2 border-dashed border-ck-red/40" style={{ inset: '12% 10%' }} />
                        <span className="relative rounded-md bg-ck-dark-card px-3 py-1.5 text-[13px] font-medium text-ck-muted">
                          {t('wizard.silhouetteGuide')} · {GUIDED_SHOTS[activeShot]?.label.nl || ''}
                        </span>
                        <span className="absolute left-3 top-3 rounded bg-ck-dark-card px-2 py-1 font-mono text-[11px] font-medium text-ck-muted">
                          {t('wizard.shotCounter', { current: activeShot + 1, total: GUIDED_SHOTS.length })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => { setShowPhotoCapture(true); }}
                        className="flex-1 rounded-lg bg-ck-red text-white font-semibold text-base hover:bg-red-600"
                        style={{ minHeight: 56 }}
                      >
                        {t('wizard.shutterButton')} · {GUIDED_SHOTS[activeShot]?.label.nl || ''}
                      </button>
                      <button
                        onClick={() => setActiveShot(Math.min(GUIDED_SHOTS.length - 1, activeShot + 1))}
                        className="rounded-lg border border-ck-dark-border bg-ck-dark-card px-4 text-[13px] text-ck-muted-light hover:text-white"
                        style={{ minHeight: 56 }}
                      >
                        {t('wizard.skipButton')}
                      </button>
                    </div>

                    {showPhotoCapture && (
                      <div className="mt-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
                        <PhotoCapture
                          inspectionId={inspection.id}
                          kind="shot"
                          shotKey={GUIDED_SHOTS[activeShot]?.key}
                          onUploaded={() => {
                            reloadInspection(inspection.id);
                            setShowPhotoCapture(false);
                            const nextUndone = GUIDED_SHOTS.findIndex((s, i) => i > activeShot && s.required && !capturedShotKeys.includes(s.key));
                            if (nextUndone >= 0) setActiveShot(nextUndone);
                            else setActiveShot(Math.min(GUIDED_SHOTS.length - 1, activeShot + 1));
                          }}
                          onClose={() => setShowPhotoCapture(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Shot thumbnails */}
                  <div className="grid gap-2 grid-cols-3 md:grid-cols-2">
                    {GUIDED_SHOTS.map((shot, i) => {
                      const done = capturedShotKeys.includes(shot.key);
                      const isActive = activeShot === i;
                      return (
                        <button
                          key={shot.key}
                          onClick={() => setActiveShot(i)}
                          className="rounded-md p-1.5 text-left"
                          style={{ background: isActive ? 'rgba(239,68,68,0.08)' : 'transparent' }}
                        >
                          <div className="relative rounded bg-ck-dark-surface overflow-hidden flex items-end p-1.5" style={{ aspectRatio: '4/3' }}>
                            <span className="relative rounded bg-ck-dark-card px-1 py-0.5 font-mono text-[10px] text-ck-muted">
                              F-{String(i + 1).padStart(3, '0')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full flex-none" style={{ background: done ? 'var(--ck-green)' : 'var(--ck-dark-border)' }} />
                            <span className="text-[11px] text-ck-muted-light">{i + 1} · {shot.label.nl}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3 & 4: SCHADE / PRE-EXISTENT ═══ */}
            {(stepKey === 'schade' || stepKey === 'preexistent') && inspection && (
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[24px] font-semibold text-white mb-1">
                      {isPreStep ? t('wizard.preExistentTitle') : t('wizard.damageTitle')}
                    </h2>
                    <p className="text-[13px] text-ck-muted">
                      {isPreStep ? t('wizard.preExistentSubtitle') : t('wizard.damageSubtitle')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPicker(true)}
                    className="flex-none rounded-lg bg-ck-red px-4 text-sm font-semibold text-white whitespace-nowrap hover:bg-red-600"
                    style={{ minHeight: 48 }}
                  >
                    {t('wizard.addFinding')}
                  </button>
                </div>

                {/* Finding chips strip */}
                {currentFindings.length > 0 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                    {currentFindings.map(f => {
                      const active = selFinding?.id === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => { setSelectedFindingId(f.id); setEditingFinding(null); }}
                          className="flex items-center gap-1.5 flex-none rounded-full px-3 text-sm"
                          style={{
                            minHeight: 44,
                            border: `1px solid ${active ? 'var(--ck-red)' : 'var(--ck-dark-border)'}`,
                            background: active ? 'rgba(239,68,68,0.08)' : 'var(--ck-dark-card)',
                            color: active ? 'var(--ck-red)' : 'var(--ck-muted-light)',
                          }}
                        >
                          <span className="font-mono text-[11px] font-medium">{f.reference}</span>
                          <span className="text-[12px]">{f.component_key}</span>
                          <span className="h-1.5 w-1.5 rounded-full" style={{
                            background: f.severity >= 3 ? 'var(--ck-red)' : f.severity === 2 ? 'orange' : 'var(--ck-muted)',
                          }} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected finding: split layout */}
                {selFinding && !editingFinding && (
                  <div className="grid gap-6 mt-4 items-start grid-cols-1 md:grid-cols-[1fr_380px]">
                    {/* Left: photo area */}
                    <div>
                      <div className="relative rounded-xl bg-ck-dark-surface overflow-hidden grid place-items-center" style={{ aspectRatio: '4/3' }}>
                        <span className="relative rounded-md bg-ck-dark-card px-3 py-1.5 text-[13px] font-medium text-ck-muted">
                          {t('wizard.detailShot')} · {selFinding.component_key}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3 items-stretch">
                        {photos.filter(p => p.finding_id === selFinding.id).slice(0, 3).map(p => (
                          <div key={p.id} className="w-[88px] rounded bg-ck-dark-surface overflow-hidden relative flex items-end p-1" style={{ aspectRatio: '4/3' }}>
                            <span className="relative font-mono text-[9px] bg-ck-dark-card rounded px-1 py-0.5 text-ck-muted">{p.reference}</span>
                          </div>
                        ))}
                        <button
                          onClick={() => setEditingFinding(selFinding)}
                          className="rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 flex flex-col items-center justify-center gap-0.5 text-[12px] text-ck-muted-light hover:text-white"
                          style={{ minHeight: 48, width: 88 }}
                        >
                          {t('wizard.photoButton')}
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => deleteFinding(selFinding.id)}
                          className="rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 text-[13px] text-red-400 hover:bg-red-500/10"
                          style={{ minHeight: 48 }}
                        >
                          {t('wizard.deleteFinding')}
                        </button>
                      </div>
                    </div>

                    {/* Right: finding detail card */}
                    <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[13px] font-semibold text-ck-muted">{selFinding.reference}</span>
                        <span className="flex-1 text-base font-semibold text-white">{selFinding.component_key}</span>
                        <button
                          onClick={() => setEditingFinding(selFinding)}
                          className="text-[12px] font-medium text-ck-red hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          {t('wizard.editButton')}
                        </button>
                      </div>

                      {selFinding.sub_location && (
                        <div className="mt-3">
                          <span className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelSubLocation')}</span>
                          <span className="text-sm text-white">{selFinding.sub_location}</span>
                        </div>
                      )}

                      {/* Damage types */}
                      <div className="mt-3">
                        <span className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelDamageType')}</span>
                        <div className="flex flex-wrap gap-1">
                          {selFinding.damage_types.map(dt => (
                            <span key={dt} className="rounded-md bg-ck-red/10 border border-ck-red/30 px-2.5 py-1 text-[12px] font-medium text-ck-red">
                              {dt}
                            </span>
                          ))}
                          {selFinding.damage_types.length === 0 && <span className="text-[12px] text-ck-muted">{t('wizard.noneSelected')}</span>}
                        </div>
                      </div>

                      {/* Severity */}
                      <div className="mt-3">
                        <span className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelSeverity')}</span>
                        <div className="flex gap-1">
                          {SEVERITY_KEYS.map(s => (
                            <div
                              key={s.value}
                              className="flex flex-col items-center gap-0.5 flex-1 rounded-md py-1.5 text-center"
                              style={{
                                border: `1px solid ${selFinding.severity === s.value ? 'var(--ck-red)' : 'var(--ck-dark-border)'}`,
                                background: selFinding.severity === s.value ? 'rgba(239,68,68,0.08)' : 'var(--ck-dark-surface)',
                                color: selFinding.severity === s.value ? 'var(--ck-red)' : 'var(--ck-muted)',
                              }}
                            >
                              <span className="font-mono text-[12px] tracking-wider">{s.bar}</span>
                              <span className="text-[11px]">{t(s.labelKey)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Disposition */}
                      <div className="mt-3">
                        <span className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelDisposition')}</span>
                        <div className="flex gap-1">
                          {DISPOSITIONS.filter(d => isPreStep ? true : d !== 'geen_actie').map(d => (
                            <span
                              key={d}
                              className="flex-1 text-center rounded-md py-2 text-[12px] font-medium"
                              style={{
                                border: `1px solid ${selFinding.disposition === d ? 'var(--ck-red)' : 'var(--ck-dark-border)'}`,
                                background: selFinding.disposition === d ? 'rgba(239,68,68,0.08)' : 'var(--ck-dark-surface)',
                                color: selFinding.disposition === d ? 'var(--ck-red)' : 'var(--ck-muted-light)',
                              }}
                            >
                              {dispLabel(d)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Technique + paint */}
                      <div className="grid gap-3 mt-3 grid-cols-2">
                        <div>
                          <span className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelTechnique')}</span>
                          <span className="text-sm text-white">{techLabel(selFinding.repair_technique)}</span>
                        </div>
                        <div>
                          <span className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelPaintwork')}</span>
                          <span className="text-sm text-white">{paintOpLabel(selFinding.paint_operation)}</span>
                        </div>
                      </div>

                      {/* Hours */}
                      <div className="grid gap-3 mt-3 grid-cols-2">
                        <div>
                          <span className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelBodyworkHours')}</span>
                          <span className="font-mono text-sm text-white tabular-nums">{num(selFinding.repair_hours)}</span>
                        </div>
                        <div>
                          <span className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelPaintHours')}</span>
                          <span className="font-mono text-sm text-white tabular-nums">{num(selFinding.paint_hours)}</span>
                        </div>
                      </div>

                      {/* Flags */}
                      <div className="mt-3 flex flex-col gap-1.5">
                        {selFinding.hidden_damage_possible && (
                          <div className="flex items-start gap-2 rounded-md bg-orange-500/5 px-3 py-2 text-[12px] text-orange-400">
                            <span className="flex-none mt-0.5 h-5 w-5 rounded bg-orange-500 text-white grid place-items-center font-semibold text-[12px]">✓</span>
                            {t('wizard.hiddenDamageFlag')}
                          </div>
                        )}
                        {selFinding.adas_possible && (
                          <div className="flex items-start gap-2 rounded-md bg-blue-500/5 px-3 py-2 text-[12px] text-blue-400">
                            <span className="flex-none mt-0.5 h-5 w-5 rounded bg-blue-500 text-white grid place-items-center font-semibold text-[12px]">✓</span>
                            {t('wizard.adasFlag')}
                          </div>
                        )}
                      </div>

                      {/* Parts */}
                      <div className="mt-3 border-t border-ck-dark-border pt-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('wizard.partsHeader')}</span>
                          <button className="text-[12px] font-medium text-ck-red bg-transparent border-0 cursor-pointer" onClick={() => setEditingFinding(selFinding)}>{t('wizard.addPartButton')}</button>
                        </div>
                        {selFinding.ins_finding_parts?.length > 0 ? (
                          selFinding.ins_finding_parts.map(p => (
                            <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-ck-dark-border">
                              <span className="flex-1 text-[12px] text-ck-muted-light">{p.description}</span>
                              <span className="font-mono text-[11px] text-ck-muted">{p.part_number}</span>
                              <span className="rounded bg-ck-dark-surface px-1.5 py-0.5 text-[11px] text-ck-muted">{p.source}</span>
                            </div>
                          ))
                        ) : (
                          <span className="block text-[12px] text-ck-muted py-1.5">
                            {selFinding.disposition === 'vervangen' ? t('wizard.noPartsReplace') : t('wizard.noPartsDefault')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline finding editor (for new or editing) */}
                {editingFinding && (
                  <FindingEditorInline
                    finding={editingFinding}
                    damageTypes={damageTypes}
                    components={components}
                    origin={isPreStep ? 'pre_existent' : 'schade'}
                    onUpdate={u => setEditingFinding(prev => prev ? { ...prev, ...u } : null)}
                    onRecalc={recalcHours}
                    onSave={async () => {
                      await saveFinding({
                        ...editingFinding,
                        id: editingFinding.id || crypto.randomUUID(),
                        component_key: editingFinding.component_key!,
                        origin: isPreStep ? 'pre_existent' : 'schade',
                      } as Partial<Finding> & { component_key: string; origin: string });
                    }}
                    onCancel={() => setEditingFinding(null)}
                    saving={saving}
                    t={t}
                  />
                )}

                {currentFindings.length === 0 && !editingFinding && (
                  <div className="mt-4 rounded-lg border border-dashed border-ck-dark-border bg-ck-dark-card p-8 text-center text-sm text-ck-muted">
                    {t('wizard.noFindingsYet')}
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 5: HERSTELPLAN ═══ */}
            {stepKey === 'herstelplan' && inspection && (
              <div>
                <h2 className="text-[24px] font-semibold text-white mb-1">{t('wizard.repairPlanTitle')}</h2>
                <p className="text-[13px] text-ck-muted mb-6">{t('wizard.repairPlanSubtitle')}</p>

                {schadeFindings.length > 0 ? (
                  <>
                    {/* Data table */}
                    <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card overflow-x-auto" style={{ minWidth: 0 }}>
                    <div className="min-w-[600px]">
                      {/* Header */}
                      <div className="grid gap-3 px-4 py-2.5 bg-ck-dark-surface border-b border-ck-dark-border text-[10px] font-semibold uppercase tracking-widest text-ck-muted"
                        style={{ gridTemplateColumns: '52px 1.4fr 1.1fr 96px 96px 1fr' }}>
                        <span>{t('wizard.tableRef')}</span><span>{t('wizard.tableComponent')}</span><span>{t('wizard.tableTechnique')}</span><span>{t('wizard.tableBodywork')}</span><span>{t('wizard.tablePaintwork')}</span><span>{t('wizard.tableStandard')}</span>
                      </div>
                      {/* Rows */}
                      {schadeFindings.map(f => (
                        <div key={f.id} className="grid gap-3 px-4 py-2 items-center border-b border-ck-dark-border"
                          style={{ gridTemplateColumns: '52px 1.4fr 1.1fr 96px 96px 1fr' }}>
                          <span className="font-mono text-[12px] font-medium text-ck-muted">{f.reference}</span>
                          <span className="text-[13px] font-medium text-white">{f.component_key}</span>
                          <span className="text-[12px] text-ck-muted">{techLabel(f.repair_technique)}</span>
                          <span className="font-mono text-sm text-white text-right tabular-nums">{num(f.repair_hours)}</span>
                          <span className="font-mono text-sm text-white text-right tabular-nums">{num(f.paint_hours)}</span>
                          <span className="text-[11px] text-ck-muted">{f.disposition === 'herstellen' ? t('wizard.dispStandard') : dispLabel(f.disposition)}</span>
                        </div>
                      ))}
                      {/* Totals */}
                      <div className="grid gap-3 px-4 py-3 items-center border-t-2 border-white/20"
                        style={{ gridTemplateColumns: '52px 1.4fr 1.1fr 96px 96px 1fr' }}>
                        <span />
                        <span className="text-[13px] font-semibold text-white">{t('wizard.totalInOrder')}</span>
                        <span />
                        <span className="font-mono text-[13px] font-semibold text-white text-right tabular-nums">{num(repairTotal)}</span>
                        <span className="font-mono text-[13px] font-semibold text-white text-right tabular-nums">{num(paintTotal)}</span>
                        <span className="text-[11px] text-ck-muted">{t('wizard.exclPreExistent')}</span>
                      </div>
                    </div>
                    </div>

                    {/* Tarieven + Indicatie cards */}
                    <div className="grid gap-6 mt-6 grid-cols-1 sm:grid-cols-2">
                      <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-4">
                        <h3 className="text-base font-semibold text-white mb-3">{t('wizard.ratesTitle')}</h3>
                        {[
                          [t('wizard.rateBodywork'), `€ ${RATES_CENTS.plaat / 100},— / u`],
                          [t('wizard.ratePaintwork'), `€ ${RATES_CENTS.spuit / 100},— / u`],
                          [t('wizard.ratePrep'), `€ ${RATES_CENTS.voor / 100},— / u`],
                          [t('wizard.ratePrepFactor'), t('wizard.ratePrepValue')],
                        ].map(([k, v]) => (
                          <div key={k as string} className="flex justify-between py-1.5 border-t border-ck-dark-border text-[13px]">
                            <span className="text-ck-muted-light">{k}</span>
                            <span className="font-mono text-white">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-4">
                        <h3 className="text-base font-semibold text-white mb-3">{t('wizard.estimateTitle')}</h3>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[13px] text-ck-muted">{t('wizard.estimateLabel')}</span>
                          <span className="text-[28px] font-semibold text-white tabular-nums">{eur(indicativeMoneyCents)}</span>
                        </div>
                        <p className="text-[12px] text-ck-muted mt-2 leading-relaxed">{t('wizard.estimateDisclaimer')}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-ck-dark-border bg-ck-dark-card p-8 text-center text-sm text-ck-muted">
                    {t('wizard.noFindingsRepairPlan')}
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 6: CONTROLE ═══ */}
            {stepKey === 'controle' && inspection && (
              <div style={{ maxWidth: 900 }}>
                <h2 className="text-[24px] font-semibold text-white mb-1">{t('wizard.checkTitle')}</h2>
                <p className="text-[13px] text-ck-muted mb-6">{t('wizard.checkSubtitle')}</p>

                {/* Checklist */}
                <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card overflow-hidden">
                  {checkResults.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const targets = [0, 0, 1, 2, 2, 4, 2];
                        setStep(targets[i]);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 border-b border-ck-dark-border text-left hover:bg-ck-dark-surface cursor-pointer"
                    >
                      <span className="flex-none h-[22px] w-[22px] rounded-full grid place-items-center text-[12px] font-semibold text-white"
                        style={{ background: c.ok ? 'var(--ck-green)' : c.warn && !c.ok ? 'orange' : 'var(--ck-red)' }}>
                        {c.ok ? '✓' : c.warn ? '!' : '×'}
                      </span>
                      <div className="flex-1">
                        <span className="block text-[13px] font-medium text-white">{t(c.titleKey)}</span>
                        <span className="block text-[12px] text-ck-muted">{c.detail}</span>
                      </div>
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{
                          background: c.ok ? 'var(--ck-dark-surface)' : 'rgba(239,68,68,0.08)',
                          color: c.ok ? 'var(--ck-muted)' : 'var(--ck-red)',
                        }}>
                        {c.ok ? t('wizard.statusOk') : c.warn ? t('wizard.statusWarning') : t('wizard.statusBlocking')}
                      </span>
                    </button>
                  ))}
                </div>

                {/* KPI cards */}
                <div className="grid gap-4 mt-6 grid-cols-2 sm:grid-cols-4">
                  {[
                    { value: String(schadeFindings.length), label: t('wizard.sidebarFindings') },
                    { value: `${shotProgress.done}/${shotProgress.total}`, label: t('wizard.sidebarPhotos') },
                    { value: num(repairTotal), label: t('wizard.sidebarBodywork') },
                    { value: num(paintTotal), label: t('wizard.sidebarPaintwork') },
                  ].map(kpi => (
                    <div key={kpi.label} className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-4">
                      <div className="text-[24px] font-semibold text-white tabular-nums">{kpi.value}</div>
                      <div className="text-[11px] text-ck-muted mt-0.5">{kpi.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ STEP 7: AKKOORD ═══ */}
            {stepKey === 'akkoord' && inspection && (
              <div style={{ maxWidth: 720 }}>
                <h2 className="text-[24px] font-semibold text-white mb-1">{t('wizard.approvalTitle')}</h2>
                <p className="text-[13px] text-ck-muted mb-6">{t('wizard.approvalSubtitle')}</p>

                {/* Sign mode toggle */}
                <div className="flex gap-1 mb-6">
                  {(['tablet', 'remote'] as const).map(m => (
                    <button key={m} onClick={() => setSignMode(m)} style={chipStyle(signMode === m, { flex: 1, justifyContent: 'center', minHeight: 48 })}>
                      {m === 'tablet' ? t('wizard.signTablet') : t('wizard.signRemote')}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-6">
                  {/* Summary */}
                  <div className="grid gap-x-6 gap-y-1 pb-4 border-b border-ck-dark-border grid-cols-1 sm:grid-cols-2">
                    {[
                      [t('wizard.labelReference'), inspection.reference],
                      [t('wizard.labelVehicleSummary'), `${inspection.make || ''} ${inspection.model || ''}`.trim()],
                      [t('wizard.labelLicencePlate'), inspection.licence_plate],
                      [t('wizard.sidebarFindings'), t('wizard.findingsAndPreExistent', { damage: schadeFindings.length, pre: preFindings.length })],
                      [t('wizard.sidebarBodywork'), `${num(repairTotal)} u`],
                      [t('wizard.sidebarPaintwork'), `${num(paintTotal)} u`],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between gap-4">
                        <span className="text-[12px] text-ck-muted">{k}</span>
                        <span className="text-[13px] font-medium text-white text-right">{v}</span>
                      </div>
                    ))}
                  </div>

                  {signMode === 'tablet' && (
                    <div className="mt-4">
                      <p className="text-[13px] text-ck-muted-light leading-relaxed">{t('wizard.declarationText')}</p>

                      {/* Signature pad placeholder */}
                      <div
                        className="mt-4 rounded-lg border-2 border-dashed border-ck-dark-border bg-ck-dark-surface grid place-items-center cursor-pointer hover:border-ck-muted"
                        style={{ height: 160 }}
                      >
                        <span className="text-sm text-ck-muted">{t('wizard.signHere')}</span>
                      </div>

                      <div className="grid gap-4 mt-4 items-end grid-cols-1 sm:grid-cols-[1fr_200px]">
                        <div>
                          <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelSignerName')}</label>
                          <input
                            type="text"
                            value={signName}
                            onChange={e => setSignName(e.target.value)}
                            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm text-white focus:outline-none focus:border-ck-red"
                            style={{ minHeight: 48 }}
                          />
                        </div>
                        <div>
                          <span className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelTimestamp')}</span>
                          <span className="block font-mono text-[13px] text-white py-3">
                            {new Date().toLocaleDateString('nl-NL')} {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={submitForApproval}
                        disabled={saving || !signName.trim() || blockingIssues > 0}
                        className="w-full rounded-lg bg-ck-red px-5 text-sm font-semibold text-white mt-4 hover:bg-red-600 disabled:opacity-50"
                        style={{ minHeight: 52 }}
                      >
                        {saving ? t('wizard.lockingButton') : blockingIssues > 0 ? t('wizard.blockingIssuesButton', { count: blockingIssues }) : t('wizard.signAndLockButton')}
                      </button>
                      <p className="text-[11px] text-ck-muted mt-2 leading-relaxed">{t('wizard.eSignDisclaimer')}</p>
                    </div>
                  )}

                  {signMode === 'remote' && (
                    <div className="mt-4">
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-[1fr_200px]">
                        <div>
                          <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelEmailOrMobile')}</label>
                          <input
                            type="text"
                            value={signRecipient}
                            onChange={e => setSignRecipient(e.target.value)}
                            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2.5 text-sm text-white focus:outline-none focus:border-ck-red"
                            style={{ minHeight: 48 }}
                          />
                        </div>
                        <div>
                          <span className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelValidity')}</span>
                          <span className="block text-[13px] text-white py-3">{t('wizard.validityValue')}</span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-md bg-ck-dark-surface px-4 py-3">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('wizard.linkHeader')}</span>
                        <span className="block font-mono text-[13px] text-white mt-1 break-all">
                          colourking.nl/opname/{inspection.id.substring(0, 4)}…{inspection.id.substring(inspection.id.length - 4)}
                        </span>
                        <span className="block text-[11px] text-ck-muted mt-1.5">{t('wizard.linkDisclaimer')}</span>
                      </div>

                      <button
                        onClick={submitForApproval}
                        disabled={saving || !signRecipient.trim() || blockingIssues > 0}
                        className="w-full rounded-lg bg-ck-red px-5 text-sm font-semibold text-white mt-4 hover:bg-red-600 disabled:opacity-50"
                        style={{ minHeight: 52 }}
                      >
                        {saving ? t('wizard.sendingButton') : blockingIssues > 0 ? t('wizard.blockingIssuesButton', { count: blockingIssues }) : t('wizard.sendLinkButton')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ─── FOOTER BAR ─── */}
          <div className="flex-none flex items-center gap-2 sm:gap-4 px-3 sm:px-6 h-[64px] bg-ck-dark-card border-t border-ck-dark-border">
            <span className="hidden sm:inline text-[13px] font-medium text-white">{t('wizard.stepOf', { current: step + 1 })}</span>
            {inspection && (
              <span className="hidden md:inline text-[13px] text-ck-muted">
                {t('wizard.footerFindingsCount', { count: schadeFindings.length })} · {t('wizard.footerPhotosCount', { count: shotProgress.done })}
              </span>
            )}
            {blockingIssues > 0 && (
              <button
                onClick={() => setStep(5)}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                {blockingIssues === 1 ? t('wizard.openIssues', { count: blockingIssues }) : t('wizard.openIssuesPlural', { count: blockingIssues })}
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={goPrev}
              disabled={step === 0}
              className="rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 sm:px-4 text-[13px] font-medium text-ck-muted-light hover:text-white disabled:opacity-30"
              style={{ minHeight: 48 }}
            >
              {t('wizard.prevButton')}
            </button>
            <button
              onClick={goNext}
              disabled={!canGoNext() || saving}
              className="rounded-lg bg-ck-red px-4 sm:px-5 text-[13px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              style={{ minHeight: 48 }}
            >
              {saving && <Loader2 size={14} className="animate-spin inline mr-2" />}
              {step === 6 ? t('wizard.lockButton') : t('wizard.nextButton')}
            </button>
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside className="hidden lg:flex w-[296px] flex-none flex-col bg-ck-dark-card border-l border-ck-dark-border min-h-0">
          {/* Progress pips + mini stats */}
          <div className="p-4 border-b border-ck-dark-border">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('wizard.progressLabel')}</span>
            <div className="flex gap-1 mt-3">
              {STEP_KEYS.map((_, i) => (
                <span
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{ background: i < step ? 'var(--ck-green)' : i === step ? 'var(--ck-red)' : 'var(--ck-dark-surface)' }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3">
              {[
                { value: String(schadeFindings.length), label: t('wizard.sidebarFindings') },
                { value: `${shotProgress.done}/${shotProgress.total}`, label: t('wizard.sidebarPhotos') },
                { value: num(repairTotal + paintTotal), label: t('wizard.sidebarHours') },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-lg font-semibold text-white tabular-nums">{m.value}</div>
                  <div className="text-[11px] text-ck-muted">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Open punten */}
          <div className="px-4 pt-4 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('wizard.openItemsLabel')}</span>
          </div>
          <div className="flex-1 overflow-auto px-1.5 pb-4">
            {issues.length > 0 ? issues.map((issue, i) => (
              <button
                key={i}
                onClick={() => setStep(issue.step)}
                className="flex gap-2 w-full rounded-md px-2.5 py-2 text-left hover:bg-ck-dark-surface cursor-pointer"
              >
                <span className="flex-none mt-1.5 h-[7px] w-[7px] rounded-full" style={{ background: issue.block ? 'var(--ck-red)' : 'orange' }} />
                <div>
                  <span className="block text-[12px] text-ck-muted-light">{issue.text}</span>
                  <span className="block font-mono text-[11px] text-ck-muted mt-0.5">{issue.where}</span>
                </div>
              </button>
            )) : (
              <span className="block px-2.5 py-2 text-[12px] text-ck-muted">
                {inspection ? t('wizard.allChecksOk') : t('wizard.startToSeeChecks')}
              </span>
            )}
          </div>

          {/* Hours footer */}
          <div className="flex-none p-4 border-t border-ck-dark-border">
            <div className="flex justify-between text-[12px] text-ck-muted-light">
              <span>{t('wizard.sidebarBodywork')}</span>
              <span className="font-mono tabular-nums">{num(repairTotal)} u</span>
            </div>
            <div className="flex justify-between text-[12px] text-ck-muted-light mt-1">
              <span>{t('wizard.sidebarPaintwork')}</span>
              <span className="font-mono tabular-nums">{num(paintTotal)} u</span>
            </div>
            <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-ck-dark-border">
              <span className="text-[12px] text-ck-muted">{t('wizard.sidebarIndicative')}</span>
              <span className="text-lg font-semibold text-white tabular-nums">{eur(indicativeMoneyCents)}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══ COMPONENT PICKER MODAL ═══ */}
      {showPicker && (
        <div className="fixed inset-0 z-50 grid place-items-center p-2 sm:p-6" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="flex flex-col bg-ck-dark-card rounded-2xl shadow-2xl overflow-hidden w-full sm:w-[760px] max-h-[90vh] sm:max-h-[80vh]">
            {/* Modal header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-ck-dark-border">
              <h3 className="text-lg font-semibold text-white">{t('wizard.pickerTitle')}</h3>
              <span className="flex-1 text-[12px] text-ck-muted">{t('wizard.pickerHint')}</span>
              <button
                onClick={() => setShowPicker(false)}
                className="rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-1.5 text-[13px] text-ck-muted-light hover:text-white"
              >
                {t('wizard.pickerClose')}
              </button>
            </div>
            {/* Modal body */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {componentGroups.map(g => (
                <div key={g.zone} className="mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{g.zoneKey ? t(g.zoneKey) : g.zone}</span>
                  <div className="grid gap-1 mt-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {g.items.map(c => (
                      <button
                        key={c.key}
                        onClick={() => startNewFinding(c)}
                        className="flex items-center gap-1.5 w-full rounded-md border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-left text-[13px] text-white hover:bg-ck-dark-surface cursor-pointer"
                        style={{ minHeight: 48 }}
                      >
                        <span className="flex-1 text-left">{c.name_nl}</span>
                        {c.hasFinding && <span className="h-1.5 w-1.5 rounded-full bg-ck-red flex-none" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════
//   Finding Editor (inline card)
// ════════════════════════════════

function FindingEditorInline({
  finding, damageTypes, components, origin,
  onUpdate, onRecalc, onSave, onCancel, saving, t,
}: {
  finding: Partial<Finding>;
  damageTypes: DamageType[];
  components: Component[];
  origin: string;
  onUpdate: (u: Partial<Finding>) => void;
  onRecalc: (f: Partial<Finding>) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const comp = components.find(c => c.key === finding.component_key);

  const toggleDamageType = (code: string) => {
    const current = finding.damage_types ?? [];
    const next = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
    const hasPaintType = damageTypes.some(dt => next.includes(dt.code) && dt.implies_paint);
    onUpdate({ damage_types: next, paint_required: hasPaintType || finding.paint_required });
  };

  return (
    <div className="mt-4 rounded-xl border border-ck-red/30 bg-ck-dark-card p-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-white">{finding.component_key || t('wizard.newFinding')}</h3>
        <button onClick={onCancel} className="text-sm text-ck-muted hover:text-white bg-transparent border-0 cursor-pointer">{t('wizard.editorClose')}</button>
      </div>

      {/* Sub-location */}
      <div>
        <label className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelSubLocation')}</label>
        <input
          type="text"
          value={finding.sub_location || ''}
          onChange={e => onUpdate({ sub_location: e.target.value || null })}
          placeholder={t('wizard.placeholderSubLocation')}
          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-muted focus:outline-none focus:border-ck-red"
          style={{ minHeight: 40 }}
        />
      </div>

      {/* Damage types */}
      <div>
        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelDamageTypeMulti')}</label>
        <div className="flex flex-wrap gap-1">
          {damageTypes.map(dt => {
            const active = finding.damage_types?.includes(dt.code);
            return (
              <button key={dt.code} onClick={() => toggleDamageType(dt.code)} style={chipStyle(!!active)}>
                {dt.name_nl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelSeverity')}</label>
        <div className="flex gap-1">
          {SEVERITY_KEYS.map(s => (
            <button
              key={s.value}
              onClick={() => { onUpdate({ severity: s.value }); onRecalc({ ...finding, severity: s.value }); }}
              className="flex flex-col items-center gap-0.5 flex-1 rounded-md py-2 cursor-pointer"
              style={{
                minHeight: 48,
                border: `1px solid ${finding.severity === s.value ? 'var(--ck-red)' : 'var(--ck-dark-border)'}`,
                background: finding.severity === s.value ? 'rgba(239,68,68,0.08)' : 'var(--ck-dark-surface)',
                color: finding.severity === s.value ? 'var(--ck-red)' : 'var(--ck-muted)',
              }}
            >
              <span className="font-mono text-[12px] tracking-wider">{s.bar}</span>
              <span className="text-[11px]">{t(s.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Disposition */}
      <div>
        <label className="block text-[12px] text-ck-muted mb-1.5">{t('wizard.labelDisposition')}</label>
        <div className="flex gap-1">
          {DISPOSITIONS.map(d => (
            <button
              key={d}
              onClick={() => { onUpdate({ disposition: d }); onRecalc({ ...finding, disposition: d }); }}
              style={chipStyle(finding.disposition === d, { flex: 1, justifyContent: 'center', minHeight: 44 })}
            >
              {t(DISP_LABEL_KEYS[d])}
            </button>
          ))}
        </div>
      </div>

      {/* Technique + paint operation */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <div>
          <label className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelTechnique')}</label>
          <select
            value={finding.repair_technique || ''}
            onChange={e => onUpdate({ repair_technique: e.target.value || null })}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:outline-none focus:border-ck-red"
            style={{ minHeight: 40 }}
          >
            <option value="">{t('wizard.selectPlaceholder')}</option>
            {TECHNIQUES.map(te => <option key={te.value} value={te.value}>{t(te.labelKey)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelPaintwork')}</label>
          <select
            value={finding.paint_operation || ''}
            onChange={e => {
              const op = e.target.value || null;
              onUpdate({ paint_operation: op, paint_required: !!op });
              onRecalc({ ...finding, paint_operation: op, paint_required: !!op });
            }}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:outline-none focus:border-ck-red"
            style={{ minHeight: 40 }}
          >
            {PAINT_OPS.map(p => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
          </select>
        </div>
      </div>

      {/* Hours */}
      <div className="grid gap-3 grid-cols-2">
        <div>
          <label className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelBodyworkHours')}</label>
          <input
            type="number"
            step="0.25"
            min="0"
            value={finding.repair_hours ?? 0}
            onChange={e => onUpdate({ repair_hours: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm font-mono text-white text-right tabular-nums focus:outline-none focus:border-ck-red"
            style={{ minHeight: 40 }}
          />
        </div>
        <div>
          <label className="block text-[12px] text-ck-muted mb-1">{t('wizard.labelPaintHours')}</label>
          <input
            type="number"
            step="0.25"
            min="0"
            value={finding.paint_hours ?? 0}
            onChange={e => onUpdate({ paint_hours: parseFloat(e.target.value) || 0 })}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm font-mono text-white text-right tabular-nums focus:outline-none focus:border-ck-red"
            style={{ minHeight: 40 }}
          />
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-col gap-1.5">
        {[
          { key: 'hidden_damage_possible' as const, labelKey: 'wizard.hiddenDamageFlag' },
          { key: 'adas_possible' as const, labelKey: 'wizard.adasFlag' },
        ].map(flag => {
          const on = !!(finding as Record<string, unknown>)[flag.key];
          return (
            <button
              key={flag.key}
              onClick={() => onUpdate({ [flag.key]: !on } as Partial<Finding>)}
              className="flex items-start gap-2 w-full rounded-md px-3 py-2 text-left"
              style={{ background: on ? 'rgba(239,68,68,0.06)' : 'var(--ck-dark-surface)', color: on ? 'var(--ck-red)' : 'var(--ck-muted-light)' }}
            >
              <span className="flex-none h-5 w-5 rounded grid place-items-center text-[12px] font-semibold"
                style={{
                  border: `1px solid ${on ? 'var(--ck-red)' : 'var(--ck-dark-border)'}`,
                  background: on ? 'var(--ck-red)' : 'var(--ck-dark-card)',
                  color: 'white',
                }}>
                {on ? '✓' : ''}
              </span>
              <span className="text-[12px] leading-relaxed">{t(flag.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-ck-dark-border">
        <button onClick={onCancel} className="rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:text-white">
          {t('wizard.cancelButton')}
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-ck-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin inline mr-2" />}
          {t('wizard.saveButton')}
        </button>
      </div>
    </div>
  );
}
