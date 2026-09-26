'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Trash2, User, Pencil, Check, X, ClipboardCheck, Plus, Gauge,
  Wrench, FileText, Receipt, Calendar, Inbox, FileDown,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { NotesPanel } from '@/components/shared/NotesPanel';
import { VehicleDamageMap, COMPONENT_SLOTS, defaultPointForKey, type MapMarker } from '@/components/shared/VehicleDamageMap';
import { STATUS_LABELS as INS_STATUS_LABELS, STATUS_COLORS as INS_STATUS_COLORS, type InsStatus } from '@/modules/inspectie/machine';

const RDW_LABELS: Record<string, string> = {
  merk: 'Merk',
  type: 'Type',
  variant: 'Variant',
  uitvoering: 'Uitvoering',
  kenteken: 'Kenteken',
  handelsbenaming: 'Handelsbenaming',
  eerste_kleur: 'Kleur',
  tweede_kleur: 'Tweede kleur',
  brandstof_omschrijving: 'Brandstof',
  inrichting: 'Inrichting',
  voertuigsoort: 'Voertuigsoort',
  datum_eerste_toelating: 'Eerste toelating',
  datum_eerste_toelating_dt: 'Eerste toelating',
  vervaldatum_apk: 'APK vervaldatum',
  vervaldatum_apk_dt: 'APK vervaldatum',
  catalogusprijs: 'Catalogusprijs',
  bruto_bpm: 'BPM',
  cilinderinhoud: 'Cilinderinhoud (cc)',
  aantal_cilinders: 'Aantal cilinders',
  vermogen_massarijklaar: 'Vermogen (kW/kg)',
  massa_rijklaar: 'Massa rijklaar (kg)',
  massa_ledig_voertuig: 'Massa ledig (kg)',
  maximum_massa_samenstelling: 'Max massa samenstelling (kg)',
  laadvermogen: 'Laadvermogen (kg)',
  lengte: 'Lengte (cm)',
  breedte: 'Breedte (cm)',
  hoogte_voertuig: 'Hoogte (cm)',
  wielbasis: 'Wielbasis (cm)',
  aantal_deuren: 'Aantal deuren',
  aantal_zitplaatsen: 'Zitplaatsen',
  aantal_wielen: 'Aantal wielen',
  wam_verzekerd: 'WAM verzekerd',
  wacht_op_keuren: 'Wacht op keuren',
  export_indicator: 'Export',
  taxi_indicator: 'Taxi',
  tenaamstellen_mogelijk: 'Tenaamstelling mogelijk',
  tellerstandoordeel: 'Tellerstandoordeel',
  maximale_constructiesnelheid: 'Max snelheid (km/u)',
  typegoedkeuringsnummer: 'Typegoedkeuring',
  europese_voertuigcategorie: 'EU categorie',
  aanhangwagen_autonoom_geremd: 'Aanhanger geremd (kg)',
  aanhangwagen_middenas_geremd: 'Aanhanger middenas (kg)',
};

const RDW_HIDDEN = new Set([
  'datum_eerste_toelating',
  'vervaldatum_apk',
]);

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
  in_progress: 'bg-amber-900/30 text-amber-400 border-amber-500/30',
  done: 'bg-green-900/30 text-green-400 border-green-500/30',
  archived: 'bg-gray-700/30 text-gray-400 border-gray-500/30',
};

const STATUSES = ['created', 'in_progress', 'done', 'archived'] as const;
const OWNERSHIPS = ['owned', 'leased', 'rental', 'unknown'] as const;

type Party = { id: string; name: string } | null;
type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  mobile: string | null;
  email: string | null;
};

type Vehicle = {
  id: string;
  customer_id: string;
  kenteken: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  paint_code: string | null;
  fuel: string | null;
  body_type: string | null;
  wok: boolean;
  status: string;
  notes: string | null;
  plate_origin: string | null;
  rdw_snapshot: Record<string, string> | null;
  created_at: string;
  ownership: string | null;
  paint_type: string | null;
  transmission: string | null;
  adas_present: boolean;
  adas_note: string | null;
  key_tag: string | null;
  tyre_size: string | null;
  lease_company_id: string | null;
  insurer_id: string | null;
  driver_contact_id: string | null;
  customers?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  lease_company?: Party;
  insurer?: Party;
  driver_contact?: Contact | null;
};

