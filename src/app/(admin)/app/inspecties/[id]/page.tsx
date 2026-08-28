'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Printer, Link2, FileDown, Camera } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { PhotoCapture } from '@/components/ui/PhotoCapture';
import {
  STATUS_LABELS, STATUS_COLORS, isTerminal,
  type InsStatus
} from '@/modules/inspectie/machine';

// ---------- types ----------

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
  blend_components: string[] | null;
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
  source: string | null;
};

type Photo = {
  id: string;
  reference: string;
  sequence_no: number;
  finding_id: string | null;
  shot_key: string | null;
  kind: string;
  storage_path: string;
  sha256: string | null;
  captured_at: string | null;
  caption: string | null;
};

type Approval = {
  id: string;
  role: string;
  signer_name: string;
  signer_user_id: string | null;
  identification: string | null;
  statement_text: string | null;
  signature_path: string | null;
  document_hash: string | null;
  signed_at: string;
};

type Snapshot = {
  id: string;
  snapshot_hash: string;
  pdf_path: string | null;
  pdf_hash: string | null;
  created_at: string;
};

type InsEvent = {
  id: string;
  event_type: string;
  actor_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type Inspection = {
  id: string;
  reference: string;
  status: InsStatus;
  purpose: string | null;
  licence_plate: string | null;
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
  inspector_id: string | null;
  started_at: string | null;
  submitted_at: string | null;
  locked_at: string | null;
  created_at: string;
  vehicles: { id: string; kenteken: string; make: string; model: string } | null;
  customers: { id: string; name: string; email: string } | null;
  staff: { id: string; name: string } | null;
  ins_findings: Finding[];
  ins_photos: Photo[];
  ins_approvals: Approval[];
  ins_snapshots: Snapshot[];
  ins_events: InsEvent[];
};

// ---------- helpers ----------

const num = (n: number) => n.toFixed(1).replace('.', ',');
const hrs = (n: number) => n ? num(n) + ' u' : '—';
const eur = (cents: number) => '€ ' + Math.round(cents / 100).toLocaleString('nl-NL');
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
};

const SEV: Record<number, { label: string; bar: string; color: string }> = {
  1: { label: 'Licht', bar: '●○○○', color: 'text-gray-400' },
  2: { label: 'Matig', bar: '●●○○', color: 'text-amber-400' },
  3: { label: 'Zwaar', bar: '●●●○', color: 'text-orange-500' },
  4: { label: 'Zeer zwaar', bar: '●●●●', color: 'text-red-500' },
};

const DISP: Record<string, string> = {
  herstellen: 'Herstellen',
  vervangen: 'Vervangen',
  onderzoeken: 'Onderzoeken',
  geen_actie: 'Geen actie',
};

type ViewTab = 'rapport' | 'bevindingen' | 'verificatie';
type FindingFilter = 'alles' | 'herstellen' | 'vervangen' | 'onderzoeken' | 'pre';

// ---------- component ----------

