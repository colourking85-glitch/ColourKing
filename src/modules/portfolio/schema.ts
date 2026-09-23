import { z } from 'zod';
import { PORTFOLIO_CATEGORIES, PORTFOLIO_HANDLINGS, CONSENT_STATUSES, WORK_ITEMS } from './constants';

const optText = z.string().trim().max(2000).nullable().optional();

/** Editable dossier fields (PF01 create / PF10 edit). Status and numbers are set by actions only. */
export const PortfolioProjectInput = z.object({
  category: z.enum(PORTFOLIO_CATEGORIES).optional(),
  title_nl: z.string().trim().max(200).optional(),
  title_en: optText,
  title_tr: optText,
  summary_nl: optText,
  summary_en: optText,
  summary_tr: optText,
  brand_id: z.string().uuid().nullable().optional(),
  model_id: z.string().uuid().nullable().optional(),
  model_free_text: z.string().trim().max(120).nullable().optional(),
  build_year: z.number().int().min(1900).max(2100).nullable().optional(),
  colour_name: z.string().trim().max(80).nullable().optional(),
  paint_code: z.string().trim().max(40).nullable().optional(),
  work_items: z.array(z.enum(WORK_ITEMS)).max(WORK_ITEMS.length).optional(),
  duration_working_days: z.number().int().min(0).max(365).nullable().optional(),
  handling: z.enum(PORTFOLIO_HANDLINGS).nullable().optional(),
  consent_status: z.enum(CONSENT_STATUSES).optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(100000).optional(),
});
export type PortfolioProjectInput = z.infer<typeof PortfolioProjectInput>;

export const RedactionRegion = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
  source: z.enum(['ai', 'manual']).default('manual'),
});
export type RedactionRegion = z.infer<typeof RedactionRegion>;

export const PortfolioPhotoMeta = z.object({
  phase: z.enum(['before', 'during', 'after']),
  pair_group: z.number().int().min(0).max(1000).nullable().optional(),
  is_cover: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(1000).optional(),
  alt_nl: z.string().trim().max(200).nullable().optional(),
  alt_en: z.string().trim().max(200).nullable().optional(),
  alt_tr: z.string().trim().max(200).nullable().optional(),
});
export type PortfolioPhotoMeta = z.infer<typeof PortfolioPhotoMeta>;
