'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ChevronRight, MessageSquare, Clock, Camera, Upload, Trash2, X, FileCheck } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import {
  STAGE_LABELS,
  STAGE_COLORS,
  nextStages,
  JOB_STAGES,
  stageIndex,
  type JobStage,
} from '@/modules/jobs/machine';

type JobEvent = {
  id: string;
  event_type: string;
  from_stage: string | null;
  to_stage: string | null;
  note: string | null;
  created_at: string;
};

type JobPhoto = {
  id: string;
  phase: string;
  storage_path: string;
  url: string;
  caption: string | null;
  created_at: string;
};

type JobDetail = {
  id: string;
  number: number;
  stage: JobStage;
  intake_km: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  estimated_delivery_at: string | null;
  customers: { id: string; name: string; email: string | null; phone: string | null } | null;
  vehicles: { id: string; kenteken: string; make: string; model: string; colour: string; year: number | null } | null;
  job_events: JobEvent[];
  job_photos: { id: string; phase: string; storage_path: string; caption: string | null; created_at: string }[];
};

export default function JobDetailPage() {
  const t = useTranslations('jb');
  const tCommon = useTranslations('common');
  const PHASE_LABELS: Record<string, string> = {
    before: t('before'),
    during: t('during'),
    after: t('after'),
  };
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [photoPhase, setPhotoPhase] = useState('before');
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setJob)
      .finally(() => setLoading(false));
  }, [id]);

  const loadPhotos = useCallback(() => {
    fetch(`/api/jobs/${id}/photos`)
      .then(r => r.ok ? r.json() : [])
      .then(setPhotos);
  }, [id]);

  useEffect(() => { load(); loadPhotos(); }, [load, loadPhotos]);

  async function handleTransition(to: JobStage) {
    if (!job) return;
    setTransitioning(true);
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: to, from_stage: job.stage }),
    });
    load();
    setTransitioning(false);
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    await fetch(`/api/jobs/${id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'note', note }),
    });
    setNote('');
    load();
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phase', photoPhase);
      await fetch(`/api/jobs/${id}/photos`, { method: 'POST', body: formData });
    }

    loadPhotos();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDeletePhoto(photoId: string) {
    await fetch(`/api/jobs/${id}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    });
    loadPhotos();
  }

  if (loading) return <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>;
  if (!job) return <div className="p-8 text-center text-red-400">{tCommon('notFound')}</div>;

  const next = nextStages(job.stage);
  const photosByPhase = (phase: string) => photos.filter(p => p.phase === phase);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-ck-muted hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <ScreenBadge code="JB10" />
          <h1 className="font-display text-2xl font-bold text-white">
            {t('jobNumber')}{job.number}
          </h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[job.stage]}`}>
            {STAGE_LABELS[job.stage]}
          </span>
        </div>
      </div>

      {/* Stage progress bar */}
      <div className="flex gap-1">
        {JOB_STAGES.filter(s => s !== 'closed').map(s => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${
              stageIndex(s) <= stageIndex(job.stage) ? 'bg-ck-red' : 'bg-ck-dark-border'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer & vehicle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
              <h3 className="mb-2 text-xs font-medium uppercase text-ck-muted">{t('customer')}</h3>
              {job.customers ? (
                <div>
                  <Link href={`/app/klanten/${job.customers.id}`} className="font-medium text-white hover:text-ck-red">
                    {job.customers.name}
                  </Link>
                  {job.customers.phone && <div className="text-sm text-ck-muted-light">{job.customers.phone}</div>}
                  {job.customers.email && <div className="text-sm text-ck-muted-light">{job.customers.email}</div>}
                </div>
              ) : (
                <span className="text-sm text-ck-muted">{t('notLinked')}</span>
              )}
            </div>

            <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
              <h3 className="mb-2 text-xs font-medium uppercase text-ck-muted">{t('vehicle')}</h3>
              {job.vehicles ? (
                <div>
                  <div className="font-mono font-medium text-white">{job.vehicles.kenteken}</div>
                  <div className="text-sm text-ck-muted-light">
                    {job.vehicles.make} {job.vehicles.model} {job.vehicles.year ?? ''}
                  </div>
                  <div className="text-sm text-ck-muted-light">{job.vehicles.colour}</div>
                </div>
              ) : (
                <span className="text-sm text-ck-muted">{t('noVehicleLinked')}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-ck-muted">{t('mileageIntake')}</span>{' '}
                <span className="text-white">{job.intake_km ?? '—'}</span>
              </div>
              <div>
                <span className="text-ck-muted">{t('createdDate')}</span>{' '}
                <span className="text-white">{new Date(job.created_at).toLocaleDateString('nl-NL')}</span>
              </div>
              {job.estimated_delivery_at && (
                <div>
                  <span className="text-ck-muted">{t('estimatedDelivery')}</span>{' '}
                  <span className="text-white">{new Date(job.estimated_delivery_at).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              )}
            </div>
            {job.notes && (
              <div className="mt-3 border-t border-ck-dark-border pt-3 text-sm text-ck-muted-light">{job.notes}</div>
            )}
          </div>

          {/* Stage transition */}
          {next.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ck-muted">{t('nextStage')}</span>
              {next.map(to => (
                <button
                  key={to}
                  disabled={transitioning}
                  onClick={() => handleTransition(to)}
                  className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    to === 'in_progress' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-ck-red hover:bg-ck-red-hover'
                  }`}
                >
                  {STAGE_LABELS[to]}
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          )}

          {/* Handover shortcut — visible at ready/delivered/closed stages */}
          {(['ready', 'delivered', 'closed'] as JobStage[]).includes(job.stage) && (
            <Link
              href={`/app/afleverbon?job=${id}`}
              className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm font-medium text-green-400 hover:border-green-500/50 hover:bg-green-500/10 transition-colors"
            >
              <FileCheck size={16} />
              {t('createHandover')}
            </Link>
          )}

          {/* Photos */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase text-ck-muted">
                <Camera size={14} /> {t('photos')}
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={photoPhase}
                  onChange={e => setPhotoPhase(e.target.value)}
                  className="rounded border border-ck-dark-border bg-ck-dark-surface px-2 py-1 text-xs text-white focus:border-ck-red focus:outline-none"
                >
                  <option value="before">{t('before')}</option>
                  <option value="during">{t('during')}</option>
                  <option value="after">{t('after')}</option>
                </select>
                <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-ck-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover">
                  <Upload size={12} />
                  {uploading ? t('uploading') : t('upload')}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {(['before', 'during', 'after'] as const).map(phase => {
              const phasePhotos = photosByPhase(phase);
              if (phasePhotos.length === 0) return null;
              return (
                <div key={phase} className="mb-4">
                  <div className="mb-2 text-xs font-medium text-ck-muted">{PHASE_LABELS[phase]}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {phasePhotos.map(p => (
                      <div key={p.id} className="group relative">
                        <button
                          onClick={() => setLightbox(p.url)}
                          className="block w-full"
                        >
                          <img
                            src={p.url}
                            alt={p.caption ?? `${PHASE_LABELS[phase]} foto`}
                            className="h-24 w-full rounded-lg border border-ck-dark-border object-cover"
                          />
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(p.id)}
                          className="absolute right-1 top-1 hidden rounded bg-red-600 p-1 text-white group-hover:block"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {photos.length === 0 && (
              <div className="py-4 text-center text-sm text-ck-muted">
                {t('noPhotos')}
              </div>
            )}
          </div>

          {/* Add note */}
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-ck-muted">
              <MessageSquare size={14} /> {t('addNote')}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t('notePlaceholder')}
                className="flex-1 rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                className="rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
              >
                {tCommon('add')}
              </button>
            </div>
          </div>
        </div>

        {/* Right column: timeline */}
        <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-4">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase text-ck-muted">
            <Clock size={14} /> {t('timeline')}
          </h3>
          <div className="space-y-3">
            {job.job_events.map(ev => (
              <div key={ev.id} className="border-l-2 border-ck-dark-border pl-3">
                <div className="text-xs text-ck-muted">
                  {new Date(ev.created_at).toLocaleString('nl-NL')}
                </div>
                {ev.event_type === 'stage_change' ? (
                  <div className="text-sm text-white">
                    {ev.from_stage ? (
                      <>{STAGE_LABELS[ev.from_stage as JobStage]} → {STAGE_LABELS[ev.to_stage as JobStage]}</>
                    ) : (
                      <>{t('createdArrow')} {STAGE_LABELS[ev.to_stage as JobStage]}</>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-ck-muted-light">{ev.note}</div>
                )}
              </div>
            ))}
            {job.job_events.length === 0 && (
              <div className="text-sm text-ck-muted">{t('noActivity')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 text-white hover:text-ck-red"
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightbox}
            alt={t('photoEnlarged')}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
