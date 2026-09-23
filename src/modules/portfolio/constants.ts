/**
 * Project portfolio (PF) — shared constants and pure helpers.
 * Safe to import from client and server code.
 */

export const PORTFOLIO_CATEGORIES = ['bodywork', 'paint', 'spot_repair'] as const;
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO_HANDLINGS = ['insurance', 'private', 'lease', 'fleet'] as const;
export type PortfolioHandling = (typeof PORTFOLIO_HANDLINGS)[number];

export const PORTFOLIO_STATUSES = ['draft', 'published', 'archived'] as const;
export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number];

export const CONSENT_STATUSES = ['received', 'not_required', 'pending'] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

/** Work item keys; labels live in messages under portfolio.work.* */
export const WORK_ITEMS = [
  'dent_repair',
  'pdr',
  'panel_replacement',
  'straightening_bench',
  'bumper_repair',
  'scratch_repair',
  'spot_repair',
  'partial_respray',
  'full_respray',
  'polishing',
  'rust_repair',
  'glass',
  'sensor_calibration',
] as const;
export type WorkItem = (typeof WORK_ITEMS)[number];

export const PORTFOLIO_BUCKET = 'portfolio-public';

/** jobs.job_type → portfolio category */
export function categoryFromJobType(jobType: string | null | undefined): PortfolioCategory {
  if (jobType === 'paint') return 'paint';
  return 'bodywork';
}

/** jobs.payer_type → handling */
export function handlingFromPayerType(payer: string | null | undefined): PortfolioHandling | null {
  switch (payer) {
    case 'casco':
    case 'wa':
      return 'insurance';
    case 'particulier':
      return 'private';
    case 'lease':
      return 'lease';
    default:
      return null;
  }
}

const WORK_ITEM_KEYWORDS: [WorkItem, RegExp][] = [
  ['pdr', /\bpdr\b|uitdeuk(en)? zonder|paintless/i],
  ['dent_repair', /deuk|dent/i],
  ['straightening_bench', /richtbank|richten|straighten/i],
  ['bumper_repair', /bumper/i],
  ['panel_replacement', /vervang|replace|nieuw (panel|paneel|scherm)/i],
  ['scratch_repair', /kras|scratch/i],
  ['spot_repair', /spot/i],
  ['full_respray', /volledig (over)?spuiten|full respray|complete respray/i],
  // Specific jobs before the generic paint keywords ("lak polijsten" is polishing)
  ['polishing', /polijst|polish/i],
  ['rust_repair', /roest|rust/i],
  ['glass', /ruit|glass|windscreen|voorruit/i],
  ['sensor_calibration', /kalibr|calibrat|adas|sensor/i],
  ['partial_respray', /spuit|lak|paint|respray/i],
];

/** Suggest work items from offer line descriptions (deduplicated, stable order). */
export function workItemsFromDescriptions(descriptions: string[]): WorkItem[] {
  const found = new Set<WorkItem>();
  for (const d of descriptions) {
    for (const [item, re] of WORK_ITEM_KEYWORDS) {
      if (re.test(d)) {
        found.add(item);
        break;
      }
    }
  }
  if (found.has('full_respray')) found.delete('partial_respray');
  return WORK_ITEMS.filter(i => found.has(i));
}

/**
 * Working days (Mon–Fri) from start to end, both inclusive, minimum 1.
 * Dates are compared by calendar day in UTC.
 */
export function workingDaysBetween(start: string | Date, end: string | Date): number {
  const a = new Date(start);
  const b = new Date(end);
  const from = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const to = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  if (to < from) return 1;
  let days = 0;
  for (let t = from; t <= to; t += 86400000) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) days++;
  }
  return Math.max(1, days);
}

const CATEGORY_TITLE: Record<'nl' | 'en' | 'tr', Record<PortfolioCategory, string>> = {
  nl: { bodywork: 'Schadeherstel', paint: 'Spuitwerk', spot_repair: 'Spot repair' },
  en: { bodywork: 'Body repair', paint: 'Paint work', spot_repair: 'Spot repair' },
  tr: { bodywork: 'Kaporta onarimi', paint: 'Boya isi', spot_repair: 'Spot onarim' },
};

/** Default titles for a converted work order, e.g. "Schadeherstel BMW 3 Serie". */
export function suggestTitles(category: PortfolioCategory, vehicle: string): { nl: string; en: string; tr: string } {
  const v = vehicle.trim();
  const make = (lang: 'nl' | 'en' | 'tr') => `${CATEGORY_TITLE[lang][category]}${v ? ` ${v}` : ''}`;
  return { nl: make('nl'), en: make('en'), tr: make('tr') };
}

export type ChecklistInput = {
  title_nl: string | null;
  category: string | null;
  brand_id: string | null;
  model_free_text: string | null;
  consent_status: string;
  photos: { phase: string; redaction_confirmed_at: string | null }[];
};

export type ChecklistItem = 'title' | 'category' | 'vehicle' | 'beforeAfter' | 'redaction' | 'consent';

/** Publish gate — every item must pass before a dossier can go public. */
export function publishChecklist(p: ChecklistInput): Record<ChecklistItem, boolean> {
  const phases = new Set(p.photos.map(ph => ph.phase));
  return {
    title: !!p.title_nl?.trim(),
    category: !!p.category,
    vehicle: !!p.brand_id || !!p.model_free_text?.trim(),
    beforeAfter: phases.has('before') && phases.has('after'),
    redaction: p.photos.length > 0 && p.photos.every(ph => !!ph.redaction_confirmed_at),
    consent: p.consent_status === 'received' || p.consent_status === 'not_required',
  };
}

export function canPublish(p: ChecklistInput): boolean {
  return Object.values(publishChecklist(p)).every(Boolean);
}

/** Public dossier number, e.g. CK-263901 (prefix + YY + ISO week + NN). */
export const DOSSIER_NUMBER_RE = /^[A-Z]{2,4}-\d{6,7}$/i;

/** ISO-8601 year and week of a date (UTC calendar day). */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday of this week decides the year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { year: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7) };
}

/** Number shape for a given week, e.g. dossierNumber('CK', date, 1) → "CK-263901". */
export function dossierNumber(prefix: string, date: Date, seq: number): string {
  const { year, week } = isoWeek(date);
  return `${prefix}-${String(year % 100).padStart(2, '0')}${String(week).padStart(2, '0')}${String(seq).padStart(2, '0')}`;
}
