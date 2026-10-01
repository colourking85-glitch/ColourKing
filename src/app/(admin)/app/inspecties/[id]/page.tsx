'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Link2, FileDown, FileText, Camera, Send, Undo2, CheckCircle2, XCircle, X, Lock, Copy, Mail, Trash2, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { PhotoCapture } from '@/components/ui/PhotoCapture';
import { VehicleDamageMap, COMPONENT_SLOTS, defaultPointForKey, type MapMarker } from '@/components/shared/VehicleDamageMap';
import {
  STATUS_COLORS, isTerminal,
  type InsStatus
} from '@/modules/inspectie/machine';

// ---------- types ----------

type Finding = {
  id: string;
  reference: string;
  sequence_no: number;
  component_key: string;
  hotspot_point: { x: number; y: number } | null;
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
  url?: string | null;
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
const hrs = (n: number, unit: string) => n ? num(n) + ' ' + unit : '—';
const eur = (cents: number) => '€ ' + Math.round(cents / 100).toLocaleString('nl-NL');
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
};

const SEV_META: Record<number, { key: string; bar: string; color: string }> = {
  1: { key: 'detail.sevLight', bar: '●○○○', color: 'text-gray-400' },
  2: { key: 'detail.sevModerate', bar: '●●○○', color: 'text-amber-400' },
  3: { key: 'detail.sevHeavy', bar: '●●●○', color: 'text-orange-500' },
  4: { key: 'detail.sevVeryHeavy', bar: '●●●●', color: 'text-red-500' },
};

const DISP_KEYS: Record<string, string> = {
  herstellen: 'detail.dispRepair',
  vervangen: 'detail.dispReplace',
  onderzoeken: 'detail.dispInvestigate',
  geen_actie: 'detail.dispNoAction',
};

type ViewTab = 'rapport' | 'bevindingen' | 'verificatie';
type FindingFilter = 'alles' | 'herstellen' | 'vervangen' | 'onderzoeken' | 'pre';

// ---------- component ----------