type Inspection = {
  id: string;
  reference: string;
  status: InsStatus;
  purpose: string;
  finding_count: number;
  photo_count: number;
  total_hours: number;
  odometer_km: number | null;
  locked_at: string | null;
  created_at: string;
  staff: { id: string; name: string } | null;
};

type MapFinding = { id: string; reference: string; component_key: string; origin: string; hotspot_point: { x: number; y: number } | null };
type MapInspection = { id: string; reference: string; status: InsStatus; ins_findings: MapFinding[] };

type Activity = {
  inspections: Inspection[];
  jobs: { id: string; number: number; stage: string; intake_km: number | null; outtake_km: number | null; created_at: string; closed_at: string | null }[];
  offers: { id: string; offer_number: string | null; status: string; total_cents: number; created_at: string }[];
  invoices: { id: string; invoice_number: string | null; status: string; total_cents: number; created_at: string }[];
  appointments: { id: string; type: string; status: string; scheduled_date: string; scheduled_time: string; created_at: string }[];
  leads: { id: string; number: number; status: string; created_at: string }[];
  odometer: { km: number; at: string; source: 'job_out' | 'job_in' | 'inspection'; ref: string } | null;
};

type EditableField = {
  key: keyof Vehicle;
  label: string;
  type?: 'text' | 'number' | 'toggle';
};

