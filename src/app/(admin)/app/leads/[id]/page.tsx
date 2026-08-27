'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MessageCircle, FileText, Trophy, XCircle, Image as ImageIcon, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
                    onClick={() => setEnlargedPhoto(p.url)}
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
              {lead.status === 'quoted' || lead.status === 'contacted' ? (
                <Link
                  href={`/app/offertes/nieuw?lead=${id}`}
                  className="block w-full rounded-lg bg-ck-red px-4 py-2 text-center text-sm font-semibold text-white hover:bg-ck-red-hover"
                >
                  {t('createOffer')}
                </Link>
              ) : null}
              {!lead.customers && (
                <button
                  onClick={() => router.push(`/app/klanten/nieuw?from_lead=${id}`)}
                  className="block w-full rounded-lg border border-ck-dark-border px-4 py-2 text-center text-sm text-ck-muted-light hover:text-white"
                >
                  {t('createCustomer')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8"
          onClick={() => setEnlargedPhoto(null)}
        >
          <button className="absolute right-4 top-4 text-white/70 hover:text-white">
            <X size={24} />
          </button>
          <img src={enlargedPhoto} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
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
