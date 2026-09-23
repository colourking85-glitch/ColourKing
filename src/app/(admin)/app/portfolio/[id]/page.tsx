'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Upload, Star, Trash2, CheckCircle2, Circle, Globe, Archive, RotateCcw,
  EyeOff, Wrench, ShieldCheck, Loader2, ExternalLink,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { PhotoRedactionEditor } from '@/components/portfolio/PhotoRedactionEditor';
import {
  PORTFOLIO_CATEGORIES, PORTFOLIO_HANDLINGS, CONSENT_STATUSES, WORK_ITEMS,
  type ChecklistItem,
} from '@/modules/portfolio/constants';

type Photo = {
  id: string;
  phase: string;
  pair_group: number | null;
  is_cover: boolean;
  url: string;
  redaction_regions: unknown[];
  redaction_confirmed_at: string | null;
  alt_nl: string | null;
};

type Project = {
  id: string;
  dossier_number: string | null;
  status: 'draft' | 'published' | 'archived';
  category: string;
  title_nl: string;
  title_en: string | null;
  title_tr: string | null;
  summary_nl: string | null;
  summary_en: string | null;
  summary_tr: string | null;
  brand_id: string | null;
  model_id: string | null;
  model_free_text: string | null;
  build_year: number | null;
  colour_name: string | null;
  paint_code: string | null;
  work_items: string[];
  duration_working_days: number | null;
  handling: string | null;
  consent_status: string;
  consent_document_id: string | null;
  featured: boolean;
  sort_order: number;
  source: string;
  converted_at: string | null;
  jobs: { id: string; number: number } | null;
  photos: Photo[];
  job_photos_available: { id: string; phase: string; url: string; caption: string | null }[];
  checklist: Record<ChecklistItem, boolean>;
};

type EditorSource = { file: File } | { url: string; jobPhotoId: string; phase: string };

const FIELDS = [
  'category', 'title_nl', 'title_en', 'title_tr', 'summary_nl', 'summary_en', 'summary_tr',
  'brand_id', 'model_id', 'model_free_text', 'build_year', 'colour_name', 'paint_code',
  'work_items', 'duration_working_days', 'handling', 'consent_status', 'featured', 'sort_order',
] as const;

const inputCls = 'w-full rounded-lg border border-ck-dark-border bg-ck-dark-surface px-3 py-2 text-sm text-white focus:border-ck-red focus:outline-none';

