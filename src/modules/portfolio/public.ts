/**
 * Public portfolio reads (gallery). Uses the anon/session client — RLS only
 * exposes published, non-deleted dossiers and redaction-confirmed photos;
 * the explicit filters also keep a logged-in staff member from seeing drafts.
 */

import { createClient } from '@/lib/supabase/server';
import { PORTFOLIO_BUCKET } from './constants';

const FIELDS = `id, dossier_number, category, title_nl, title_en, title_tr, summary_nl, summary_en, summary_tr,
  build_year, colour_name, paint_code, work_items, duration_working_days, handling, featured, published_at,
  model_free_text, vehicle_brands(name), vehicle_models(name),
  portfolio_photos(id, phase, pair_group, storage_path, width, height, is_cover, sort_order, alt_nl, alt_en, alt_tr, redaction_confirmed_at)`;

type Photo = {
  id: string;
  phase: 'before' | 'during' | 'after';
  pair_group: number | null;
  storage_path: string;
  width: number | null;
  height: number | null;
  is_cover: boolean;
  sort_order: number;
  alt_nl: string | null;
  alt_en: string | null;
  alt_tr: string | null;
  redaction_confirmed_at: string | null;
};

export type PublicDossier = ReturnType<typeof shape>;

function shape(row: Record<string, unknown>, publicUrl: (p: string) => string) {
  const brand = (row.vehicle_brands as { name: string } | null)?.name ?? null;
  const model = (row.vehicle_models as { name: string } | null)?.name ?? null;
  const photos = ((row.portfolio_photos as Photo[] | null) ?? [])
    .filter(p => p.redaction_confirmed_at)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ redaction_confirmed_at: _r, storage_path, ...p }) => ({ ...p, url: publicUrl(storage_path) }));
  const cover = photos.find(p => p.is_cover) ?? photos.find(p => p.phase === 'after') ?? photos[0] ?? null;
  const { vehicle_brands: _b, vehicle_models: _m, portfolio_photos: _p, model_free_text, ...rest } = row;
  return {
    ...(rest as {
      id: string; dossier_number: string; category: string;
      title_nl: string; title_en: string | null; title_tr: string | null;
      summary_nl: string | null; summary_en: string | null; summary_tr: string | null;
      build_year: number | null; colour_name: string | null; paint_code: string | null;
      work_items: string[]; duration_working_days: number | null; handling: string | null;
      featured: boolean; published_at: string | null;
    }),
    vehicle: [brand, model ?? (model_free_text as string | null)].filter(Boolean).join(' ') || null,
    photos,
    cover,
  };
}

export async function listPublishedDossiers() {
  const db = createClient();
  const { data, error } = await db
    .from('portfolio_projects')
    .select(FIELDS)
    .eq('status', 'published')
    .is('deleted_at', null)
    .not('dossier_number', 'is', null)
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false });
  if (error) throw error;
  const url = (p: string) => db.storage.from(PORTFOLIO_BUCKET).getPublicUrl(p).data.publicUrl;
  return (data ?? []).map(r => shape(r as Record<string, unknown>, url));
}

export async function getPublishedDossier(dossierNumber: string) {
  const db = createClient();
  const { data, error } = await db
    .from('portfolio_projects')
    .select(FIELDS)
    .eq('dossier_number', dossierNumber.toUpperCase())
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const url = (p: string) => db.storage.from(PORTFOLIO_BUCKET).getPublicUrl(p).data.publicUrl;
  return shape(data as Record<string, unknown>, url);
}
