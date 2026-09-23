/** Pure display helpers for public portfolio pages. */

type Localized = Record<string, unknown>;

/** Field in the page language, falling back to Dutch. */
export function localized(row: Localized, field: 'title' | 'summary', locale: string): string {
  const v = row[`${field}_${locale}`];
  if (typeof v === 'string' && v.trim()) return v;
  const nl = row[`${field}_nl`];
  return typeof nl === 'string' ? nl : '';
}

type PairPhoto = { phase: string; pair_group: number | null; url: string };

/**
 * Before/after pairs for the slider: photos sharing a pair_group, else the
 * first before + first after.
 */
export function beforeAfterPairs<T extends PairPhoto>(photos: T[]): { before: T; after: T }[] {
  const groups = new Map<number, { before?: T; after?: T }>();
  for (const p of photos) {
    if (p.pair_group == null || (p.phase !== 'before' && p.phase !== 'after')) continue;
    const g = groups.get(p.pair_group) ?? {};
    if (!g[p.phase]) g[p.phase] = p;
    groups.set(p.pair_group, g);
  }
  const pairs = Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([, g]) => g)
    .filter((g): g is { before: T; after: T } => !!g.before && !!g.after);
  if (pairs.length) return pairs;
  const before = photos.find(p => p.phase === 'before');
  const after = photos.find(p => p.phase === 'after');
  return before && after ? [{ before, after }] : [];
}

/** Public filter tab keys (existing gallery messages) ↔ DB categories. */
export const PUBLIC_FILTER: Record<string, 'bodyRepair' | 'paint' | 'spotRepair'> = {
  bodywork: 'bodyRepair',
  paint: 'paint',
  spot_repair: 'spotRepair',
};