export default function PortfolioDetailPage() {
  const t = useTranslations('pf');
  const tp = useTranslations('portfolio');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<Project | null>(null);
  const [form, setForm] = useState<Partial<Project>>({});
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [editor, setEditor] = useState<EditorSource | null>(null);
  const [lang, setLang] = useState<'nl' | 'en' | 'tr'>('nl');

  const load = useCallback(async () => {
    const res = await fetch(`/api/portfolio/${id}`);
    if (!res.ok) { setP(null); return; }
    const data: Project = await res.json();
    setP(data);
    setForm(Object.fromEntries(FIELDS.map(k => [k, data[k]])) as Partial<Project>);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch('/api/vehicle-brands').then(r => (r.ok ? r.json() : [])).then(setBrands); }, []);
  useEffect(() => {
    if (!form.brand_id) { setModels([]); return; }
    fetch(`/api/vehicle-brands/${form.brand_id}/models`).then(r => (r.ok ? r.json() : [])).then(setModels);
  }, [form.brand_id]);

  function set<K extends keyof Project>(key: K, value: Project[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const dirty = p && FIELDS.some(k => JSON.stringify(form[k] ?? null) !== JSON.stringify(p[k] ?? null));

  async function save() {
    setSaving(true);
    setMessage(null);
    const body = Object.fromEntries(FIELDS.map(k => [k, form[k] === '' ? null : form[k]]));
    const res = await fetch(`/api/portfolio/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setMessage({ ok: true, text: t('saved') }); await load(); }
    else setMessage({ ok: false, text: (await res.json().catch(() => ({}))).error ?? t('saveFailed') });
  }

  async function action(name: 'publish' | 'unpublish' | 'archive' | 'restore') {
    if (dirty) await save();
    setMessage(null);
    const res = await fetch(`/api/portfolio/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: name }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setMessage({ ok: true, text: name === 'publish' ? t('publishedAs', { n: json.dossier_number }) : t('saved') });
    else setMessage({ ok: false, text: name === 'publish' ? t('checklistIncomplete') : json.error ?? t('saveFailed') });
    await load();
  }

  async function remove() {
    if (!confirm(t('deleteConfirm'))) return;
    const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/app/portfolio');
  }

  async function photoPatch(photoId: string, body: Record<string, unknown>) {
    await fetch(`/api/portfolio/${id}/photos/${photoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    await load();
  }

  async function photoDelete(photoId: string) {
    if (!confirm(t('deletePhotoConfirm'))) return;
    await fetch(`/api/portfolio/${id}/photos/${photoId}`, { method: 'DELETE' });
    await load();
  }

  if (!p) return <div className="p-8 text-center text-ck-muted">…</div>;

  const nextPair = Math.max(0, ...p.photos.map(ph => ph.pair_group ?? 0)) + (p.photos.some(ph => ph.phase === 'after') ? 1 : 0);
  const checklistOk = Object.values(p.checklist).every(Boolean);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/app/portfolio" className="text-ck-muted hover:text-white"><ArrowLeft size={18} /></Link>
          <ScreenBadge code="PF10" />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{p.title_nl || t('untitled')}</h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ck-muted">
              <span className="font-mono text-ck-muted-light">{p.dossier_number ?? t('numberOnPublish')}</span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${p.status === 'published' ? 'bg-green-400/10 text-green-400' : p.status === 'draft' ? 'bg-amber-400/10 text-amber-400' : 'bg-ck-dark-surface text-ck-muted'}`}>
                {t(`status_${p.status}`)}
              </span>
              {p.jobs && (
                <Link href={`/app/jobs/${p.jobs.id}`} className="flex items-center gap-1 hover:text-white">
                  <Wrench size={11} /> {t('fromJob', { n: p.jobs.number })}
                </Link>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {p.status === 'published' && p.dossier_number && (
            <a href={`https://www.colourking.nl/nl/gallerij/${p.dossier_number}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-xs text-ck-muted-light hover:text-white">
              <ExternalLink size={13} /> {t('viewPublic')}
            </a>
          )}
          {p.status !== 'published' ? (
            <button onClick={() => action('publish')} disabled={!checklistOk} title={checklistOk ? undefined : t('checklistIncomplete')} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-40">
              <Globe size={13} /> {t('publish')}
            </button>
          ) : (
            <button onClick={() => action('unpublish')} className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-xs text-ck-muted-light hover:text-white">
              <EyeOff size={13} /> {t('unpublish')}
            </button>
          )}
          {p.status === 'archived' ? (
            <button onClick={() => action('restore')} className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-xs text-ck-muted-light hover:text-white"><RotateCcw size={13} /> {t('restore')}</button>
          ) : (
            <button onClick={() => action('archive')} className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-xs text-ck-muted-light hover:text-white"><Archive size={13} /> {p.source === 'work_order' && p.status === 'draft' ? t('cancelConversion') : t('archive')}</button>
          )}
          {!p.dossier_number && (
            <button onClick={remove} className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-2 text-xs text-ck-muted hover:text-red-400"><Trash2 size={13} /> {t('delete')}</button>
          )}
        </div>
      </div>

      {message && <p className={`rounded-lg border p-3 text-sm ${message.ok ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>{message.text}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Details */}
        <section className="space-y-4 rounded-lg border border-ck-dark-border bg-ck-dark-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-ck-muted">{t('details')}</h2>
            <button onClick={save} disabled={!dirty || saving} className="flex items-center gap-1.5 rounded-lg bg-ck-red px-4 py-1.5 text-xs font-semibold text-white hover:bg-ck-red-hover disabled:opacity-40">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t('save')}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-ck-muted">{t('category')}
              <select value={form.category ?? 'bodywork'} onChange={e => set('category', e.target.value)} className={`${inputCls} mt-1`}>
                {PORTFOLIO_CATEGORIES.map(c => <option key={c} value={c}>{tp(`category.${c}`)}</option>)}
              </select>
            </label>
            <label className="text-xs text-ck-muted">{t('handling')}
              <select value={form.handling ?? ''} onChange={e => set('handling', e.target.value || null)} className={`${inputCls} mt-1`}>
                <option value="">—</option>
                {PORTFOLIO_HANDLINGS.map(h => <option key={h} value={h}>{tp(`handling.${h}`)}</option>)}
              </select>
            </label>
          </div>

          {/* Texts per language */}
          <div>
            <div className="mb-2 flex gap-1">
              {(['nl', 'en', 'tr'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`rounded px-2.5 py-1 text-xs font-semibold uppercase ${lang === l ? 'bg-ck-red/15 text-ck-red' : 'text-ck-muted hover:text-white'}`}>{l}</button>
              ))}
              <span className="ml-2 self-center text-[10px] text-ck-muted">{t('langFallback')}</span>
            </div>
            <input
              value={(form[`title_${lang}`] as string | null) ?? ''}
              onChange={e => set(`title_${lang}`, e.target.value)}
              placeholder={t('titleNl')}
              maxLength={200}
              className={inputCls}
            />
            <textarea
              value={(form[`summary_${lang}`] as string | null) ?? ''}
              onChange={e => set(`summary_${lang}`, e.target.value)}
              placeholder={t('summary')}
              rows={3}
              maxLength={2000}
              className={`${inputCls} mt-2 resize-y`}
            />
          </div>

          {/* Vehicle */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="text-xs text-ck-muted">{t('brand')}
              <div className="mt-1">
                <SearchableSelect
                  options={brands.map(b => ({ value: b.id, label: b.name }))}
                  value={form.brand_id ?? ''}
                  onChange={val => setForm(f => ({ ...f, brand_id: val || null, model_id: null }))}
                  placeholder={t('brand')}
                />
              </div>
            </div>
            <div className="text-xs text-ck-muted">{t('model')}
              <div className="mt-1">
                <SearchableSelect
                  options={models.map(m => ({ value: m.id, label: m.name }))}
                  value={form.model_id ?? ''}
                  onChange={(val, label) => val === '__custom'
                    ? setForm(f => ({ ...f, model_id: null, model_free_text: label }))
                    : setForm(f => ({ ...f, model_id: val || null }))}
                  placeholder={form.model_free_text || t('model')}
                  allowCustom
                  customLabel={t('otherModel')}
                />
              </div>
            </div>
            <label className="text-xs text-ck-muted">{t('buildYear')}
              <input type="number" min={1900} max={2100} value={form.build_year ?? ''} onChange={e => set('build_year', e.target.value ? Number(e.target.value) : null)} className={`${inputCls} mt-1`} />
            </label>
            <label className="text-xs text-ck-muted">{t('duration')}
              <input type="number" min={0} max={365} value={form.duration_working_days ?? ''} onChange={e => set('duration_working_days', e.target.value ? Number(e.target.value) : null)} className={`${inputCls} mt-1`} />
            </label>
            <label className="text-xs text-ck-muted">{t('colour')}
              <input value={form.colour_name ?? ''} onChange={e => set('colour_name', e.target.value)} maxLength={80} className={`${inputCls} mt-1`} />
            </label>
            <label className="text-xs text-ck-muted">{t('paintCode')}
              <input value={form.paint_code ?? ''} onChange={e => set('paint_code', e.target.value)} maxLength={40} className={`${inputCls} mt-1 font-mono`} />
            </label>
          </div>

          {/* Work items */}
          <div>
            <p className="mb-1.5 text-xs text-ck-muted">{t('workItems')}</p>
            <div className="flex flex-wrap gap-1.5">
              {WORK_ITEMS.map(w => {
                const on = (form.work_items ?? []).includes(w);
                return (
                  <button
                    key={w}
                    onClick={() => set('work_items', on ? (form.work_items ?? []).filter(x => x !== w) : [...(form.work_items ?? []), w])}
                    className={`rounded-full px-3 py-1 text-xs ${on ? 'bg-ck-red/15 text-ck-red ring-1 ring-ck-red/30' : 'bg-ck-dark-surface text-ck-muted hover:text-white'}`}
                  >
                    {tp(`work.${w}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consent + ordering */}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-ck-muted sm:col-span-2">{t('consent')}
              <select value={form.consent_status ?? 'pending'} onChange={e => set('consent_status', e.target.value)} className={`${inputCls} mt-1`}>
                {CONSENT_STATUSES.map(c => <option key={c} value={c}>{t(`consent_${c}`)}</option>)}
              </select>
              {p.consent_document_id && <span className="mt-1 block text-[10px] text-green-400">{t('consentFromHandover')}</span>}
            </label>
            <label className="text-xs text-ck-muted">{t('sortOrder')}
              <input type="number" min={0} value={form.sort_order ?? 0} onChange={e => set('sort_order', Number(e.target.value) || 0)} className={`${inputCls} mt-1`} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-ck-muted-light">
            <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} />
            {t('featured')}
          </label>
        </section>

        <div className="space-y-5">
          {/* Publish checklist */}
          <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase text-ck-muted">{t('checklist')}</h2>
            <ul className="space-y-1.5 text-xs">
              {(Object.keys(p.checklist) as ChecklistItem[]).map(k => (
                <li key={k} className={`flex items-center gap-2 ${p.checklist[k] ? 'text-green-400' : 'text-ck-muted-light'}`}>
                  {p.checklist[k] ? <CheckCircle2 size={14} /> : <Circle size={14} />} {t(`check_${k}`)}
                </li>
              ))}
            </ul>
            {dirty && <p className="mt-3 text-[11px] text-amber-400">{t('unsaved')}</p>}
          </section>

          {/* Photos */}
          <section className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase text-ck-muted">{t('photos')}</h2>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-xs text-ck-muted-light hover:text-white">
                <Upload size={12} /> {t('upload')}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setEditor({ file: f }); e.target.value = ''; }} />
              </label>
            </div>
            <p className="mb-3 flex items-start gap-1.5 text-[11px] text-ck-muted"><ShieldCheck size={12} className="mt-0.5 shrink-0 text-amber-400" /> {t('photosPrivacy')}</p>

            {p.photos.length === 0 ? (
              <p className="text-xs italic text-ck-muted">{t('noPhotos')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {p.photos.map(ph => (
                  <div key={ph.id} className="group relative overflow-hidden rounded-lg border border-ck-dark-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.url} alt={ph.alt_nl ?? ''} className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute left-1 top-1 flex gap-1">
                      <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">{t(`phase${ph.phase.charAt(0).toUpperCase()}${ph.phase.slice(1)}`)}</span>
                      {ph.pair_group != null && <span className="rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">#{ph.pair_group}</span>}
                    </div>
                    <div className="absolute right-1 top-1 flex gap-1">
                      <button onClick={() => photoPatch(ph.id, { is_cover: true })} title={t('useAsCover')} className="rounded bg-black/70 p-1">
                        <Star size={12} className={ph.is_cover ? 'fill-amber-400 text-amber-400' : 'text-white'} />
                      </button>
                      <button onClick={() => photoDelete(ph.id)} title={t('delete')} className="rounded bg-black/70 p-1 text-white hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-green-300">
                      {t('redactedBoxes', { n: ph.redaction_regions.length })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {p.job_photos_available.length > 0 && (
              <div className="mt-4 border-t border-ck-dark-border pt-4">
                <p className="mb-2 text-xs text-ck-muted">{t('jobPhotos', { n: p.job_photos_available.length })}</p>
                <div className="grid grid-cols-3 gap-2">
                  {p.job_photos_available.map(jp => (
                    <button key={jp.id} onClick={() => setEditor({ url: jp.url, jobPhotoId: jp.id, phase: jp.phase })} className="group relative overflow-hidden rounded border border-ck-dark-border" title={t('importRedact')}>
                      {/* Internal preview only — the imported copy is redacted */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={jp.url} alt="" className="aspect-square w-full object-cover opacity-70 group-hover:opacity-100" />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-[10px] text-white">{t(`phase${jp.phase.charAt(0).toUpperCase()}${jp.phase.slice(1)}`)} · {t('importRedact')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {editor && (
        <PhotoRedactionEditor
          projectId={p.id}
          source={editor}
          defaultPairGroup={nextPair}
          onClose={() => setEditor(null)}
          onSaved={async () => { setEditor(null); await load(); }}
        />
      )}
    </div>
  );
}