const eur = (cents: number) => (cents / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('nl-NL');

function EditableRow({
  label,
  value,
  field,
  type = 'text',
  onSave,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  field: string;
  type?: 'text' | 'number' | 'toggle';
  onSave: (field: string, value: string | number | boolean | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    if (type === 'toggle') {
      onSave(field, !value);
      return;
    }
    setDraft(value != null ? String(value) : '');
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (type === 'number') {
      const num = trimmed ? parseInt(trimmed) : null;
      onSave(field, num);
    } else {
      onSave(field, trimmed || null);
    }
  }

  function cancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <dt className="text-sm text-ck-muted shrink-0">{label}</dt>
        <div className="flex items-center gap-1">
          <input
            type={type === 'number' ? 'number' : 'text'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') cancel();
            }}
            autoFocus
            className="w-48 rounded border border-ck-red bg-ck-dark-surface px-2 py-1 text-sm text-white focus:outline-none"
          />
          <button onClick={commit} className="p-1 text-green-400 hover:text-green-300">
            <Check size={14} />
          </button>
          <button onClick={cancel} className="p-1 text-ck-muted hover:text-white">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  const displayValue = type === 'toggle'
    ? (value ? 'Yes' : 'No')
    : (value != null && value !== '' ? String(value) : '—');

  return (
    <div className="group flex items-center justify-between">
      <dt className="text-sm text-ck-muted">{label}</dt>
      <dd className="flex items-center gap-2 text-sm text-ck-muted-light">
        {displayValue}
        <button
          onClick={startEdit}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-ck-muted hover:text-ck-red transition-opacity"
          title="Edit"
        >
          <Pencil size={12} />
        </button>
      </dd>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-ck-muted shrink-0">{label}</dt>
      <dd>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-52 rounded border border-ck-dark-border bg-ck-dark-surface px-2 py-1 text-sm text-white focus:border-ck-red focus:outline-none"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </dd>
    </div>
  );
}

export default function VehicleDetailPage() {
  const t = useTranslations('vh');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'nl' | 'en' | 'tr';
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mapInspection, setMapInspection] = useState<MapInspection | null>(null);
  const [componentNames, setComponentNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadVehicle = useCallback(async () => {
    const r = await fetch(`/api/vehicles/${id}`);
    const v = r.ok ? await r.json() : null;
    setVehicle(v);
    return v as Vehicle | null;
  }, [id]);

  useEffect(() => {
    loadVehicle().finally(() => setLoading(false));
    fetch(`/api/vehicles/${id}/activity`).then(r => r.ok ? r.json() : null).then(setActivity).catch(() => {});
    fetch('/api/customers').then(r => r.ok ? r.json() : []).then((rows: { id: string; name: string }[]) =>
      setCustomers(rows.map(c => ({ id: c.id, name: c.name })))
    ).catch(() => {});
  }, [id, loadVehicle]);

  // Damage map source: the latest locked inspection, else the latest one.
  useEffect(() => {
    if (!activity) return;
    const src = activity.inspections.find(i => i.status === 'VERGRENDELD') ?? activity.inspections[0];
    if (!src) { setMapInspection(null); return; }
    fetch(`/api/inspections/${src.id}`).then(r => r.ok ? r.json() : null).then(setMapInspection).catch(() => {});
  }, [activity]);

  useEffect(() => {
    fetch('/api/inspections/catalog/components').then(r => r.ok ? r.json() : []).then((rows: { key: string; name_nl: string; name_en: string | null; name_tr: string | null }[]) => {
      const names: Record<string, string> = {};
      rows.forEach(c => { names[c.key] = (locale === 'en' && c.name_en) || (locale === 'tr' && c.name_tr) || c.name_nl; });
      setComponentNames(names);
    }).catch(() => {});
  }, [locale]);

  useEffect(() => {
    if (!vehicle?.customer_id) return;
    fetch(`/api/customers/${vehicle.customer_id}/contacts`)
      .then(r => r.ok ? r.json() : [])
      .then(setContacts)
      .catch(() => {});
  }, [vehicle?.customer_id]);

  const saveField = useCallback(async (field: string, value: string | number | boolean | null) => {
    setSaving(true);
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      // PATCH returns the bare row; re-fetch to refresh the joined parties.
      await loadVehicle();
    }
    setSaving(false);
  }, [id, loadVehicle]);

  async function handleDelete() {
    if (!confirm(tCommon('confirm') + '?')) return;
    const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/voertuigen');
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setVehicle(prev => prev ? { ...prev, status: newStatus } : prev);
    }
  }

  // Unified activity timeline, newest first.
  const timeline = useMemo(() => {
    if (!activity) return [];
    type Item = { key: string; kind: 'inspection' | 'job' | 'offer' | 'invoice' | 'appointment' | 'lead'; at: string; title: string; status: string; href: string };
    const items: Item[] = [];
    activity.inspections.forEach(i => items.push({ key: 'i' + i.id, kind: 'inspection', at: i.created_at, title: i.reference, status: INS_STATUS_LABELS[i.status]?.[locale] ?? i.status, href: `/app/inspecties/${i.id}` }));
    activity.jobs.forEach(j => items.push({ key: 'j' + j.id, kind: 'job', at: j.created_at, title: `#${j.number}`, status: j.stage, href: `/app/jobs/${j.id}` }));
    activity.offers.forEach(o => items.push({ key: 'o' + o.id, kind: 'offer', at: o.created_at, title: `${o.offer_number ?? ''} · ${eur(o.total_cents)}`, status: o.status, href: `/app/offertes/${o.id}` }));
    activity.invoices.forEach(f => items.push({ key: 'f' + f.id, kind: 'invoice', at: f.created_at, title: `${f.invoice_number ?? ''} · ${eur(f.total_cents)}`, status: f.status, href: `/app/facturen/${f.id}` }));
    activity.appointments.forEach(a => items.push({ key: 'a' + a.id, kind: 'appointment', at: `${a.scheduled_date}T${a.scheduled_time}`, title: `${fmtDate(a.scheduled_date)} ${a.scheduled_time.slice(0, 5)} · ${a.type}`, status: a.status, href: `/app/afspraken/${a.id}` }));
    activity.leads.forEach(l => items.push({ key: 'l' + l.id, kind: 'lead', at: l.created_at, title: `#${l.number}`, status: l.status, href: `/app/leads/${l.id}` }));
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [activity, locale]);

  if (loading) return <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>;
  if (!vehicle) return <div className="p-8 text-center text-ck-muted">{tCommon('notFound')}</div>;

  const title = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || vehicle.kenteken || 'Vehicle';

  const fields: EditableField[] = [
    { key: 'kenteken', label: t('kenteken') },
    { key: 'plate_origin', label: t('plateOrigin') },
    { key: 'vin', label: t('vin') },
    { key: 'make', label: t('make') },
    { key: 'model', label: t('model') },
    { key: 'year', label: t('year'), type: 'number' },
    { key: 'colour', label: t('colour') },
    { key: 'paint_code', label: t('paintCode') },
    { key: 'fuel', label: t('fuel') },
    { key: 'body_type', label: t('bodyType') },
    { key: 'wok', label: t('wok'), type: 'toggle' },
  ];

  const advancedFields: EditableField[] = [
    { key: 'tyre_size', label: t('tyreSize') },
    { key: 'key_tag', label: t('keyTag') },
    { key: 'adas_present', label: t('adasPresent'), type: 'toggle' },
    { key: 'adas_note', label: t('adasNote') },
  ];

  const KIND_ICON = {
    inspection: <ClipboardCheck size={14} className="text-emerald-400" />,
    job: <Wrench size={14} className="text-amber-400" />,
    offer: <FileText size={14} className="text-green-400" />,
    invoice: <Receipt size={14} className="text-blue-400" />,
    appointment: <Calendar size={14} className="text-purple-400" />,
    lead: <Inbox size={14} className="text-orange-400" />,
  };

  const newInspectionHref = `/app/inspecties/nieuw?vehicle=${vehicle.id}&customer=${vehicle.customer_id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/voertuigen" className="text-ck-muted hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <ScreenBadge code="VH10" />
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          {vehicle.kenteken && (
            <span className="rounded bg-blue-900/30 px-2 py-0.5 text-xs font-mono text-blue-400">
              {vehicle.kenteken}
            </span>
          )}
          {vehicle.wok && (
            <span className="rounded bg-amber-900/30 px-2 py-0.5 text-xs text-amber-400">
              WOK
            </span>
          )}
          {activity?.odometer && (
            <span className="flex items-center gap-1 rounded bg-ck-dark-surface px-2 py-0.5 text-xs text-ck-muted-light" title={`${t(`odometerSource_${activity.odometer.source}`)} ${activity.odometer.ref} · ${fmtDate(activity.odometer.at)}`}>
              <Gauge size={12} /> {activity.odometer.km.toLocaleString('nl-NL')} km
            </span>
          )}
          {saving && (
            <span className="text-xs text-ck-muted animate-pulse">Saving...</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={newInspectionHref}
            className="flex items-center gap-2 rounded-lg bg-ck-red px-3 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
          >
            <Plus size={14} /> {t('newInspection')}
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={14} /> {tCommon('delete')}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase text-ck-muted">{t('status')}</h2>
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                vehicle.status === s
                  ? STATUS_COLORS[s]
                  : 'border-ck-dark-border text-ck-muted hover:text-white hover:border-ck-muted/50'
              }`}
            >
              {t(`status_${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Editable vehicle details */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase text-ck-muted">
              {tCommon('details')}
              <span className="text-[10px] font-normal normal-case text-ck-muted/60">
                (hover to edit)
              </span>
            </h2>
            <dl className="space-y-3">
              {fields.map(f => (
                <EditableRow
                  key={f.key}
                  label={f.label}
                  value={vehicle[f.key] as string | number | boolean | null}
                  field={f.key}
                  type={f.type}
                  onSave={saveField}
                />
              ))}
              <div className="border-t border-ck-dark-border pt-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('advanced')}</span>
              </div>
              <SelectRow
                label={t('paintType')}
                value={vehicle.paint_type ?? ''}
                placeholder="—"
                options={['solid', 'metallic', 'pearl', 'matte', 'unknown'].map(v => ({ value: v, label: t(`paintType_${v}`) }))}
                onChange={v => saveField('paint_type', v || null)}
              />
              <SelectRow
                label={t('transmission')}
                value={vehicle.transmission ?? ''}
                placeholder="—"
                options={['manual', 'automatic', 'unknown'].map(v => ({ value: v, label: t(`transmission_${v}`) }))}
                onChange={v => saveField('transmission', v || null)}
              />
              {advancedFields.map(f => (
                <EditableRow
                  key={f.key}
                  label={f.label}
                  value={vehicle[f.key] as string | number | boolean | null}
                  field={f.key}
                  type={f.type}
                  onSave={saveField}
                />
              ))}
              <div className="flex justify-between border-t border-ck-dark-border pt-3">
                <dt className="text-sm text-ck-muted">{t('lastOdometer')}</dt>
                <dd className="text-sm text-ck-muted-light">
                  {activity?.odometer
                    ? `${activity.odometer.km.toLocaleString('nl-NL')} km · ${t(`odometerSource_${activity.odometer.source}`)} ${activity.odometer.ref} · ${fmtDate(activity.odometer.at)}`
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-ck-muted">{tCommon('create')}</dt>
                <dd className="text-sm text-ck-muted-light">{fmtDate(vehicle.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Inspections */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-ck-muted">
                <ClipboardCheck size={14} /> {t('inspections')}
                {activity && <span className="text-[10px] font-normal text-ck-muted/60">({activity.inspections.length})</span>}
              </h2>
              <Link href={newInspectionHref} className="flex items-center gap-1 text-xs font-medium text-ck-red hover:underline">
                <Plus size={12} /> {t('newInspection')}
              </Link>
            </div>
            {!activity ? (
              <p className="text-sm text-ck-muted">{tCommon('loading')}</p>
            ) : activity.inspections.length === 0 ? (
              <p className="text-sm text-ck-muted">{t('noInspections')}</p>
            ) : (
              <div className="divide-y divide-ck-dark-border">
                {activity.inspections.map(i => (
                  <div key={i.id} className="flex items-center gap-3 py-2.5">
                    <Link href={`/app/inspecties/${i.id}`} className="font-mono text-sm text-white hover:text-ck-red">
                      {i.reference}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${INS_STATUS_COLORS[i.status] ?? ''}`}>
                      {INS_STATUS_LABELS[i.status]?.[locale] ?? i.status}
                    </span>
                    <span className="text-xs text-ck-muted">
                      {t('findings')}: {i.finding_count} · {i.photo_count} {t('photos')} · {Number(i.total_hours).toFixed(1)} u
                    </span>
                    <span className="ml-auto text-xs text-ck-muted">
                      {i.staff?.name ? `${i.staff.name} · ` : ''}{fmtDate(i.created_at)}
                    </span>
                    {i.status === 'VERGRENDELD' && (
                      <Link href={`/app/inspecties/${i.id}/rapport`} className="text-ck-muted hover:text-white" title={t('viewReport')}>
                        <FileDown size={14} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Damage map from the latest (locked) inspection */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase text-ck-muted">{t('damageMap')}</h2>
              {mapInspection && (
                <Link href={`/app/inspecties/${mapInspection.id}`} className="text-xs text-ck-red hover:underline">
                  {t('damageMapFrom', { ref: mapInspection.reference })}
                </Link>
              )}
            </div>
            {!mapInspection || mapInspection.ins_findings.length === 0 ? (
              <p className="text-sm text-ck-muted">{t('noDamageMap')}</p>
            ) : (
              <div className="flex gap-6">
                <VehicleDamageMap
                  slots={COMPONENT_SLOTS}
                  className="w-[200px] flex-none"
                  showLabels={false}
                  markers={mapInspection.ins_findings.flatMap<MapMarker>(f => {
                    const point = f.hotspot_point ?? defaultPointForKey(f.component_key);
                    return point ? [{ id: f.id, point, label: f.reference, muted: f.origin === 'pre_existent' }] : [];
                  })}
                  onMarkerClick={() => router.push(`/app/inspecties/${mapInspection.id}`)}
                />
                <ul className="min-w-0 flex-1 space-y-1">
                  {mapInspection.ins_findings.map(f => (
                    <li key={f.id} className="flex items-center gap-2 text-xs text-ck-muted-light">
                      <span className={`h-2 w-2 rounded-full ${f.origin === 'pre_existent' ? 'bg-ck-muted' : 'bg-ck-red'}`} />
                      <span className="font-mono">{f.reference}</span>
                      <span className="truncate">{componentNames[f.component_key] ?? f.component_key}</span>
                      {f.origin === 'pre_existent' && <span className="text-ck-muted">({t('preExisting')})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">{t('activity')}</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-ck-muted">{t('noActivity')}</p>
            ) : (
              <div className="divide-y divide-ck-dark-border">
                {timeline.map(item => (
                  <Link key={item.key} href={item.href} className="flex items-center gap-3 py-2 hover:bg-ck-dark-surface/50 -mx-2 px-2 rounded">
                    {KIND_ICON[item.kind]}
                    <span className="text-xs uppercase text-ck-muted w-24 shrink-0">{t(`act_${item.kind}`)}</span>
                    <span className="text-sm text-white truncate">{item.title}</span>
                    <span className="text-xs text-ck-muted">{item.status}</span>
                    <span className="ml-auto text-xs text-ck-muted shrink-0">{fmtDate(item.at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Owner & parties */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">{t('owner')}</h2>
            {vehicle.customers ? (
              <Link
                href={`/app/klanten/${vehicle.customers.id}`}
                className="flex items-center gap-3 rounded-lg border border-ck-dark-border p-4 hover:border-ck-muted/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-900/30">
                  <User size={18} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{vehicle.customers.name}</p>
                  <p className="text-xs text-ck-muted">
                    {[vehicle.customers.email, vehicle.customers.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-ck-muted">{tCommon('notLinked')}</p>
            )}

            <h3 className="mt-5 mb-3 text-xs font-semibold uppercase text-ck-muted">{t('parties')}</h3>
            <dl className="space-y-3">
              <SelectRow
                label={t('ownership')}
                value={vehicle.ownership ?? ''}
                placeholder={t('ownership_unknown')}
                options={OWNERSHIPS.map(o => ({ value: o, label: t(`ownership_${o}`) }))}
                onChange={v => saveField('ownership', v || null)}
              />
              <SelectRow
                label={t('leaseCompany')}
                value={vehicle.lease_company_id ?? ''}
                placeholder={t('none')}
                options={customers.map(c => ({ value: c.id, label: c.name }))}
                onChange={v => saveField('lease_company_id', v || null)}
              />
              <SelectRow
                label={t('insurer')}
                value={vehicle.insurer_id ?? ''}
                placeholder={t('none')}
                options={customers.map(c => ({ value: c.id, label: c.name }))}
                onChange={v => saveField('insurer_id', v || null)}
              />
              <SelectRow
                label={t('driverContact')}
                value={vehicle.driver_contact_id ?? ''}
                placeholder={t('none')}
                options={contacts.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))}
                onChange={v => saveField('driver_contact_id', v || null)}
              />
              {vehicle.driver_contact && (
                <p className="text-xs text-ck-muted text-right">
                  {[vehicle.driver_contact.mobile ?? vehicle.driver_contact.phone, vehicle.driver_contact.email].filter(Boolean).join(' · ')}
                </p>
              )}
            </dl>
          </div>

          {/* Notes: timestamped, newest first */}
          <NotesPanel entityType="vehicle" entityId={vehicle.id} />

          {/* Legacy free-text description */}
          {vehicle.notes && (
            <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
              <h2 className="mb-2 text-sm font-semibold uppercase text-ck-muted">{t('legacyNotes')}</h2>
              <p className="whitespace-pre-wrap text-sm text-ck-muted-light">{vehicle.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* RDW data */}
      {vehicle.rdw_snapshot && Object.keys(vehicle.rdw_snapshot).length > 0 && (
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">RDW</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(vehicle.rdw_snapshot)
              .filter(([key]) => !RDW_HIDDEN.has(key))
              .map(([key, val]) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-sm text-ck-muted truncate">{RDW_LABELS[key] ?? key}</dt>
                  <dd className="text-sm text-ck-muted-light shrink-0">{val || '—'}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}
    </div>
  );
}
