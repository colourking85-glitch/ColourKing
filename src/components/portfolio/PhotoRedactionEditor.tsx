'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, ScanSearch, Eye, EyeOff, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { loadImage, drawRedacted, canvasToBlob, toDetectionBase64 } from '@/modules/portfolio/redact';
import type { RedactionRegion } from '@/modules/portfolio/schema';

type Phase = 'before' | 'during' | 'after';

type Props = {
  projectId: string;
  /** A local file (upload) or a work order photo URL (import) */
  source: { file: File } | { url: string; jobPhotoId: string; phase: string };
  defaultPairGroup: number;
  onClose: () => void;
  onSaved: () => void;
};

type Drag =
  | { kind: 'draw'; startX: number; startY: number }
  | { kind: 'move'; index: number; offX: number; offY: number }
  | { kind: 'resize'; index: number };

const MIN = 0.01;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * PF10 photo editor: licence plates are hidden before upload. AI suggests
 * boxes, staff adjust/add/remove them, confirm, and only the redacted
 * (pixelated + blurred, EXIF-free) image is uploaded.
 */
export function PhotoRedactionEditor({ projectId, source, defaultPairGroup, onClose, onSaved }: Props) {
  const t = useTranslations('pf');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [regions, setRegions] = useState<RedactionRegion[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [phase, setPhase] = useState<Phase>('phase' in source && ['before', 'during', 'after'].includes(source.phase) ? source.phase as Phase : 'after');
  const [pairGroup, setPairGroup] = useState(defaultPairGroup);
  const [isCover, setIsCover] = useState(false);
  const [altNl, setAltNl] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [draft, setDraft] = useState<RedactionRegion | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const detect = useCallback(async (image: HTMLImageElement) => {
    setDetecting(true);
    setDetectMsg(null);
    try {
      const res = await fetch('/api/portfolio/detect-plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: toDetectionBase64(image) }),
      });
      const json = await res.json();
      if (json.ok) {
        setRegions(prev => [...prev.filter(r => r.source !== 'ai'), ...json.regions]);
        setDetectMsg(json.regions.length ? t('detectFound', { n: json.regions.length }) : t('detectNone'));
      } else {
        setDetectMsg(json.error === 'not_configured' ? t('detectUnavailable') : t('detectFailed'));
      }
    } catch {
      setDetectMsg(t('detectFailed'));
    } finally {
      setDetecting(false);
    }
  }, [t]);

  // Load the image, then ask for AI suggestions
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const image = await loadImage('file' in source ? source.file : source.url);
        if (cancelled) return;
        setImg(image);
        detect(image);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redacted preview
  useEffect(() => {
    if (!preview || !img || !previewRef.current) return;
    const out = drawRedacted(img, regions, 1200);
    const c = previewRef.current;
    c.width = out.width;
    c.height = out.height;
    c.getContext('2d')!.drawImage(out, 0, 0);
  }, [preview, img, regions]);

  function point(e: React.PointerEvent) {
    const rect = stageRef.current!.getBoundingClientRect();
    return { x: clamp01((e.clientX - rect.left) / rect.width), y: clamp01((e.clientY - rect.top) / rect.height) };
  }

  function onStageDown(e: React.PointerEvent) {
    if (preview) return;
    const p = point(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ kind: 'draw', startX: p.x, startY: p.y });
    setDraft({ x: p.x, y: p.y, w: 0, h: 0, source: 'manual' });
  }

  function onBoxDown(e: React.PointerEvent, index: number) {
    e.stopPropagation();
    const p = point(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ kind: 'move', index, offX: p.x - regions[index].x, offY: p.y - regions[index].y });
  }

  function onHandleDown(e: React.PointerEvent, index: number) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ kind: 'resize', index });
  }

  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = point(e);
    if (drag.kind === 'draw') {
      setDraft({
        x: Math.min(drag.startX, p.x),
        y: Math.min(drag.startY, p.y),
        w: Math.abs(p.x - drag.startX),
        h: Math.abs(p.y - drag.startY),
        source: 'manual',
      });
    } else if (drag.kind === 'move') {
      setRegions(rs => rs.map((r, i) => i !== drag.index ? r : {
        ...r,
        x: clamp01(Math.min(p.x - drag.offX, 1 - r.w)),
        y: clamp01(Math.min(p.y - drag.offY, 1 - r.h)),
      }));
    } else {
      setRegions(rs => rs.map((r, i) => i !== drag.index ? r : {
        ...r,
        w: Math.max(MIN, Math.min(p.x - r.x, 1 - r.x)),
        h: Math.max(MIN, Math.min(p.y - r.y, 1 - r.y)),
      }));
    }
  }

  function onUp() {
    if (drag?.kind === 'draw' && draft && draft.w > MIN && draft.h > MIN) {
      setRegions(rs => [...rs, draft]);
    }
    setDrag(null);
    setDraft(null);
  }

  async function save() {
    if (!img || !confirmed) return;
    setSaving(true);
    setError(null);
    try {
      const canvas = drawRedacted(img, regions);
      let blob = await canvasToBlob(canvas, 'image/webp');
      if (blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', 0.85); // Safari has no WebP encoder
      const type = blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

      const form = new FormData();
      form.append('file', new File([blob], `photo.${type === 'image/webp' ? 'webp' : 'jpg'}`, { type }));
      form.append('meta', JSON.stringify({ phase, pair_group: pairGroup, is_cover: isCover, alt_nl: altNl || null }));
      form.append('regions', JSON.stringify(regions));
      form.append('width', String(canvas.width));
      form.append('height', String(canvas.height));
      form.append('confirmed', 'true');
      if ('jobPhotoId' in source) form.append('source_job_photo_id', source.jobPhotoId);

      const res = await fetch(`/api/portfolio/${projectId}/photos`, { method: 'POST', body: form });
      if (!res.ok) {
        setError((await res.json().catch(() => ({}))).error ?? t('saveFailed'));
        return;
      }
      onSaved();
    } catch {
      setError(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const shown = draft ? [...regions, draft] : regions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-ck-dark-border bg-ck-dark-card">
        <div className="flex items-center justify-between border-b border-ck-dark-border px-5 py-3">
          <h2 className="text-sm font-semibold text-white">{t('editorTitle')}</h2>
          <button onClick={onClose} className="rounded p-1 text-ck-muted hover:text-white" aria-label={t('close')}><X size={18} /></button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[1fr_280px]">
          {/* Stage */}
          <div>
            {loadError ? (
              <p className="p-8 text-center text-sm text-red-400">{t('loadFailed')}</p>
            ) : !img ? (
              <div className="flex h-64 items-center justify-center text-ck-muted"><Loader2 className="animate-spin" /></div>
            ) : preview ? (
              <canvas ref={previewRef} className="h-auto w-full rounded-lg" />
            ) : (
              <div
                ref={stageRef}
                className="relative w-full cursor-crosshair select-none touch-none overflow-hidden rounded-lg"
                style={{ aspectRatio: `${img.naturalWidth} / ${img.naturalHeight}` }}
                onPointerDown={onStageDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" className="pointer-events-none absolute inset-0 h-full w-full" draggable={false} />
                {shown.map((r, i) => (
                  <div
                    key={i}
                    onPointerDown={e => i < regions.length && onBoxDown(e, i)}
                    className={`absolute cursor-move border-2 ${r.source === 'ai' ? 'border-amber-400 bg-amber-400/25' : 'border-ck-red bg-ck-red/25'}`}
                    style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                  >
                    {i < regions.length && (
                      <>
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => setRegions(rs => rs.filter((_, j) => j !== i))}
                          className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white"
                          aria-label={t('removeBox')}
                        >
                          <Trash2 size={10} />
                        </button>
                        <span
                          onPointerDown={e => onHandleDown(e, i)}
                          className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-se-resize rounded-sm bg-white"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-ck-muted">{t('editorHint')}</p>
          </div>

          {/* Controls */}
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <button
                onClick={() => img && detect(img)}
                disabled={!img || detecting}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-ck-muted-light hover:text-white disabled:opacity-50"
              >
                {detecting ? <Loader2 size={13} className="animate-spin" /> : <ScanSearch size={13} />}
                {detecting ? t('detecting') : t('detectPlates')}
              </button>
              {detectMsg && <p className="text-[11px] text-ck-muted">{detectMsg}</p>}
              <button
                onClick={() => setPreview(p => !p)}
                disabled={!img}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-ck-muted-light hover:text-white disabled:opacity-50"
              >
                {preview ? <EyeOff size={13} /> : <Eye size={13} />}
                {preview ? t('editBoxes') : t('previewResult')}
              </button>
              <p className="text-[11px] text-ck-muted">{t('boxCount', { n: regions.length })}</p>
            </div>

            <label className="block">
              <span className="mb-1 block text-ck-muted">{t('phase')}</span>
              <select value={phase} onChange={e => setPhase(e.target.value as Phase)} className="w-full rounded border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-white">
                <option value="before">{t('phaseBefore')}</option>
                <option value="during">{t('phaseDuring')}</option>
                <option value="after">{t('phaseAfter')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-ck-muted">{t('pairGroup')}</span>
              <input type="number" min={0} value={pairGroup} onChange={e => setPairGroup(Number(e.target.value) || 0)} className="w-full rounded border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-white" />
              <span className="mt-1 block text-[10px] text-ck-muted">{t('pairGroupHint')}</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-ck-muted">{t('altText')}</span>
              <input value={altNl} onChange={e => setAltNl(e.target.value)} maxLength={200} className="w-full rounded border border-ck-dark-border bg-ck-dark-surface px-2 py-1.5 text-white" />
            </label>
            <label className="flex items-center gap-2 text-ck-muted-light">
              <input type="checkbox" checked={isCover} onChange={e => setIsCover(e.target.checked)} />
              {t('useAsCover')}
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-amber-200">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5" />
              <span>{t('confirmRedaction')}</span>
            </label>

            {error && <p className="text-red-400">{error}</p>}
            <button
              onClick={save}
              disabled={!img || !confirmed || saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {t('saveRedacted')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
