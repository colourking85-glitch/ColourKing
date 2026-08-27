'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, User, Pencil, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

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
  customers?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
};

type EditableField = {
  key: keyof Vehicle;
  label: string;
  type?: 'text' | 'number' | 'toggle';
};

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

export default function VehicleDetailPage() {
  const t = useTranslations('vh');
  const tCommon = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(v => {
        setVehicle(v);
        setNotes(v?.notes ?? '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const saveField = useCallback(async (field: string, value: string | number | boolean | null) => {
    setSaving(true);
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVehicle(prev => prev ? { ...prev, ...updated } : prev);
    }
    setSaving(false);
  }, [id]);

  async function saveNotes() {
    setSaving(true);
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVehicle(prev => prev ? { ...prev, ...updated } : prev);
      setNotesDirty(false);
    }
    setSaving(false);
  }

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
          {saving && (
            <span className="text-xs text-ck-muted animate-pulse">Saving...</span>
          )}
        </div>
        <div className="flex gap-2">
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
            <div className="flex justify-between">
              <dt className="text-sm text-ck-muted">{tCommon('create')}</dt>
              <dd className="text-sm text-ck-muted-light">{new Date(vehicle.created_at).toLocaleDateString('nl-NL')}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          {/* Owner */}
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
          </div>

          {/* Notes / extra definition */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">{t('notes')}</h2>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
              placeholder={t('notesPlaceholder')}
              rows={5}
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-muted/50 focus:border-ck-red focus:outline-none resize-y"
            />
            {notesDirty && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-ck-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
                >
                  <Check size={12} /> {tCommon('save')}
                </button>
              </div>
            )}
          </div>
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