export default function InspectieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations('in');
  const tCommon = useTranslations('common');
  const tIn = useTranslations('in');
  const locale = useLocale();
  const [components, setComponents] = useState<{ key: string; name_nl: string; name_en: string | null; name_tr: string | null }[]>([]);

  const sevLabel = (severity: number) => (SEV_META[severity] || SEV_META[2]).key ? t((SEV_META[severity] || SEV_META[2]).key) : '';
  const dispLabel = (disposition: string) => DISP_KEYS[disposition] ? t(DISP_KEYS[disposition]) : disposition;
  const hrsT = (n: number) => hrs(n, t('detail.hourUnit'));

  const [ins, setIns] = useState<Inspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showApprove, setShowApprove] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [shareLinks, setShareLinks] = useState<{ id: string; recipient_email: string | null; expires_at: string; used_at: string | null; revoked_at: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [view, setView] = useState<ViewTab>('rapport');
  const [selectedRef, setSelectedRef] = useState<string>('');
  const [filter, setFilter] = useState<FindingFilter>('alles');
  const [showCamera, setShowCamera] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
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

  useEffect(() => {
    getSession().then(s => { if (s?.name) setSignerName(s.name); }).catch(() => {});
    fetch('/api/inspections/catalog/components').then(r => r.ok ? r.json() : []).then(setComponents).catch(() => {});
  }, []);

  const componentLabel = useCallback((key: string) => {
    const c = components.find(x => x.key === key);
    if (!c) return key;
    if (locale === 'en' && c.name_en) return c.name_en;
    if (locale === 'tr' && c.name_tr) return c.name_tr;
    return c.name_nl;
  }, [components, locale]);

  const reload = useCallback(async () => {
    const r = await fetch(`/api/inspections/${id}`);
    if (r.ok) setIns(await r.json());
  }, [id]);

  const doTransition = useCallback(async (to: InsStatus) => {
    if (to === 'GEANNULEERD' && !confirm(tIn('detail.confirmCancel'))) return;
    setBusy(true); setActionError('');
    try {
      const r = await fetch(`/api/inspections/${id}/transition`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || r.statusText); }
      await reload();
    } catch (e) { setActionError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }, [id, reload, tIn]);

  const doDelete = useCallback(async () => {
    if (!confirm(tIn('detail.confirmDelete'))) return;
    setBusy(true); setActionError('');
    try {
      const r = await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || r.statusText); }
      router.push('/app/inspecties');
    } catch (e) { setActionError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }, [id, router, tIn]);

  const loadShareLinks = useCallback(async () => {
    const r = await fetch(`/api/inspections/${id}/share`);
    if (r.ok) setShareLinks(await r.json());
  }, [id]);

  useEffect(() => { if (showShare) loadShareLinks(); }, [showShare, loadShareLinks]);

  const createShare = useCallback(async (send: boolean) => {
    setShareBusy(true); setShareMsg(''); setActionError('');
    try {
      const r = await fetch(`/api/inspections/${id}/share`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: send ? shareEmail.trim() : null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || r.statusText);
      setShareUrl(d.url);
      if (d.emailed) setShareMsg(tIn('detail.shareSent'));
      await loadShareLinks();
    } catch (e) { setActionError(e instanceof Error ? e.message : String(e)); }
    finally { setShareBusy(false); }
  }, [id, shareEmail, loadShareLinks, tIn]);

  const approveAndLock = useCallback(async () => {
    if (!signerName.trim()) return;
    setBusy(true); setActionError('');
    try {
      const r = await fetch(`/api/inspections/${id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'inspecteur', signer_name: signerName.trim(), statement_text: tIn('detail.approvalStatement'), lock: true }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || r.statusText); }
      setShowApprove(false);
      await reload();
    } catch (e) { setActionError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }, [id, reload, signerName, tIn]);

  const findings = ins?.ins_findings || [];
  const photos = ins?.ins_photos || [];
  const guidedPhotos = photos.filter(p => p.kind === 'shot');
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
        <p className="text-red-400">{error || t('detail.notFound')}</p>
        <Link href="/app/inspecties" className="text-sm text-ck-red hover:underline">
          {tCommon('back')}
        </Link>
      </div>
    );
  }

  const locked = isTerminal(ins.status);
  const snapshot = snapshots[0];
  const inspectorApproval = approvals.find(a => a.role === 'inspecteur');
  const customerApproval = approvals.find(a => a.role === 'klant');

  return (
    <div className="-m-6 flex h-[calc(100vh-48px)] flex-col overflow-hidden bg-ck-dark">
      {/* ─── Header ─── */}
      <header className="flex-none border-b border-ck-dark-border bg-ck-dark-card">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5 sm:h-[56px] sm:py-0">
          <Link href="/app/inspecties" className="flex h-8 w-8 items-center justify-center rounded-lg text-ck-muted hover:bg-ck-dark-surface hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <button onClick={() => setShowLeftPanel(v => !v)} className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-ck-muted hover:bg-ck-dark-surface hover:text-white">
            <PanelLeftOpen size={18} />
          </button>
          <div className="flex items-center gap-3">
            <ScreenBadge code="IN10" />
            <div className="leading-tight">
              <span className="text-sm font-semibold text-white">{t('report.title')}</span>
              <span className="ml-2 font-mono text-xs text-ck-muted">{ins.reference}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-ck-dark-border pl-4 ml-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[ins.status]}`}>
              {t(`statuses.${ins.status}`)}
            </span>
            {ins.locked_at && (
              <span className="hidden sm:inline text-xs text-ck-muted">{fmtDateTime(ins.locked_at)}</span>
            )}
          </div>

          {!locked && (
            <div className="flex flex-wrap items-center gap-2 border-l border-ck-dark-border pl-4 ml-1">
              {(ins.status === 'CONCEPT' || ins.status === 'BEZIG') && (
                <button
                  onClick={() => doTransition('TER_AKKOORD')}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
                >
                  <Send size={14} /> {tIn('detail.submit')}
                </button>
              )}
              {ins.status === 'TER_AKKOORD' && !inspectorApproval && !showApprove && (
                <button
                  onClick={() => setShowApprove(true)}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> {tIn('detail.approveAndLock')}
                </button>
              )}
              {ins.status === 'TER_AKKOORD' && !inspectorApproval && showApprove && (
                <span className="flex items-center gap-1.5">
                  <input
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder={tIn('detail.signerNamePlaceholder')}
                    className="w-40 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-xs text-white focus:border-ck-red focus:outline-none"
                  />
                  <button
                    onClick={approveAndLock}
                    disabled={busy || !signerName.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} /> {tIn('detail.confirm')}
                  </button>
                  <button onClick={() => setShowApprove(false)} className="p-1 text-ck-muted hover:text-white" aria-label={tCommon('cancel')}>
                    <X size={14} />
                  </button>
                </span>
              )}
              {(ins.status === 'AKKOORD' || (ins.status === 'TER_AKKOORD' && inspectorApproval)) && (
                <button
                  onClick={() => doTransition(ins.status === 'AKKOORD' ? 'VERGRENDELD' : 'AKKOORD')}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                >
                  <Lock size={14} /> {tIn('detail.lock')}
                </button>
              )}
              {ins.status === 'TER_AKKOORD' && (
                <button
                  onClick={() => doTransition('BEZIG')}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white disabled:opacity-50"
                >
                  <Undo2 size={14} /> {tIn('detail.backToProgress')}
                </button>
              )}
              {ins.status !== 'AKKOORD' && (
                <button
                  onClick={() => doTransition('GEANNULEERD')}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <XCircle size={14} /> {tIn('detail.cancel')}
                </button>
              )}
            </div>
          )}
          {ins.status !== 'VERGRENDELD' && (
            <button
              onClick={doDelete}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 size={14} /> {tIn('detail.delete')}
            </button>
          )}
          {actionError && <span className="ml-3 text-xs text-red-400">{actionError}</span>}
          <div className="flex-1" />

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/inspections/${id}/pdf?inline=1`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white"
            >
              <Printer size={14} /> <span className="hidden md:inline">{t('detail.print')}</span>
            </a>
            <button
              onClick={() => { setShowShare(v => !v); if (!shareEmail && ins.customers?.email) setShareEmail(ins.customers.email); }}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-ck-dark-surface hover:text-white ${showShare ? 'border-ck-red text-white' : 'border-ck-dark-border text-ck-muted-light'}`}
            >
              <Link2 size={14} /> <span className="hidden md:inline">{t('detail.shareLink')}</span>
            </button>
            {!locked && (
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white"
              >
                <Camera size={14} /> <span className="hidden md:inline">{t('detail.photo')}</span>
              </button>
            )}
            <Link
              href={`/app/inspecties/${id}/rapport`}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white"
            >
              <FileText size={14} /> <span className="hidden md:inline">{t('detail.reportLink')}</span>
            </Link>
            <a
              href={`/api/inspections/${id}/pdf`}
              className="flex items-center gap-1.5 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover"
            >
              <FileDown size={14} /> <span className="hidden md:inline">{t('detail.downloadPdf')}</span>
            </a>
            <button onClick={() => setShowRightPanel(v => !v)} className="flex xl:hidden h-8 w-8 items-center justify-center rounded-lg text-ck-muted hover:bg-ck-dark-surface hover:text-white">
              <PanelRightOpen size={18} />
            </button>
          </div>
        </div>

        {/* Vehicle bar */}
        <div className="flex items-center gap-5 px-3 sm:px-5 pb-2.5 text-xs text-ck-muted overflow-x-auto whitespace-nowrap">
          <span className="font-semibold text-white">{ins.make} {ins.model}</span>
          {ins.licence_plate && (
            <span className="rounded border border-ck-dark-border px-1.5 py-0.5 font-mono text-white">{ins.licence_plate}</span>
          )}
          {ins.odometer_km && <span>{ins.odometer_km.toLocaleString('nl-NL')} km</span>}
          {ins.first_reg_date && <span>{t('detail.buildYear')} {new Date(ins.first_reg_date).getFullYear()}{ins.fuel ? ' · ' + ins.fuel : ''}</span>}
          {ins.rdw_verified && <span>{t('detail.rdwChecked')}</span>}
          {ins.staff && <span>{t('detail.inspectorLabel')} {ins.staff.name}</span>}
          {customerApproval && <span>{t('detail.approvalSignedElectronic', { name: customerApproval.signer_name })}</span>}
        </div>
        {showShare && (
          <div className="border-t border-ck-dark-border bg-ck-dark-surface/40 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{tIn('detail.shareTitle')}</span>
              {ins.status !== 'TER_AKKOORD' ? (
                <span className="text-xs text-ck-muted">{tIn('detail.shareOnlyPending')}</span>
              ) : (
                <>
                  <input
                    value={shareEmail}
                    onChange={e => setShareEmail(e.target.value)}
                    placeholder={tIn('detail.shareEmail')}
                    type="email"
                    className="w-64 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-xs text-white focus:border-ck-red focus:outline-none"
                  />
                  <button onClick={() => createShare(false)} disabled={shareBusy} className="rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:text-white disabled:opacity-50">
                    {tIn('detail.shareCreate')}
                  </button>
                  <button onClick={() => createShare(true)} disabled={shareBusy || !shareEmail.trim()} className="flex items-center gap-1.5 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50">
                    <Mail size={12} /> {tIn('detail.shareSend')}
                  </button>
                </>
              )}
              {shareUrl && (
                <span className="flex items-center gap-1.5">
                  <code className="max-w-[360px] truncate rounded bg-ck-dark-card px-2 py-1 font-mono text-[11px] text-white">{shareUrl}</code>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(shareUrl); setShareMsg(tIn('detail.shareCopied')); }}
                    className="flex items-center gap-1 rounded border border-ck-dark-border px-2 py-1 text-[11px] text-ck-muted-light hover:text-white"
                  >
                    <Copy size={11} /> {tIn('detail.shareCopy')}
                  </button>
                </span>
              )}
              {shareMsg && <span className="text-xs text-green-400">{shareMsg}</span>}
            </div>
            {shareLinks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ck-muted">
                <span className="uppercase tracking-widest">{tIn('detail.shareExisting')}:</span>
                {shareLinks.map(l => (
                  <span key={l.id}>
                    {l.recipient_email ?? '—'} · {l.used_at ? tIn('detail.shareUsed') : `${tIn('detail.shareExpires')} ${fmtDateTime(l.expires_at)}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* ─── Body: 3-panel layout ─── */}
      <div className="flex flex-1 min-h-0">

        {/* ─── Left sidebar: document outline + findings rail ─── */}
        <nav className={`${showLeftPanel ? 'flex' : 'hidden'} lg:flex w-[260px] flex-none flex-col border-r border-ck-dark-border bg-ck-dark-card min-h-0 absolute lg:relative z-20 h-full`}>
          <div className="px-4 pt-4 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('detail.documentOutline')}</span>
          </div>
          <div className="flex flex-col gap-px px-2 pb-2">
            {[
              { no: '01', title: t('detail.outlineSummary'), meta: t('report.sheet', { n: '1' }) },
              { no: '02', title: t('detail.outlinePhotoSeries'), meta: String(guidedPhotos.length) },
              { no: '03', title: t('detail.outlineFindings'), meta: String(inScopeFindings.length) },
              { no: '04', title: t('detail.outlinePreExistent'), meta: String(preFindings.length) },
              { no: '05', title: t('detail.outlineVerification'), meta: 'hash' },
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
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('detail.outlineFindings')}</span>
            <span className="font-mono text-[11px] text-ck-muted">{findings.length}</span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1 px-4 pb-2">
            {([['alles', t('detail.filterAll')], ['herstellen', t('detail.filterRepair')], ['vervangen', t('detail.filterReplace')], ['onderzoeken', t('detail.filterInvestigate')], ['pre', t('detail.filterPreExistent')]] as [FindingFilter, string][]).map(([key, label]) => (
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
              const sev = SEV_META[f.severity] || SEV_META[2];
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
              {([['rapport', t('detail.tabReport')], ['bevindingen', t('detail.tabFindings')], ['verificatie', t('detail.tabVerification')]] as [ViewTab, string][]).map(([key, label]) => (
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
              {view === 'rapport' && t('detail.subtitlePhotos', { count: ins.photo_count })}
              {view === 'bevindingen' && t('detail.subtitleFindings', { count: findings.length, parts: partCount })}
              {view === 'verificatie' && t('detail.subtitleVerification')}
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
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-white">{t('report.companyName')}</span>
                      <span className="font-mono text-[11px] text-ck-muted">{ins.reference} · {t('report.sheet', { n: '1' })}</span>
                    </div>

                    <h1 className="mt-6 text-3xl font-bold text-white">{t('report.title')}</h1>
                    <p className="mt-1 text-sm text-ck-muted">
                      {t('report.description')}
                    </p>

                    {/* Vehicle details grid */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 border-t border-ck-dark-border">
                      {[
                        [t('report.licencePlate'), ins.licence_plate || '—'],
                        [t('report.reference'), ins.reference],
                        [t('report.makeModel'), `${ins.make || ''} ${ins.model || ''}`.trim() || '—'],
                        [t('report.inspectionType'), ins.purpose ? t(`purposes.${ins.purpose}`) : '—'],
                        [t('report.vin'), ins.vin || '—'],
                        [t('report.damageDate'), ins.event_date ? fmtDate(ins.event_date) : '—'],
                        [t('report.firstRegistration'), ins.first_reg_date ? fmtDate(ins.first_reg_date) : '—'],
                        [t('report.circumstances'), ins.event_description || '—'],
                        [t('report.odometer'), ins.odometer_km ? ins.odometer_km.toLocaleString('nl-NL') + ' km' : '—'],
                        [t('report.inspectionDate'), ins.started_at ? fmtDateTime(ins.started_at) : fmtDateTime(ins.created_at)],
                        [t('report.fuel'), ins.fuel || '—'],
                        [t('report.rdwCheck'), ins.rdw_verified ? t('report.rdwVerified') : '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-ck-dark-border py-1.5">
                          <span className="text-[12px] text-ck-muted">{k}</span>
                          <span className="text-[13px] font-medium text-white text-right">{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* KPIs */}
                    <h2 className="mt-8 mb-3 text-lg font-semibold text-white">{t('report.summary')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded border border-ck-dark-border bg-ck-dark-border">
                      {[
                        { value: findings.length, label: t('report.findingsKpi', { pre: preFindings.length }) },
                        { value: ins.photo_count, label: t('report.photosCaptured') },
                        { value: num(repairTotal), label: t('report.bodyworkHours') },
                        { value: num(paintTotal), label: t('report.paintHours') },
                      ].map(kpi => (
                        <div key={kpi.label} className="bg-ck-dark-card px-4 py-3">
                          <div className="text-2xl font-semibold tabular-nums text-white">{kpi.value}</div>
                          <div className="mt-0.5 text-[11px] text-ck-muted">{kpi.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Disposition + Hours */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('report.dispositionLabel')}</span>
                        <div className="mt-3 space-y-2.5">
                          {[
                            [t('report.dispRepair'), dispCounts.herstellen, 'bg-orange-500'],
                            [t('report.dispReplace'), dispCounts.vervangen, 'bg-blue-500'],
                            [t('report.dispInvestigate'), dispCounts.onderzoeken, 'bg-gray-400'],
                            [t('report.dispPreExistent'), preFindings.length, 'bg-ck-dark-border'],
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
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('report.hoursAndEstimate')}</span>
                        <div className="mt-3 border-t border-ck-dark-border">
                          {[
                            [t('report.bodywork'), hrsT(repairTotal)],
                            [t('report.paintwork'), hrsT(paintTotal)],
                            [t('report.preparation'), hrsT(Math.round(paintTotal * 0.55 * 10) / 10)],
                            [t('report.parts'), t('report.positions', { count: partCount })],
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
                              <span className="text-[12px] text-ck-muted">{t('report.indicativeAmount')}</span>
                              <span className="text-xl font-semibold tabular-nums text-white">{eur(ins.indicative_total_cents)}</span>
                            </div>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-ck-muted">
                              {t('report.indicativeDisclaimer')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Caveats */}
                    {(findings.some(f => f.hidden_damage_possible) || findings.some(f => f.adas_possible) || preFindings.length > 0) && (
                      <>
                        <h2 className="mt-8 mb-3 text-lg font-semibold text-white">{t('report.caveats')}</h2>
                        <div className="overflow-hidden rounded border border-ck-dark-border">
                          {findings.some(f => f.hidden_damage_possible) && (
                            <div className="flex gap-3 border-b border-ck-dark-border px-4 py-2.5">
                              <span className="flex-none rounded bg-orange-900/50 px-2 py-0.5 text-[11px] font-semibold text-orange-300">{t('report.hidden')}</span>
                              <p className="text-[13px] leading-relaxed text-ck-muted-light">
                                {t('report.hiddenText', { refs: findings.filter(f => f.hidden_damage_possible).map(f => f.reference).join(', ') })}
                              </p>
                            </div>
                          )}
                          {findings.some(f => f.adas_possible) && (
                            <div className="flex gap-3 border-b border-ck-dark-border px-4 py-2.5">
                              <span className="flex-none rounded bg-blue-900/50 px-2 py-0.5 text-[11px] font-semibold text-blue-300">{t('report.adas')}</span>
                              <p className="text-[13px] leading-relaxed text-ck-muted-light">
                                {t('report.adasText', { refs: findings.filter(f => f.adas_possible).map(f => f.reference).join(', ') })}
                              </p>
                            </div>
                          )}
                          {preFindings.length > 0 && (
                            <div className="flex gap-3 px-4 py-2.5">
                              <span className="flex-none rounded bg-gray-800 px-2 py-0.5 text-[11px] font-semibold text-gray-300">{t('report.preExistentLabel')}</span>
                              <p className="text-[13px] leading-relaxed text-ck-muted-light">
                                {t('report.preExistentText', { count: preFindings.length })}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Signatures */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('report.inspectedBy')}</span>
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
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('report.customerApproval')}</span>
                        <div className="mt-1 flex h-14 items-end border-b border-white pb-1.5">
                          {customerApproval ? (
                            <span className="text-lg italic text-white">{customerApproval.signer_name}</span>
                          ) : (
                            <span className="text-sm text-ck-muted">—</span>
                          )}
                        </div>
                        <span className="mt-1.5 block text-[11px] text-ck-muted">
                          {customerApproval
                            ? t('report.eSignedDetail', { name: customerApproval.signer_name, date: fmtDateTime(customerApproval.signed_at) })
                            : t('report.notSigned')
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
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-white">{t('report.guidedPhotosTitle')}</span>
                      <span className="font-mono text-[11px] text-ck-muted">{t('report.sheet', { n: '2' })}</span>
                    </div>
                    <p className="mt-3 mb-5 text-[13px] text-ck-muted">
                      {t('report.guidedPhotosDesc')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {guidedPhotos.map(p => (
                        <div key={p.id}>
                          <div className="relative aspect-[4/3] overflow-hidden rounded bg-ck-dark-surface">
                            {p.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.url} alt={p.reference} className="absolute inset-0 h-full w-full object-cover" />
                            ) : (
                              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)' }} />
                            )}
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
                        {t('report.findingsRange', { from: inScopeFindings[0]?.reference, to: inScopeFindings[inScopeFindings.length - 1]?.reference })}
                      </span>
                      <span className="font-mono text-[11px] text-ck-muted">{t('report.sheet', { n: '3' })}</span>
                    </div>

                    {inScopeFindings.map(f => {
                      const sev = SEV_META[f.severity] || SEV_META[2];
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
                            <span className="text-[11px] text-ck-muted">{sevLabel(f.severity)}</span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5">
                            {/* Photos */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {findingPhotos.slice(0, 4).map(p => (
                                <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded bg-ck-dark-surface">
                                  {p.url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.url} alt={p.reference} className="absolute inset-0 h-full w-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)' }} />
                                  )}
                                  <span className="absolute bottom-1 left-1 rounded bg-ck-dark-card px-1 py-0.5 font-mono text-[9px] text-ck-muted">
                                    {p.reference}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Detail rows */}
                            <div>
                              {[
                                [t('report.zone'), f.sub_location ? `${f.component_key} · ${f.sub_location}` : f.component_key],
                                [t('report.damage'), f.damage_types?.join(', ') || '—'],
                                [t('report.dispositionRow'), f.repair_technique || dispLabel(f.disposition)],
                                [t('report.paintLabel'), f.paint_required ? (f.paint_operation || t('report.panel')) + (f.blend_components?.length ? ' · ' + t('report.blending') + ' ' + f.blend_components.join(', ') : '') : t('report.paintNotRequired')],
                                [t('report.hoursLabel'), t('report.hoursRow', { bodywork: hrsT(f.repair_hours), paint: hrsT(f.paint_hours) })],
                                ...(f.ins_finding_parts?.length ? [[t('report.partsLabel'), f.ins_finding_parts.map(p => `${p.description}${p.part_number ? ' (' + p.part_number + ')' : ''} × ${p.qty}`).join(' · ')]] : []),
                                ...(f.hidden_damage_possible && f.hidden_damage_note ? [[t('report.caveatLabel'), f.hidden_damage_note]] : []),
                                ...(f.adas_possible ? [[t('report.adasSystems'), t('report.adasCalibration')]] : []),
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
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-white">{t('report.preExistentSectionTitle')}</span>
                    </div>
                    <p className="mt-3 mb-4 text-[13px] text-ck-muted">
                      {t('report.preExistentSectionDesc')}
                    </p>
                    {preFindings.map(f => {
                      const findingPhotos = photos.filter(p => p.finding_id === f.id);
                      return (
                        <div key={f.id} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_130px] items-start gap-4 border-t border-ck-dark-border py-3">
                          <div className="flex gap-1.5">
                            {findingPhotos.slice(0, 1).map(p => (
                              <div key={p.id} className="relative h-10 w-14 overflow-hidden rounded bg-ck-dark-surface">
                                {p.url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.url} alt={p.reference} className="absolute inset-0 h-full w-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)' }} />
                                )}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-[13px] font-semibold text-white">{f.reference}</span>
                              <span className="text-sm font-medium text-white">{f.component_key}</span>
                            </div>
                            <p className="mt-0.5 text-[12px] text-ck-muted">
                              {f.damage_types?.join(', ')} · {f.description || t('report.outOfScopeDefault')}
                            </p>
                          </div>
                          <span className="justify-self-end rounded bg-ck-dark-surface px-2 py-0.5 text-[11px] font-medium text-ck-muted">
                            {t('report.outOfScope')}
                          </span>
                        </div>
                      );
                    })}
                  </article>
                )}

                {/* Verification */}
                <article className="rounded bg-ck-dark-card shadow-lg p-10">
                  <div className="flex items-baseline justify-between border-b-2 border-white pb-2.5">
                    <span className="text-[12px] font-semibold uppercase tracking-widest text-white">{t('report.verification')}</span>
                  </div>
                  <div className="mt-5">
                    {[
                      [t('report.reportLabel'), ins.reference],
                      [t('report.locked'), ins.locked_at ? fmtDateTime(ins.locked_at) : '—'],
                      [t('report.inspectedBy'), ins.staff ? t('report.inspectedByLoggedIn', { name: ins.staff.name }) : '—'],
                      [t('report.customerApproval'), customerApproval ? t('report.approvalElectronic', { name: customerApproval.signer_name }) : '—'],
                      [t('report.findingsPhotos'), `${findings.length} / ${ins.photo_count}`],
                      ...(snapshot ? [
                        [t('report.snapshotHash'), snapshot.snapshot_hash || '—'],
                        [t('report.pdfHash'), snapshot.pdf_hash || '—'],
                      ] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[190px_1fr] gap-4 border-b border-ck-dark-border py-2">
                        <span className="text-[12px] text-ck-muted">{k}</span>
                        <span className={`text-[13px] text-white ${(v as string).length > 20 ? 'font-mono text-[12px] break-all' : ''}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-[13px] text-ck-muted-light">
                    {t('report.verificationText')}
                  </p>
                </article>
              </div>
            )}

            {/* ═══ Bevindingen view (table) ═══ */}
            {view === 'bevindingen' && (
              <div className="space-y-4">
                {/* Damage map */}
                <div className="flex gap-6 rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
                  <VehicleDamageMap
                    slots={COMPONENT_SLOTS}
                    className="w-[220px] flex-none"
                    showLabels={false}
                    markers={findings.flatMap<MapMarker>(f => {
                      const point = f.hotspot_point ?? defaultPointForKey(f.component_key);
                      return point ? [{ id: f.reference, point, label: f.reference, muted: f.origin === 'pre_existent', active: f.reference === selectedRef }] : [];
                    })}
                    onMarkerClick={ref => scrollToFinding(ref)}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 text-base font-semibold text-white">{tIn('detail.damageMap')}</h3>
                    <ul className="space-y-1">
                      {findings.map(f => (
                        <li key={f.id}>
                          <button
                            onClick={() => scrollToFinding(f.reference)}
                            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[12px] hover:bg-ck-dark-surface ${f.reference === selectedRef ? 'text-white' : 'text-ck-muted-light'}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${f.origin === 'pre_existent' ? 'bg-ck-muted' : 'bg-ck-red'}`} />
                            <span className="font-mono">{f.reference}</span>
                            <span className="truncate">{componentLabel(f.component_key)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Zone cards */}
                {(() => {
                  const zones: Record<string, { count: number; hours: number }> = {};
                  inScopeFindings.forEach(f => {
                    const zone = f.component_key.split(' ')[0] || t('detail.zoneOther');
                    if (!zones[zone]) zones[zone] = { count: 0, hours: 0 };
                    zones[zone].count++;
                    zones[zone].hours += f.repair_hours + f.paint_hours;
                  });
                  const entries = Object.entries(zones).sort((a, b) => b[1].hours - a[1].hours).slice(0, 4);
                  const maxH = Math.max(...entries.map(e => e[1].hours), 1);
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {entries.map(([zone, data]) => (
                        <div key={zone} className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[13px] font-semibold text-white">{zone}</span>
                            <span className="font-mono text-[11px] text-ck-muted">{data.count} {t('detail.posAbbrev')}</span>
                          </div>
                          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-white">{num(data.hours)}</div>
                          <div className="text-[11px] text-ck-muted">{t('detail.zoneHours')}</div>
                          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ck-dark-surface">
                            <div className="h-full rounded-full bg-ck-red" style={{ width: `${Math.round(data.hours / maxH * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Full table */}
                <div className="overflow-x-auto rounded-lg border border-ck-dark-border bg-ck-dark-card">
                  <div className="min-w-[700px] grid grid-cols-[58px_1.5fr_1.2fr_74px_1.3fr_78px_78px_74px_64px] gap-3 border-b border-ck-dark-border bg-ck-dark-surface px-4 py-2.5">
                    {[t('table.ref'), t('table.component'), t('table.damage'), t('table.severity'), t('table.disposition'), t('table.bodywork'), t('table.paintwork'), t('table.parts'), t('table.flag')].map(h => (
                      <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{h}</span>
                    ))}
                  </div>
                  {findings.map(f => {
                    const sev = SEV_META[f.severity] || SEV_META[2];
                    const isPre = f.origin === 'pre_existent';
                    const selected = f.reference === selectedRef;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedRef(f.reference)}
                        className={`min-w-[700px] grid grid-cols-[58px_1.5fr_1.2fr_74px_1.3fr_78px_78px_74px_64px] gap-3 items-center border-b border-ck-dark-border px-4 py-2.5 cursor-pointer hover:bg-ck-dark-surface ${
                          selected ? 'bg-ck-red/5' : ''
                        }`}
                      >
                        <span className="font-mono text-[12px] font-medium text-ck-muted">{f.reference}</span>
                        <span className="truncate text-[13px] font-medium text-white">{f.component_key}</span>
                        <span className="truncate text-[12px] text-ck-muted-light">{f.damage_types?.join(', ')}</span>
                        <span className={`font-mono text-[12px] tracking-wider ${sev.color}`}>{sev.bar}</span>
                        <span className="truncate text-[12px] text-ck-muted-light">{f.repair_technique || dispLabel(f.disposition)}</span>
                        <span className="text-right font-mono text-[12px] tabular-nums text-ck-muted-light">{f.repair_hours ? num(f.repair_hours) : '—'}</span>
                        <span className="text-right font-mono text-[12px] tabular-nums text-ck-muted-light">{f.paint_hours ? num(f.paint_hours) : '—'}</span>
                        <span className="truncate text-[11px] text-ck-muted">{f.ins_finding_parts?.length ? t('table.newParts', { count: f.ins_finding_parts.length }) : '—'}</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                          f.hidden_damage_possible || f.adas_possible ? 'text-orange-400' : isPre ? 'text-ck-muted' : 'text-ck-muted/30'
                        }`}>
                          {f.hidden_damage_possible ? t('table.flagHidden') : f.adas_possible ? t('table.flagAdas') : isPre ? t('table.flagOutOfScope') : ''}
                        </span>
                      </div>
                    );
                  })}

                  {/* Totals row */}
                  <div className="min-w-[700px] grid grid-cols-[58px_1.5fr_1.2fr_74px_1.3fr_78px_78px_74px_64px] gap-3 border-t-2 border-white px-4 py-3">
                    <span />
                    <span className="text-[13px] font-semibold text-white">{t('table.totalInOrder')}</span>
                    <span /><span /><span className="text-right text-[11px] text-ck-muted">{t('table.hoursLabel')}</span>
                    <span className="text-right font-mono text-[13px] font-semibold tabular-nums text-white">{num(repairTotal)}</span>
                    <span className="text-right font-mono text-[13px] font-semibold tabular-nums text-white">{num(paintTotal)}</span>
                    <span className="text-[11px] text-ck-muted">{partCount} {t('detail.posAbbrev')}</span>
                    <span />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Verificatie view ═══ */}
            {view === 'verificatie' && (
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-5 items-start">
                {/* Events */}
                <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
                  <h3 className="mb-3 text-base font-semibold text-white">{t('verify.events')}</h3>
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
                    <p className="py-4 text-center text-sm text-ck-muted">{t('verify.noEvents')}</p>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Integrity */}
                  <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
                    <h3 className="mb-3 text-base font-semibold text-white">{t('verify.integrity')}</h3>
                    {[
                      [t('verify.snapshot'), snapshot?.snapshot_hash ? snapshot.snapshot_hash.slice(0, 4) + '…' + snapshot.snapshot_hash.slice(-4) : '—'],
                      [t('verify.pdf'), snapshot?.pdf_hash ? snapshot.pdf_hash.slice(0, 4) + '…' + snapshot.pdf_hash.slice(-4) : '—'],
                      [t('verify.photosLabel', { count: ins.photo_count }), t('verify.allSha256Match')],
                      [t('verify.catalogInSnapshot'), t('verify.catalogComponents')],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-t border-ck-dark-border py-1.5">
                        <span className="text-[12px] text-ck-muted">{k}</span>
                        <span className="font-mono text-[12px] text-white">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Signature */}
                  <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
                    <h3 className="mb-3 text-base font-semibold text-white">{t('verify.signatures')}</h3>
                    {approvals.map(a => (
                      <div key={a.id}>
                        {[
                          [t('verify.role'), a.role === 'klant' ? tIn('detail.roleCustomer') : tIn('detail.roleInspector')],
                          [t('verify.name'), a.signer_name],
                          [t('verify.identification'), a.identification || t('verify.loggedIn')],
                          [t('verify.statement'), a.statement_text || t('verify.defaultStatement')],
                          [t('verify.timestamp'), fmtDateTime(a.signed_at)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 border-t border-ck-dark-border py-1.5">
                            <span className="text-[12px] text-ck-muted">{k}</span>
                            <span className="text-[12px] text-white text-right">{v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {approvals.length === 0 && (
                      <p className="py-2 text-center text-sm text-ck-muted">{t('verify.noSignatures')}</p>
                    )}
                    <p className="mt-3 text-[11px] leading-relaxed text-ck-muted">
                      {t('verify.eidasText')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ─── Right sidebar: finding detail ─── */}
        {selectedFinding && (
          <aside className={`${showRightPanel ? 'flex' : 'hidden'} xl:flex w-[340px] flex-none flex-col border-l border-ck-dark-border bg-ck-dark-card min-h-0 absolute xl:relative right-0 z-20 h-full`}>
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
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('detail.findingDetail')}</span>
              <span className="font-mono text-[12px] font-medium text-white">{selectedFinding.reference}</span>
            </div>

            <div className="flex-1 overflow-auto px-4 py-4">
              <h3 className="text-xl font-semibold text-white">{selectedFinding.component_key}</h3>
              <span className="mt-0.5 block text-[12px] text-ck-muted">
                {selectedFinding.sub_location || t('detail.noSubLocation')}
              </span>

              {/* Severity + disposition */}
              <div className="mt-4 flex items-center gap-2">
                <span className={`font-mono text-sm tracking-wider ${(SEV_META[selectedFinding.severity] || SEV_META[2]).color}`}>
                  {(SEV_META[selectedFinding.severity] || SEV_META[2]).bar}
                </span>
                <span className="text-[12px] text-ck-muted-light">{sevLabel(selectedFinding.severity)}</span>
                <span className="ml-auto rounded bg-ck-dark-surface px-2 py-0.5 text-[11px] font-medium text-ck-muted-light">
                  {dispLabel(selectedFinding.disposition)}
                </span>
              </div>

              {/* Photos */}
              {selectedPhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  {selectedPhotos.slice(0, 4).map(p => (
                    <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded bg-ck-dark-surface">
                      {p.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.url} alt={p.reference} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 9px, rgba(255,255,255,0.05) 9px, rgba(255,255,255,0.05) 10px)' }} />
                      )}
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
                  [t('report.zone'), selectedFinding.sub_location || selectedFinding.component_key],
                  [t('report.damage'), selectedFinding.damage_types?.join(', ') || '—'],
                  [t('report.dispositionRow'), selectedFinding.repair_technique || '—'],
                  [t('report.paintLabel'), selectedFinding.paint_required ? (selectedFinding.paint_operation || t('report.panel')) : t('report.paintNotRequired')],
                  [t('photos'), selectedPhotos.map(p => p.reference).join(' · ') || '—'],
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
                  <span>{t('report.bodywork')}</span>
                  <span className="font-mono tabular-nums">{hrsT(selectedFinding.repair_hours)}</span>
                </div>
                <div className="mt-1 flex justify-between text-[12px] text-ck-muted-light">
                  <span>{t('report.paintwork')}</span>
                  <span className="font-mono tabular-nums">{hrsT(selectedFinding.paint_hours)}</span>
                </div>
              </div>

              {/* Parts */}
              {selectedFinding.ins_finding_parts?.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('report.partsLabel')}</span>
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
                    {selectedFinding.hidden_damage_possible ? t('report.hidden') : t('report.adas')}
                  </span>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ck-muted-light">
                    {selectedFinding.hidden_damage_note || t('report.adasCalibration')}
                  </p>
                </div>
              )}

              {/* Evidence */}
              <div className="mt-5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ck-muted">{t('detail.evidence')}</span>
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
                {locked ? t('detail.lockedNoEdit') : `${t('detail.statusPrefix')} ${t(`statuses.${ins.status}`)}`}
              </span>
              <Link
                href="/app/offertes"
                className="rounded-lg border border-ck-dark-border px-3 py-1.5 text-[12px] font-medium text-ck-muted-light hover:bg-ck-dark-surface hover:text-white"
              >
                {t('detail.toQuote')}
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
