'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Clock, User, Phone, Mail, Car,
  CheckCircle2, XCircle, AlertCircle, MapPin, Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import type { AppointmentType, AppointmentStatus } from '@/types/database';

type Appointment = {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  job_id: string | null;
  resource_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers: { id: string; name: string; email: string | null; phone: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
  resources: { id: string; type: string; name: string } | null;
  staff: { id: string; name: string } | null;
};

const TYPE_COLORS: Record<AppointmentType, { bg: string; text: string; border: string }> = {
  inspection: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30' },
  drop_off: { bg: 'bg-blue-400/10', text: 'text-blue-400', border: 'border-blue-400/30' },
  collection: { bg: 'bg-purple-400/10', text: 'text-purple-400', border: 'border-purple-400/30' },
  repair_slot: { bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/30' },
};

const STATUS_CONFIG: Record<AppointmentStatus, { icon: typeof CheckCircle2; color: string }> = {
  requested: { icon: AlertCircle, color: 'text-amber-400' },
  confirmed: { icon: CheckCircle2, color: 'text-green-400' },
  cancelled: { icon: XCircle, color: 'text-red-400' },
  completed: { icon: CheckCircle2, color: 'text-blue-400' },
};

export default function AppointmentDetailPage() {
  const t = useTranslations('ap');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/appointments/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setAppt(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleAction(action: string, extra?: Record<string, string>) {
    setUpdating(true);
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAppt(updated);
    }
    setUpdating(false);
  }

  async function handleDelete() {
    if (!confirm(t('deleteConfirm'))) return;
    const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/afspraken');
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function fmtDateTime(d: string) {
    return new Date(d).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-dark-border border-t-ck-red" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-ck-muted" />
        <p className="text-ck-muted">{t('notFound')}</p>
        <Link href="/app/afspraken" className="text-sm text-ck-red hover:underline">{t('back')}</Link>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[appt.type];
  const statusCfg = STATUS_CONFIG[appt.status];
  const StatusIcon = statusCfg.icon;
  const canConfirm = appt.status === 'requested';
  const canCancel = appt.status === 'requested' || appt.status === 'confirmed';
  const canComplete = appt.status === 'confirmed';

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/afspraken" className="flex h-8 w-8 items-center justify-center rounded-lg border border-ck-dark-border text-ck-muted hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{appt.contact_name}</h1>
              <ScreenBadge code="AP10" />
            </div>
            <p className="text-xs text-ck-muted">{t('detail')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canConfirm && (
            <button onClick={() => handleAction('confirm')} disabled={updating} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50">
              {t('confirm')}
            </button>
          )}
          {canComplete && (
            <button onClick={() => handleAction('complete')} disabled={updating} className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50">
              {t('complete')}
            </button>
          )}
          {canCancel && (
            <button onClick={() => handleAction('cancel')} disabled={updating} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
              {t('cancel')}
            </button>
          )}
          <button onClick={handleDelete} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ck-dark-border text-ck-muted hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Status + Type badges */}
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusCfg.color} bg-current/10`}>
          <StatusIcon size={13} />
          {t(appt.status)}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
          {t(appt.type)}
        </span>
      </div>

      {/* Main info card */}
      <div className="rounded-xl border border-ck-dark-border bg-ck-panel p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar size={16} className="mt-0.5 text-ck-muted" />
            <div>
              <p className="text-xs text-ck-muted">{t('date')}</p>
              <p className="text-sm font-medium text-white capitalize">{fmtDate(appt.scheduled_date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={16} className="mt-0.5 text-ck-muted" />
            <div>
              <p className="text-xs text-ck-muted">{t('time')}</p>
              <p className="text-sm font-medium text-white">
                {appt.scheduled_time.slice(0, 5)} · {appt.duration_minutes} {t('minutes')}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-ck-dark-border pt-4 grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User size={16} className="mt-0.5 text-ck-muted" />
            <div>
              <p className="text-xs text-ck-muted">{t('contact')}</p>
              <p className="text-sm font-medium text-white">{appt.contact_name}</p>
              {appt.contact_phone && (
                <p className="flex items-center gap-1 text-xs text-ck-muted mt-0.5">
                  <Phone size={10} /> {appt.contact_phone}
                </p>
              )}
              {appt.contact_email && (
                <p className="flex items-center gap-1 text-xs text-ck-muted mt-0.5">
                  <Mail size={10} /> {appt.contact_email}
                </p>
              )}
            </div>
          </div>
          {appt.resources && (
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 text-ck-muted" />
              <div>
                <p className="text-xs text-ck-muted">{t('resource')}</p>
                <p className="text-sm font-medium text-white">{appt.resources.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Customer */}
        {appt.customers && (
          <div className="border-t border-ck-dark-border pt-4">
            <div className="flex items-start gap-3">
              <User size={16} className="mt-0.5 text-ck-muted" />
              <div>
                <p className="text-xs text-ck-muted">{t('customer')}</p>
                <Link href={`/app/klanten/${appt.customers.id}`} className="text-sm font-medium text-ck-red hover:underline">
                  {appt.customers.name}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle */}
        {appt.vehicles && (
          <div className="border-t border-ck-dark-border pt-4">
            <div className="flex items-start gap-3">
              <Car size={16} className="mt-0.5 text-ck-muted" />
              <div>
                <p className="text-xs text-ck-muted">{t('vehicle')}</p>
                <Link href={`/app/voertuigen/${appt.vehicles.id}`} className="text-sm font-medium text-ck-red hover:underline">
                  {appt.vehicles.kenteken ?? ''} {appt.vehicles.make} {appt.vehicles.model}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {appt.notes && (
          <div className="border-t border-ck-dark-border pt-4">
            <p className="text-xs text-ck-muted mb-1">{t('notes')}</p>
            <p className="text-sm text-white/80 whitespace-pre-wrap">{appt.notes}</p>
          </div>
        )}
      </div>

      {/* Timeline card */}
      <div className="rounded-xl border border-ck-dark-border bg-ck-panel p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ck-muted">{t('createdAt')}</span>
            <span className="text-white/70">{fmtDateTime(appt.created_at)}</span>
          </div>
          {appt.staff && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-ck-muted">{t('createdBy')}</span>
              <span className="text-white/70">{appt.staff.name}</span>
            </div>
          )}
          {appt.confirmed_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400">{t('confirmedAt')}</span>
              <span className="text-white/70">{fmtDateTime(appt.confirmed_at)}</span>
            </div>
          )}
          {appt.cancelled_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-400">{t('cancelledAt')}</span>
              <span className="text-white/70">{fmtDateTime(appt.cancelled_at)}</span>
            </div>
          )}
          {appt.cancel_reason && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-ck-muted">{t('cancelReason')}</span>
              <span className="text-white/70">{appt.cancel_reason}</span>
            </div>
          )}
          {appt.completed_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400">{t('completedAt')}</span>
              <span className="text-white/70">{fmtDateTime(appt.completed_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
