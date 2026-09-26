import { admin } from '@/lib/supabase/admin';

/** A company-wide off day range (blackout without resource, all day). */
export type Closure = {
  id: string;
  title: string;
  kind: string;
  reason: string | null;
  start_date: string;
  end_date: string;
};

const SELECT = 'id, title, kind, reason, start_date, end_date';

export async function getClosures(from: string, to: string): Promise<Closure[]> {
  const { data } = await admin
    .from('blackouts')
    .select(SELECT)
    .is('resource_id', null)
    .eq('all_day', true)
    .lte('start_date', to)
    .gte('end_date', from)
    .order('start_date');
  return (data ?? []) as Closure[];
}

/** The closure covering `date` (YYYY-MM-DD), or null when the company is open. */
export async function findClosure(date: string): Promise<Closure | null> {
  const { data } = await admin
    .from('blackouts')
    .select(SELECT)
    .is('resource_id', null)
    .eq('all_day', true)
    .lte('start_date', date)
    .gte('end_date', date)
    .order('start_date')
    .limit(1)
    .maybeSingle();
  return (data as Closure | null) ?? null;
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** First date after `date` that has opening hours and no company-wide closure (looks 60 days ahead). */
export async function nextOpenDay(date: string): Promise<string | null> {
  const [{ data: hours }, closures] = await Promise.all([
    admin.from('opening_hours').select('day_of_week'),
    getClosures(date, addDays(date, 60)),
  ]);
  const openDows = new Set((hours ?? []).map((h) => h.day_of_week));
  for (let i = 1; i <= 60; i++) {
    const d = addDays(date, i);
    const jsDay = new Date(`${d}T12:00:00Z`).getUTCDay();
    const dow = jsDay === 0 ? 6 : jsDay - 1;
    if (!openDows.has(dow)) continue;
    if (closures.some((c) => c.start_date <= d && c.end_date >= d)) continue;
    return d;
  }
  return null;
}