export default function InspectieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('in');
  const tCommon = useTranslations('common');

  const [ins, setIns] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [view, setView] = useState<ViewTab>('rapport');
  const [selectedRef, setSelectedRef] = useState<string>('');
  const [filter, setFilter] = useState<FindingFilter>('alles');
  const [showCamera, setShowCamera] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/inspections/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Not found')))
      .then((data: Inspection) => {
        setIns(data);
        if (data.ins_findings?.length > 0) {
          setSelectedRef(data.ins_findings[0].reference);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const findings = ins?.ins_findings || [];
  const photos = ins?.ins_photos || [];
  const guidedPhotos = photos.filter(p => p.kind === 'guided');
  const approvals = ins?.ins_approvals || [];
  const snapshots = ins?.ins_snapshots || [];
  const events = ins?.ins_events || [];

  const inScopeFindings = findings.filter(f => f.origin !== 'pre_existent');
  const preFindings = findings.filter(f => f.origin === 'pre_existent');

  const repairTotal = inScopeFindings.reduce((a, f) => a + f.repair_hours, 0);
  const paintTotal = inScopeFindings.reduce((a, f) => a + f.paint_hours, 0);
  const partCount = inScopeFindings.reduce((a, f) => a + (f.ins_finding_parts?.length || 0), 0);

  const dispCounts = useMemo(() => {
    const c: Record<string, number> = { herstellen: 0, vervangen: 0, onderzoeken: 0 };
    inScopeFindings.forEach(f => { if (c[f.disposition] !== undefined) c[f.disposition]++; });
    return c;
  }, [inScopeFindings]);

  const filteredFindings = useMemo(() => {
    if (filter === 'alles') return findings;
    if (filter === 'pre') return preFindings;
    return findings.filter(f => f.disposition === filter);
  }, [findings, preFindings, filter]);

  const selectedFinding = findings.find(f => f.reference === selectedRef) || findings[0];
  const selectedPhotos = selectedFinding
    ? photos.filter(p => p.finding_id === selectedFinding.id)
    : [];

  function scrollToFinding(ref: string) {
    setSelectedRef(ref);
    const el = document.getElementById('bev-' + ref);
    if (el && scrollRef.current) {
      const top = el.getBoundingClientRect().top - scrollRef.current.getBoundingClientRect().top;
      scrollRef.current.scrollTop += top - 20;
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-ck-muted">{tCommon('loading')}</div>
      </div>
    );
  }

  if (error || !ins) {
    return (
      <div className="flex h-[calc(100vh-80px)] flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Inspectie niet gevonden'}</p>
        <Link href="/app/inspecties" className="text-sm text-ck-red hover:underline">
          {tCommon('back')}
        </Link>
      </div>
    );
  }

  const locked = isTerminal(ins.status);
  const snapshot = snapshots[0];
  const inspectorApproval = approvals.find(a => a.role === 'inspector');
  const customerApproval = approvals.find(a => a.role === 'customer');

  return (
    <div className="-m-6 flex h-[calc(100vh-48px)] flex-col overflow-hidden bg-ck-dark">
      {/* ─── Header ─── */}
      <header className="flex-none border-b border-ck-dark-border bg-ck-dark-card">
        <div className="flex items-center gap-4 px-5 h-[56px]">
          <Link href="/app/inspecties" className="flex h-8 w-8 items-center justify-center rounded-lg text-ck-muted hover:bg-ck-dark-surface hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <ScreenBadge code="IN10" />
            <div className="leading-tight">
              <span className="text-sm font-semibold text-white">Schadeopname</span>
              <span className="ml-2 font-mono text-xs text-ck-muted">{ins.reference}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-ck-dark-border pl-4 ml-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[ins.status]}`}>
              {STATUS_LABELS[ins.status].nl}
            </span>
            {ins.locked_at && (
              <span className="text-xs text-ck-muted">{fmtDateTime(ins.locked_at)}</span>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white">
              <Printer size={14} /> Printen
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white">
              <Link2 size={14} /> Deellink
            </button>
            {!locked && (
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white"
              >
                <Camera size={14} /> Foto
              </button>
            )}
            <Link
              href={`/app/inspecties/${id}/rapport`}
              className="flex items-center gap-1.5 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover"
            >
              <FileDown size={14} /> PDF downloaden
            </Link>
          </div>
        </div>

        {/* Vehicle bar */}
        <div className="flex items-center gap-5 px-5 pb-2.5 text-xs text-ck-muted overflow-hidden whitespace-nowrap">
          <span className="font-semibold text-white">{ins.make} {ins.model}</span>
          {ins.licence_plate && (
            <span className="rounded border border-ck-dark-border px-1.5 py-0.5 font-mono text-white">{ins.licence_plate}</span>
          )}
          {ins.odometer_km && <span>{ins.odometer_km.toLocaleString('nl-NL')} km</span>}
          {ins.first_reg_date && <span>Bouwjaar {new Date(ins.first_reg_date).getFullYear()}{ins.fuel ? ' · ' + ins.fuel : ''}</span>}
          {ins.rdw_verified && <span>RDW gecontroleerd</span>}
          {ins.staff && <span>Opnemer {ins.staff.name}</span>}
          {customerApproval && <span>Akkoord {customerApproval.signer_name} · elektronisch ondertekend</span>}
        </div>
      </header>

      {/* ─── Body: 3-panel layout ─── */}
      <div className="flex flex-1 min-h-0">

        {/* ─── Left sidebar: document outline + findings rail ─── */}
        <nav className="flex w-[260px] flex-none flex-col border-r border-ck-dark-border bg-ck-dark-card min-h-0">
          <div className="px-4 pt-4 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Documentindeling</span>
          </div>
          <div className="flex flex-col gap-px px-2 pb-2">
            {[
              { no: '01', title: 'Samenvatting', meta: 'blad 1' },
              { no: '02', title: 'Fotoserie', meta: String(guidedPhotos.length) },
              { no: '03', title: 'Bevindingen', meta: String(inScopeFindings.length) },
              { no: '04', title: 'Pre-existent', meta: String(preFindings.length) },
              { no: '05', title: 'Verificatie', meta: 'hash' },
            ].map(s => (
              <button
                key={s.no}
                onClick={() => { setView('rapport'); }}
                className="flex items-center gap-2 rounded px-2.5 py-1.5 text-left hover:bg-ck-dark-surface"
              >
                <span className="w-4 font-mono text-[11px] text-ck-muted">{s.no}</span>
                <span className="flex-1 text-[13px] text-ck-muted-light">{s.title}</span>
                <span className="font-mono text-[11px] text-ck-muted">{s.meta}</span>
              </button>
            ))}
          </div>

          {/* Findings list */}
          <div className="flex items-center justify-between border-t border-ck-dark-border px-4 pt-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Bevindingen</span>
            <span className="font-mono text-[11px] text-ck-muted">{findings.length}</span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1 px-4 pb-2">
            {([['alles', 'Alle'], ['herstellen', 'Herstel'], ['vervangen', 'Vervang'], ['onderzoeken', 'Onderz.'], ['pre', 'Pre-exist.']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  filter === key
                    ? 'bg-ck-red text-white'
                    : 'bg-ck-dark-surface text-ck-muted hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Findings rail */}
          <div className="flex-1 overflow-auto px-2 pb-4">
            {filteredFindings.map(f => {
              const sev = SEV[f.severity] || SEV[2];
              const isPre = f.origin === 'pre_existent';
              const selected = f.reference === selectedRef;
              return (
                <button
                  key={f.id}
                  onClick={() => scrollToFinding(f.reference)}
                  className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left ${
                    selected ? 'bg-ck-red/10' : 'hover:bg-ck-dark-surface'
                  }`}
                >
                  <span className="w-7 font-mono text-[11px] text-ck-muted">{f.reference}</span>
                  <span className={`h-1.5 w-1.5 rounded-full flex-none ${sev.color.replace('text-', 'bg-')}`} />
                  <span className="flex-1 truncate text-[12px] text-ck-muted-light">{f.component_key}</span>
                  <span className="font-mono text-[11px] text-ck-muted">
                    {isPre ? '—' : num(f.repair_hours + f.paint_hours)}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ─── Main content ─── */}
        <main className="flex flex-1 flex-col min-w-0 min-h-0">
          {/* Toolbar */}
          <div className="flex items-center gap-4 border-b border-ck-dark-border bg-ck-dark-card px-5 h-[44px] flex-none">
            <div className="flex gap-0.5 rounded-lg bg-ck-dark-surface p-0.5">
              {([['rapport', 'Rapport'], ['bevindingen', 'Bevindingen'], ['verificatie', 'Verificatie']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`rounded-md px-3.5 py-1 text-[13px] font-medium ${
                    view === key
                      ? 'bg-ck-dark-card text-white shadow'
                      : 'text-ck-muted hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-ck-muted">
              {view === 'rapport' && `${ins.photo_count} foto's · gerenderd uit snapshot`}
              {view === 'bevindingen' && `${findings.length} bevindingen · ${partCount} onderdelen`}
              {view === 'verificatie' && 'append-only gebeurtenissenlog'}
            </span>
            <div className="flex-1" />
            {snapshot && (
              <span className="font-mono text-[11px] text-ck-muted">
                snapshot {snapshot.snapshot_hash?.slice(0, 4)}…{snapshot.snapshot_hash?.slice(-4)}
              </span>
            )}
          </div>

          {/* Scrollable content area */}
          <div ref={scrollRef} className="flex-1 overflow-auto p-6">

            {/* ═══ Rapport view ═══ */}
            {view === 'rapport' && (
              <div className="mx-auto flex max-w-[820px] flex-col gap-6">
                {/* Page 1: Summary */}
                <article className="rounded bg-ck-dark-card shadow-lg">
                  <div className="p-10 pb-8">
                    {/* Page header */}
                    <div className="flex items-baseline justify-between border-b-2 border-white pb-2.5">
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-white">ColourKing Autoschade</span>
                      <span className="font-mono text-[11px] text-ck-muted">{ins.reference} · blad 1</span>
                    </div>

                    <h1 className="mt-6 text-3xl font-bold text-white">Schadeopname</h1>
                    <p className="mt-1 text-sm text-ck-muted">
                      Opname van de vastgestelde staat van het voertuig en de voorgestelde herstelwijze.
                      Geen expertiserapport — opgesteld door de herstellende partij.
                    </p>

                    {/* Vehicle details grid */}
                    <div className="mt-6 grid grid-cols-2 gap-x-10 border-t border-ck-dark-border">
                      {[
                        ['Kenteken', ins.licence_plate || '—'],
                        ['Referentie', ins.reference],
                        ['Merk / model', `${ins.make || ''} ${ins.model || ''}`.trim() || '—'],
                        ['Soort opname', ins.purpose ? t(`purposes.${ins.purpose}`) : '—'],
                        ['VIN', ins.vin || '—'],
                        ['Schadedatum', ins.event_date ? fmtDate(ins.event_date) : '—'],
                        ['Eerste toelating', ins.first_reg_date ? fmtDate(ins.first_reg_date) : '—'],
                        ['Toedracht', ins.event_description || '—'],
                        ['Kilometerstand', ins.odometer_km ? ins.odometer_km.toLocaleString('nl-NL') + ' km' : '—'],
                        ['Opnamedatum', ins.started_at ? fmtDateTime(ins.started_at) : fmtDateTime(ins.created_at)],
                        ['Brandstof', ins.fuel || '—'],
                        ['RDW-controle', ins.rdw_verified ? 'Geverifieerd' : '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-ck-dark-border py-1.5">
                          <span className="text-[12px] text-ck-muted">{k}</span>
                          <span className="text-[13px] font-medium text-white text-right">{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* KPIs */}
                    <h2 className="mt-8 mb-3 text-lg font-semibold text-white">Samenvatting</h2>
                    <div className="grid grid-cols-4 gap-px overflow-hidden rounded border border-ck-dark-border bg-ck-dark-border">
                      {[
                        { value: findings.length, label: `Bevindingen (incl. ${preFindings.length} pre-existent)` },
                        { value: ins.photo_count, label: "Foto's vastgelegd" },
                        { value: num(repairTotal), label: 'Uur plaatwerk' },
                        { value: num(paintTotal), label: 'Uur spuitwerk' },
                      ].map(kpi => (
                        <div key={kpi.label} className="bg-ck-dark-card px-4 py-3">
                          <div className="text-2xl font-semibold tabular-nums text-white">{kpi.value}</div>
                          <div className="mt-0.5 text-[11px] text-ck-muted">{kpi.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Disposition + Hours */}
                    <div className="mt-6 grid grid-cols-2 gap-8">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Herstelwijze</span>
                        <div className="mt-3 space-y-2.5">
                          {[
                            ['Herstellen', dispCounts.herstellen, 'bg-orange-500'],
                            ['Vervangen', dispCounts.vervangen, 'bg-blue-500'],
                            ['Nader onderzoeken', dispCounts.onderzoeken, 'bg-gray-400'],
                            ['Pre-existent · buiten opdracht', preFindings.length, 'bg-ck-dark-border'],
                          ].map(([label, count, color]) => (
                            <div key={label as string}>
                              <div className="flex justify-between text-[12px] text-ck-muted-light">
                                <span>{label as string}</span>
                                <span className="tabular-nums text-ck-muted">{count as number}</span>
                              </div>
                              <div className="mt-1 h-1 rounded-full bg-ck-dark-surface overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${color as string}`}
                                  style={{ width: `${inScopeFindings.length ? Math.round(((count as number) / inScopeFindings.length) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Uren en indicatie</span>
                        <div className="mt-3 border-t border-ck-dark-border">
                          {[
                            ['Plaatwerk', hrs(repairTotal)],
                            ['Spuitwerk', hrs(paintTotal)],
                            ['Voorbewerking', hrs(Math.round(paintTotal * 0.55 * 10) / 10)],
                            ['Onderdelen', `${partCount} posities`],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-ck-dark-border py-1.5 text-[13px]">
                              <span className="text-ck-muted-light">{k}</span>
                              <span className="font-medium tabular-nums text-white">{v}</span>
                            </div>
                          ))}
                        </div>

                        {ins.indicative_total_cents != null && ins.indicative_total_cents > 0 && (
                          <div className="mt-3 rounded bg-ck-dark-surface p-3">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[12px] text-ck-muted">Indicatief richtbedrag</span>
                              <span className="text-xl font-semibold tabular-nums text-white">{eur(ins.indicative_total_cents)}</span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-ck-muted">
                              Excl. btw. Indicatief richtbedrag op basis van de opname. De definitieve prijsopgave volgt in de offerte.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Caveats */}
                    {(findings.some(f => f.hidden_damage_possible) || findings.some(f => f.adas_possible) || preFindings.length > 0) && (
                      <>
                        <h2 className="mt-8 mb-3 text-lg font-semibold text-white">Voorbehoud</h2>
                        <div className="overflow-hidden rounded border border-ck-dark-border">
                          {findings.some(f => f.hidden_damage_possible) && (
                            <div className="flex gap-3 border-b border-ck-dark-border px-4 py-2.5">
                              <span className="flex-none rounded bg-orange-900/50 px-2 py-0.5 text-[11px] font-semibold text-orange-300">Verborgen</span>
                              <p className="text-[13px] leading-relaxed text-ck-muted-light">
                                Bij {findings.filter(f => f.hidden_damage_possible).map(f => f.reference).join(', ')} is verborgen schade mogelijk.
                                Wat na demontage aan het licht komt, valt buiten deze opname en wordt als meerwerk ter goedkeuring aangeboden.
                              </p>
                            </div>
                          )}
                          {findings.some(f => f.adas_possible) && (
                            <div className="flex gap-3 border-b border-ck-dark-border px-4 py-2.5">
                              <span className="flex-none rounded bg-blue-900/50 px-2 py-0.5 text-[11px] font-semibold text-blue-300">ADAS</span>
                              <p className="text-[13px] leading-relaxed text-ck-muted-light">
                                Bij {findings.filter(f => f.adas_possible).map(f => f.reference).join(', ')} is kalibratie van rijhulpsystemen mogelijk vereist.
                              </p>
                            </div>
                          )}
                          {preFindings.length > 0 && (
                            <div className="flex gap-3 px-4 py-2.5">
                              <span className="flex-none rounded bg-gray-800 px-2 py-0.5 text-[11px] font-semibold text-gray-300">Pre-existent</span>
                              <p className="text-[13px] leading-relaxed text-ck-muted-light">
                                {preFindings.length} posities zijn als bestaande schade vastgelegd en vallen buiten de opdracht.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Signatures */}
                    <div className="mt-10 grid grid-cols-2 gap-8">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Opgenomen door</span>
                        <div className="mt-1 flex h-14 items-end border-b border-white pb-1.5">
                          <span className="text-sm italic text-ck-muted">
                            {inspectorApproval ? inspectorApproval.signer_name : ins.staff?.name || '—'}
                          </span>
                        </div>
                        <span className="mt-1.5 block text-[11px] text-ck-muted">
                          {ins.staff?.name || '—'} · {ins.started_at ? fmtDateTime(ins.started_at) : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Akkoord klant</span>
                        <div className="mt-1 flex h-14 items-end border-b border-white pb-1.5">
                          {customerApproval ? (
                            <span className="text-lg italic text-white">{customerApproval.signer_name}</span>
                          ) : (
                            <span className="text-sm text-ck-muted">—</span>
                          )}
                        </div>
                        <span className="mt-1.5 block text-[11px] text-ck-muted">
                          {customerApproval
                            ? `${customerApproval.signer_name} · elektronisch ondertekend · ${fmtDateTime(customerApproval.signed_at)}`
                            : 'Niet ondertekend'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Page 2: Guided photo series */}
                {guidedPhotos.length > 0 && (
                  <article className="rounded bg-ck-dark-card shadow-lg p-10">
                    <div className="flex items-baseline justify-between border-b border-ck-dark-border pb-2.5">
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-white">Fotoserie · geleide opnames</span>
                      <span className="font-mono text-[11px] text-ck-muted">blad 2</span>
                    </div>
                    <p className="mt-3 mb-5 text-[13px] text-ck-muted">
                      Vaste opnames rondom het voertuig. Alle bestanden zijn write-once vastgelegd met sha256.
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                      {guidedPhotos.map(p => (
                        <div key={p.id}>
                          <div className="relative aspect-[4/3] overflow-hidden rounded bg-ck-dark-surface">
                            <div className="absolute inset-0" style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)'
                            }} />
                            <span className="absolute bottom-1.5 left-1.5 rounded bg-ck-dark-card px-1 py-0.5 font-mono text-[10px] text-ck-muted">
                              {p.reference}
                            </span>
                          </div>
                          <span className="mt-1 block text-[11px] text-ck-muted-light">
                            {p.caption || p.shot_key || p.reference}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                {/* Pages 3+: Findings */}
                {inScopeFindings.length > 0 && (
                  <article className="rounded bg-ck-dark-card shadow-lg p-10">
                    <div className="flex items-baseline justify-between border-b border-ck-dark-border pb-2.5">
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-white">
                        Bevindingen {inScopeFindings[0]?.reference}–{inScopeFindings[inScopeFindings.length - 1]?.reference}
                      </span>
                      <span className="font-mono text-[11px] text-ck-muted">blad 3</span>
                    </div>

                    {inScopeFindings.map(f => {
                      const sev = SEV[f.severity] || SEV[2];
                      const findingPhotos = photos.filter(p => p.finding_id === f.id);
                      const selected = f.reference === selectedRef;
                      return (
                        <section
                          key={f.id}
                          id={`bev-${f.reference}`}
                          onClick={() => setSelectedRef(f.reference)}
                          className={`border-b border-ck-dark-border py-5 cursor-pointer scroll-mt-5 ${
                            selected ? '-mx-3 px-3 bg-ck-red/5 rounded' : ''
                          }`}
                        >
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono text-sm font-semibold text-white">{f.reference}</span>
                            <h3 className="flex-1 text-lg font-semibold text-white">{f.component_key}</h3>
                            <span className={`font-mono text-[12px] tracking-wider ${sev.color}`}>{sev.bar}</span>
                            <span className="text-[11px] text-ck-muted">{sev.label}</span>
                          </div>

                          <div className="mt-3 grid grid-cols-[240px_1fr] gap-5">
                            {/* Photos */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {findingPhotos.slice(0, 4).map(p => (
                                <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded bg-ck-dark-surface">
                                  <div className="absolute inset-0" style={{
                                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)'
                                  }} />
                                  <span className="absolute bottom-1 left-1 rounded bg-ck-dark-card px-1 py-0.5 font-mono text-[9px] text-ck-muted">
                                    {p.reference}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Detail rows */}
                            <div>
                              {[
                                ['Zone', f.sub_location ? `${f.component_key} · ${f.sub_location}` : f.component_key],
                                ['Schade', f.damage_types?.join(', ') || '—'],
                                ['Herstelwijze', f.repair_technique || DISP[f.disposition] || '—'],
                                ['Lakwerk', f.paint_required ? (f.paint_operation || 'Paneel') + (f.blend_components?.length ? ' · inspuiten ' + f.blend_components.join(', ') : '') : 'Niet vereist'],
                                ['Uren', `Plaatwerk ${hrs(f.repair_hours)} · Spuitwerk ${hrs(f.paint_hours)}`],
                                ...(f.ins_finding_parts?.length ? [['Onderdelen', f.ins_finding_parts.map(p => `${p.description}${p.part_number ? ' (' + p.part_number + ')' : ''} × ${p.qty}`).join(' · ')]] : []),
                                ...(f.hidden_damage_possible && f.hidden_damage_note ? [['Voorbehoud', f.hidden_damage_note]] : []),
                                ...(f.adas_possible ? [['Rijhulpsystemen', 'Kalibratie mogelijk vereist']] : []),
                              ].map(([k, v]) => (
                                <div key={k} className="grid grid-cols-[112px_1fr] gap-3 border-b border-ck-dark-border py-1">
                                  <span className="text-[12px] text-ck-muted">{k}</span>
                                  <span className="text-[13px] text-ck-muted-light">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>
                      );
                    })}
                  </article>
                )}

                {/* Pre-existing */}
                {preFindings.length > 0 && (
                  <article className="rounded bg-ck-dark-card shadow-lg p-10">
                    <div className="flex items-baseline justify-between border-b border-ck-dark-border pb-2.5">
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-white">Pre-existente schade · buiten opdracht</span>
                    </div>
                    <p className="mt-3 mb-4 text-[13px] text-ck-muted">
                      Deze posities zijn vastgesteld bij de opname, vallen buiten de opdracht en zijn niet meegerekend in uren of richtbedrag.
                    </p>
                    {preFindings.map(f => {
                      const findingPhotos = photos.filter(p => p.finding_id === f.id);
                      return (
                        <div key={f.id} className="grid grid-cols-[120px_1fr_130px] items-start gap-4 border-t border-ck-dark-border py-3">
                          <div className="flex gap-1.5">
                            {findingPhotos.slice(0, 1).map(p => (
                              <div key={p.id} className="relative h-10 w-14 overflow-hidden rounded bg-ck-dark-surface">
                                <div className="absolute inset-0" style={{
                                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)'
                                }} />
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-[13px] font-semibold text-white">{f.reference}</span>
                              <span className="text-sm font-medium text-white">{f.component_key}</span>
                            </div>
                            <p className="mt-0.5 text-[12px] text-ck-muted">
                              {f.damage_types?.join(', ')} · {f.description || 'buiten opdracht'}
                            </p>
                          </div>
                          <span className="justify-self-end rounded bg-ck-dark-surface px-2 py-0.5 text-[11px] font-medium text-ck-muted">
                            Buiten opdracht
                          </span>
                        </div>
                      );
                    })}
                  </article>
                )}

                {/* Verification */}
                <article className="rounded bg-ck-dark-card shadow-lg p-10">
                  <div className="flex items-baseline justify-between border-b-2 border-white pb-2.5">
                    <span className="text-[12px] font-semibold uppercase tracking-widest text-white">Verificatie</span>
                  </div>
                  <div className="mt-5">
                    {[
                      ['Rapport', ins.reference],
                      ['Vergrendeld', ins.locked_at ? fmtDateTime(ins.locked_at) : '—'],
                      ['Opgenomen door', ins.staff ? `${ins.staff.name} · ingelogd` : '—'],
                      ['Akkoord', customerApproval ? `${customerApproval.signer_name} (klant) · elektronisch ondertekend` : '—'],
                      ['Bevindingen / foto\'s', `${findings.length} / ${ins.photo_count}`],
                      ...(snapshot ? [
                        ['Snapshot-hash', snapshot.snapshot_hash || '—'],
                        ['PDF-hash', snapshot.pdf_hash || '—'],
                      ] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[190px_1fr] gap-4 border-b border-ck-dark-border py-2">
                        <span className="text-[12px] text-ck-muted">{k}</span>
                        <span className={`text-[13px] text-white ${(k as string).includes('hash') ? 'font-mono text-[12px] break-all' : ''}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-[13px] text-ck-muted-light">
                    Dit rapport is na vergrendeling niet meer wijzigbaar. De hierboven vermelde snapshot-hash dekt alle bevindingen, foto&apos;s en verklaringen zoals ondertekend.
                  </p>
                </article>
              </div>
            )}

            {/* ═══ Bevindingen view (table) ═══ */}
            {view === 'bevindingen' && (
              <div className="space-y-4">
                {/* Zone cards */}
                {(() => {
                  const zones: Record<string, { count: number; hours: number }> = {};
                  inScopeFindings.forEach(f => {
                    const zone = f.component_key.split(' ')[0] || 'Overig';
                    if (!zones[zone]) zones[zone] = { count: 0, hours: 0 };
                    zones[zone].count++;
                    zones[zone].hours += f.repair_hours + f.paint_hours;
                  });
                  const entries = Object.entries(zones).sort((a, b) => b[1].hours - a[1].hours).slice(0, 4);
                  const maxH = Math.max(...entries.map(e => e[1].hours), 1);
                  return (
                    <div className="grid grid-cols-4 gap-4">
                      {entries.map(([zone, data]) => (
                        <div key={zone} className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[13px] font-semibold text-white">{zone}</span>
                            <span className="font-mono text-[11px] text-ck-muted">{data.count} pos.</span>
                          </div>
                          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-white">{num(data.hours)}</div>
                          <div className="text-[11px] text-ck-muted">uur plaat + spuit</div>
                          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ck-dark-surface">
                            <div className="h-full rounded-full bg-ck-red" style={{ width: `${Math.round(data.hours / maxH * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Full table */}
                <div className="overflow-hidden rounded-lg border border-ck-dark-border bg-ck-dark-card">
                  <div className="grid grid-cols-[58px_1.5fr_1.2fr_74px_1.3fr_78px_78px_74px_64px] gap-3 border-b border-ck-dark-border bg-ck-dark-surface px-4 py-2.5">
                    {['Ref', 'Onderdeel', 'Schade', 'Ernst', 'Herstelwijze', 'Plaat', 'Spuit', 'Onderdelen', 'Vlag'].map(h => (
                      <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{h}</span>
                    ))}
                  </div>
                  {findings.map(f => {
                    const sev = SEV[f.severity] || SEV[2];
                    const isPre = f.origin === 'pre_existent';
                    const selected = f.reference === selectedRef;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedRef(f.reference)}
                        className={`grid grid-cols-[58px_1.5fr_1.2fr_74px_1.3fr_78px_78px_74px_64px] gap-3 items-center border-b border-ck-dark-border px-4 py-2.5 cursor-pointer hover:bg-ck-dark-surface ${
                          selected ? 'bg-ck-red/5' : ''
                        }`}
                      >
                        <span className="font-mono text-[12px] font-medium text-ck-muted">{f.reference}</span>
                        <span className="truncate text-[13px] font-medium text-white">{f.component_key}</span>
                        <span className="truncate text-[12px] text-ck-muted-light">{f.damage_types?.join(', ')}</span>
                        <span className={`font-mono text-[12px] tracking-wider ${sev.color}`}>{sev.bar}</span>
                        <span className="truncate text-[12px] text-ck-muted-light">{f.repair_technique || DISP[f.disposition] || '—'}</span>
                        <span className="text-right font-mono text-[12px] tabular-nums text-ck-muted-light">{f.repair_hours ? num(f.repair_hours) : '—'}</span>
                        <span className="text-right font-mono text-[12px] tabular-nums text-ck-muted-light">{f.paint_hours ? num(f.paint_hours) : '—'}</span>
                        <span className="truncate text-[11px] text-ck-muted">{f.ins_finding_parts?.length ? `${f.ins_finding_parts.length} × nieuw` : '—'}</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                          f.hidden_damage_possible || f.adas_possible ? 'text-orange-400' : isPre ? 'text-ck-muted' : 'text-ck-muted/30'
                        }`}>
                          {f.hidden_damage_possible ? 'Verborgen' : f.adas_possible ? 'ADAS' : isPre ? 'Buiten' : ''}
                        </span>
                      </div>
                    );
                  })}

                  {/* Totals row */}
                  <div className="grid grid-cols-[58px_1.5fr_1.2fr_74px_1.3fr_78px_78px_74px_64px] gap-3 border-t-2 border-white px-4 py-3">
                    <span />
                    <span className="text-[13px] font-semibold text-white">Totaal in opdracht</span>
                    <span /><span /><span className="text-right text-[11px] text-ck-muted">uren</span>
                    <span className="text-right font-mono text-[13px] font-semibold tabular-nums text-white">{num(repairTotal)}</span>
                    <span className="text-right font-mono text-[13px] font-semibold tabular-nums text-white">{num(paintTotal)}</span>
                    <span className="text-[11px] text-ck-muted">{partCount} pos.</span>
                    <span />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Verificatie view ═══ */}
            {view === 'verificatie' && (
              <div className="grid grid-cols-[1.1fr_1fr] gap-5 items-start">
                {/* Events */}
                <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
                  <h3 className="mb-3 text-base font-semibold text-white">Gebeurtenissen</h3>
                  {events.map(e => (
                    <div key={e.id} className="grid grid-cols-[130px_1fr] gap-4 border-t border-ck-dark-border py-2.5">
                      <span className="font-mono text-[11px] text-ck-muted">{fmtDateTime(e.created_at)}</span>
                      <div>
                        <span className="text-[13px] font-medium text-white">{e.event_type}</span>
                        {e.payload && (
                          <span className="mt-0.5 block text-[12px] text-ck-muted">
                            {typeof e.payload === 'object' ? JSON.stringify(e.payload).slice(0, 100) : String(e.payload)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <p className="py-4 text-center text-sm text-ck-muted">Geen gebeurtenissen</p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Integrity */}
                  <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
                    <h3 className="mb-3 text-base font-semibold text-white">Integriteit</h3>
                    {[
                      ['Snapshot', snapshot?.snapshot_hash ? snapshot.snapshot_hash.slice(0, 4) + '…' + snapshot.snapshot_hash.slice(-4) : '—'],
                      ['PDF', snapshot?.pdf_hash ? snapshot.pdf_hash.slice(0, 4) + '…' + snapshot.pdf_hash.slice(-4) : '—'],
                      [`Foto's (${ins.photo_count})`, 'alle sha256 gelijk'],
                      ['Catalogus in snapshot', '55 componenten'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-t border-ck-dark-border py-1.5">
                        <span className="text-[12px] text-ck-muted">{k}</span>
                        <span className="font-mono text-[12px] text-white">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Signature */}
                  <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
                    <h3 className="mb-3 text-base font-semibold text-white">Ondertekening</h3>
                    {approvals.map(a => (
                      <div key={a.id}>
                        {[
                          ['Rol', a.role === 'customer' ? 'Klant' : 'Opnemer'],
                          ['Naam', a.signer_name],
                          ['Identificatie', a.identification || 'Ingelogd'],
                          ['Verklaring', a.statement_text || 'Opname ingezien en akkoord'],
                          ['Tijdstip', fmtDateTime(a.signed_at)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 border-t border-ck-dark-border py-1.5">
                            <span className="text-[12px] text-ck-muted">{k}</span>
                            <span className="text-[12px] text-white text-right">{v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {approvals.length === 0 && (
                      <p className="py-2 text-center text-sm text-ck-muted">Geen ondertekeningen</p>
                    )}
                    <p className="mt-3 text-[11px] leading-relaxed text-ck-muted">
                      Gewone elektronische handtekening (eIDAS art. 25 lid 1). Bewaarde bewijsmiddelen: verklaringstekst, tijdstempel, IP-adres, user-agent en de document-hash op het moment van ondertekening.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ─── Right sidebar: finding detail ─── */}
        {selectedFinding && (
          <aside className="flex w-[340px] flex-none flex-col border-l border-ck-dark-border bg-ck-dark-card min-h-0">
            {/* Photo capture panel */}
            {showCamera && !locked && (
              <div className="border-b border-ck-dark-border p-3">
                <PhotoCapture
                  inspectionId={id}
                  findingId={selectedFinding.id}
                  kind={selectedFinding.origin === 'pre_existent' ? 'pre_existent' : 'schade'}
                  onUploaded={() => {
                    setShowCamera(false);
                    fetch(`/api/inspections/${id}`)
                      .then(r => r.ok ? r.json() : null)
                      .then(data => { if (data) setIns(data); });
                  }}
                  onClose={() => setShowCamera(false)}
                />
              </div>
            )}
            <div className="flex items-center justify-between border-b border-ck-dark-border px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Bevinding in detail</span>
              <span className="font-mono text-[12px] font-medium text-white">{selectedFinding.reference}</span>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4">
              <h3 className="text-xl font-semibold text-white">{selectedFinding.component_key}</h3>
              <span className="mt-0.5 block text-[12px] text-ck-muted">
                {selectedFinding.sub_location || 'Geen sublocatie'}
              </span>

              {/* Severity + disposition */}
              <div className="mt-4 flex items-center gap-2">
                <span className={`font-mono text-sm tracking-wider ${(SEV[selectedFinding.severity] || SEV[2]).color}`}>
                  {(SEV[selectedFinding.severity] || SEV[2]).bar}
                </span>
                <span className="text-[12px] text-ck-muted-light">{(SEV[selectedFinding.severity] || SEV[2]).label}</span>
                <span className="ml-auto rounded bg-ck-dark-surface px-2 py-0.5 text-[11px] font-medium text-ck-muted-light">
                  {DISP[selectedFinding.disposition] || selectedFinding.disposition}
                </span>
              </div>

              {/* Photos */}
              {selectedPhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  {selectedPhotos.slice(0, 4).map(p => (
                    <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded bg-ck-dark-surface">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)'
                      }} />
                      <span className="absolute bottom-1 left-1 rounded bg-ck-dark-card px-1 py-0.5 font-mono text-[10px] text-ck-muted">
                        {p.reference}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Detail rows */}
              <div className="mt-4">
                {[
                  ['Zone', selectedFinding.sub_location || selectedFinding.component_key],
                  ['Schade', selectedFinding.damage_types?.join(', ') || '—'],
                  ['Herstelwijze', selectedFinding.repair_technique || '—'],
                  ['Lakwerk', selectedFinding.paint_required ? (selectedFinding.paint_operation || 'Paneel') : 'Niet vereist'],
                  ["Foto's", selectedPhotos.map(p => p.reference).join(' · ') || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[104px_1fr] gap-3 border-t border-ck-dark-border py-1.5">
                    <span className="text-[12px] text-ck-muted">{k}</span>
                    <span className="text-[12px] text-ck-muted-light">{v}</span>
                  </div>
                ))}
              </div>

              {/* Hours box */}
              <div className="mt-4 rounded bg-ck-dark-surface p-3">
                <div className="flex justify-between text-[12px] text-ck-muted-light">
                  <span>Plaatwerk</span>
                  <span className="font-mono tabular-nums">{hrs(selectedFinding.repair_hours)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[12px] text-ck-muted-light">
                  <span>Spuitwerk</span>
                  <span className="font-mono tabular-nums">{hrs(selectedFinding.paint_hours)}</span>
                </div>
              </div>

              {/* Parts */}
              {selectedFinding.ins_finding_parts?.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Onderdelen</span>
                  {selectedFinding.ins_finding_parts.map(p => (
                    <div key={p.id} className="flex justify-between border-t border-ck-dark-border py-1.5 text-[12px]">
                      <span className="text-ck-muted-light">{p.description} {p.part_number ? `(${p.part_number})` : ''}</span>
                      <span className="text-ck-muted">× {p.qty}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Flag */}
              {(selectedFinding.hidden_damage_possible || selectedFinding.adas_possible) && (
                <div className="mt-4 rounded border border-ck-dark-border p-3">
                  <span className="rounded bg-orange-900/50 px-2 py-0.5 text-[11px] font-semibold text-orange-300">
                    {selectedFinding.hidden_damage_possible ? 'Verborgen' : 'ADAS'}
                  </span>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ck-muted-light">
                    {selectedFinding.hidden_damage_note || 'Kalibratie rijhulpsystemen mogelijk vereist'}
                  </p>
                </div>
              )}

              {/* Evidence */}
              <div className="mt-5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">Bewijs</span>
                {selectedPhotos.map(p => (
                  <div key={p.id} className="flex justify-between border-t border-ck-dark-border py-1.5">
                    <span className="font-mono text-[11px] text-ck-muted">{p.reference} sha256</span>
                    <span className="font-mono text-[11px] text-ck-muted-light">
                      {p.sha256 ? p.sha256.slice(0, 4) + '…' + p.sha256.slice(-4) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center gap-3 border-t border-ck-dark-border px-4 py-2.5">
              <span className="flex-1 text-[11px] text-ck-muted">
                {locked ? 'Vergrendeld — wijzigen niet mogelijk' : `Status: ${STATUS_LABELS[ins.status].nl}`}
              </span>
              <Link
                href="/app/offertes"
                className="rounded-lg border border-ck-dark-border px-3 py-1.5 text-[12px] font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white"
              >
                Naar offerte
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
