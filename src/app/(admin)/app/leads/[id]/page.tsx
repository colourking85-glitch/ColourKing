'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MessageCircle, FileText, Trophy, XCircle, Image as ImageIcon, X, Car, Send, Plus, Minus, RotateCcw, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type LeadPhoto = { id: string; storage_path: string; url: string; created_at: string };

type Lead = {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  kenteken: string | null;
  damage_description: string | null;
  preferred_date: string | null;
  status: string;
  origin: string;
  locale: string;
  lost_reason: string | null;
  created_at: string;
  channel: string | null;
  notes: string | null;
  appointment_type: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  location: string | null;
  location_address: string | null;
  customers: { id: string; name: string; email: string | null; phone: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null; colour: string | null } | null;
};

const TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['quoted', 'lost'],
  quoted: ['won', 'lost'],
  won: [],
  lost: [],
};

export default function LeadDetailPage() {
  const t = useTranslations('ld');
  const tCommon = useTranslations('common');

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    new: { label: t('new_status'), color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: Clock },
    contacted: { label: t('contacted'), color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', icon: MessageCircle },
    quoted: { label: t('quoted'), color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', icon: FileText },
    won: { label: t('won'), color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: Trophy },
    lost: { label: t('lost'), color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: XCircle },
  };

  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [photos, setPhotos] = useState<LeadPhoto[]>([]);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const openPhoto = useCallback((url: string) => {
    setEnlargedPhoto(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(10, Math.max(0.5, z - e.deltaY * 0.002)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [zoom, pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handlePointerUp = useCallback(() => setDragging(false), []);

  async function handleReply() {
    if (!replyText.trim() || !lead?.contact_email) return;
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, to: lead.contact_email }),
      });
      if (res.ok) {
        setSent(true);
        setReplyText('');
        setTimeout(() => setSent(false), 3000);
      }
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setLead)
      .finally(() => setLoading(false));
    fetch(`/api/leads/${id}/photos`)
      .then(r => r.ok ? r.json() : [])
      .then(setPhotos);
  }, [id]);

  async function changeStatus(newStatus: string) {
    setUpdating(true);
    let lostReason: string | undefined;
    if (newStatus === 'lost') {
      lostReason = prompt(t('lostReasonPrompt')) ?? undefined;
      if (lostReason === undefined) { setUpdating(false); return; }
    }

    const body: Record<string, unknown> = { status: newStatus };
    if (lostReason) body.lost_reason = lostReason;

    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setLead(await res.json());
    }
    setUpdating(false);
  }

  async function confirmAppointment() {
    if (!lead?.appointment_type || !lead?.scheduled_date || !lead?.scheduled_time) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/leads/${id}/confirm-appointment`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setLead(prev => prev ? { ...prev, status: updated.lead_status ?? prev.status } : prev);
      }
    } finally {
      setConfirming(false);
    }
  }

  async function declineAppointment() {
    const reason = prompt(t('declineReasonPrompt'));
    if (reason === null) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'lost', lost_reason: reason || t('appointmentDeclined') }),
      });
      if (res.ok) {
        setLead(await res.json());
      }
    } finally {
      setConfirming(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>;
  if (!lead) return <div className="p-8 text-center text-ck-muted">{tCommon('notFound')}</div>;

  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const Icon = cfg.icon;
  const nextStatuses = TRANSITIONS[lead.status] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/leads" className="text-ck-muted hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <ScreenBadge code="LD10" />
          <h1 className="font-display text-2xl font-bold text-white">{lead.contact_name}</h1>
          <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.color}`}>
            <Icon size={12} />
            {cfg.label}
          </span>
        </div>
        <div className="flex gap-2">
          {nextStatuses.map(s => {
            const sc = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={updating}
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${sc.color} hover:opacity-80 disabled:opacity-50`}
              >
                {sc.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">{t('contact')}</h2>
            <dl className="space-y-3">
              <Row label={t('email')} value={lead.contact_email} />
              <Row label={t('phone')} value={lead.contact_phone} />
              <Row label={t('kenteken')} value={lead.kenteken} mono />
              <Row label={t('preferredDate')} value={lead.preferred_date ? new Date(lead.preferred_date).toLocaleDateString('nl-NL') : null} />
              <Row label={t('source')} value={lead.origin} />
              <Row label={t('status')} value={lead.locale?.toUpperCase()} />
              <Row label={tCommon('create')} value={new Date(lead.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            </dl>
            {lead.lost_reason && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs text-red-400">{t('lostReason')}: {lead.lost_reason}</p>
              </div>
            )}
          </div>

          {lead.damage_description && (
            <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-ck-muted">{t('damage')}</h2>
              <p className="text-sm text-ck-muted-light whitespace-pre-wrap">{lead.damage_description}</p>
            </div>
          )}

          {lead.notes && !lead.appointment_type && (
            <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase text-ck-muted">{t('notesLabel')}</h2>
              <p className="text-sm text-ck-muted-light whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {lead.appointment_type && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase text-amber-400">
                <Calendar size={14} />
                {t('appointmentRequest')}
              </h2>
              <dl className="space-y-3">
                <Row label={t('appointmentType')} value={t(`type_${lead.appointment_type}`)} />
                <Row label={tCommon('date')} value={lead.scheduled_date ? new Date(lead.scheduled_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                <Row label={t('time')} value={lead.scheduled_time?.slice(0, 5) ?? null} />
                <Row label={t('locationLabel')} value={lead.location === 'other' ? t('locationOther') : t('locationShop')} />
                {lead.location === 'other' && lead.location_address && (
                  <div className="flex items-start gap-2 rounded-lg border border-ck-dark-border bg-ck-dark-surface p-3">
                    <MapPin size={14} className="mt-0.5 text-ck-muted shrink-0" />
                    <p className="text-sm text-ck-muted-light">{lead.location_address}</p>
                  </div>
                )}
              </dl>
              {lead.notes && (
                <div className="mt-3 rounded-lg border border-ck-dark-border bg-ck-dark-surface p-3">
                  <p className="text-xs text-ck-muted mb-1">{t('notesLabel')}</p>
                  <p className="text-sm text-ck-muted-light whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
              {lead.status !== 'won' && lead.status !== 'lost' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={confirmAppointment}
                    disabled={confirming}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    {t('confirmAppointment')}
                  </button>
                  <button
                    onClick={declineAppointment}
                    disabled={confirming}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    {t('declineAppointment')}
                  </button>
                </div>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-ck-muted">
                <ImageIcon size={14} />
                {t('photos')} ({photos.length})
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => openPhoto(p.url)}
                    className="aspect-square overflow-hidden rounded-lg border border-ck-dark-border hover:border-ck-red transition-colors"
                  >
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">{tCommon('customer')}</h2>
            {lead.customers ? (
              <Link href={`/app/klanten/${lead.customers.id}`} className="text-sm text-white hover:text-ck-red">
                {lead.customers.name}
              </Link>
            ) : (
              <p className="text-sm text-ck-muted">{tCommon('notLinked')}</p>
            )}
          </div>

          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">{tCommon('vehicle')}</h2>
            {lead.vehicles ? (
              <Link href={`/app/voertuigen/${lead.vehicles.id}`} className="text-sm text-white hover:text-ck-red">
                {lead.vehicles.kenteken ?? tCommon('unknown')} — {lead.vehicles.make} {lead.vehicles.model}
              </Link>
            ) : (
              <p className="text-sm text-ck-muted">{tCommon('notLinked')}</p>
            )}
          </div>

          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase text-ck-muted">{tCommon('actions')}</h2>
            <div className="space-y-2">
              <Link
                href={`/app/offertes/nieuw?lead=${id}`}
                className="block w-full rounded-lg bg-ck-red px-4 py-2 text-center text-sm font-semibold text-white hover:bg-ck-red-hover"
              >
                {t('createOffer')}
              </Link>
              {!lead.vehicles && (
                <Link
                  href={`/app/voertuigen/nieuw${lead.kenteken ? `?kenteken=${encodeURIComponent(lead.kenteken)}` : ''}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-ck-dark-border px-4 py-2 text-sm text-ck-muted-light hover:text-white hover:border-ck-muted/50"
                >
                  <Car size={14} />
                  {t('createVehicle')}
                </Link>
              )}
              {!lead.customers && (
                <button
                  onClick={() => router.push(`/app/klanten/nieuw?from_lead=${id}`)}
                  className="block w-full rounded-lg border border-ck-dark-border px-4 py-2 text-center text-sm text-ck-muted-light hover:text-white hover:border-ck-muted/50"
                >
                  {t('createCustomer')}
                </button>
              )}
            </div>
          </div>

          {lead.contact_email && (
            <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-ck-muted">
                <Send size={14} />
                {t('quickReply')}
              </h2>
              <p className="mb-2 text-xs text-ck-text-3">{lead.contact_email}</p>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={3}
                placeholder={t('replyPlaceholder')}
                className="w-full resize-none rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-ck-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-50"
                >
                  <Send size={12} />
                  {sending ? tCommon('loading') : t('sendReply')}
                </button>
                {sent && <span className="text-xs text-green-400">{t('replySent')}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
          onClick={e => { if (e.target === e.currentTarget) setEnlargedPhoto(null); }}
        >
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.min(10, z + 0.5))}
              className="rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white"
              title="Zoom in"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => { setZoom(z => Math.max(0.5, z - 0.5)); setPan({ x: 0, y: 0 }); }}
              className="rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white"
              title="Zoom out"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
            <span className="min-w-[3rem] text-center text-xs text-white/60">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {photos.map(p => (
                <button
                  key={p.id}
                  onClick={() => openPhoto(p.url)}
                  className={`h-12 w-12 overflow-hidden rounded border-2 transition-colors ${p.url === enlargedPhoto ? 'border-ck-red' : 'border-white/20 hover:border-white/50'}`}
                >
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div
            className="flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            <div className="flex h-full w-full items-center justify-center p-8">
              <img
                src={enlargedPhoto}
                alt=""
                className="max-h-full max-w-full object-contain select-none"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: dragging ? 'none' : 'transform 0.15s ease-out',
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-ck-muted">{label}</dt>
      <dd className={`text-sm text-ck-muted-light ${mono ? 'font-mono uppercase' : ''}`}>{value || '—'}</dd>
    </div>
  );
}
