import { NextRequest, NextResponse } from 'next/server';
import { getStaffUser } from '@/lib/supabase/staff';

/**
 * Cron routes accept the Vercel cron bearer (CRON_SECRET) or a signed-in
 * admin (for "run now" buttons). Fails closed when CRON_SECRET is unset.
 */
export async function requireCronOrAdmin(req: NextRequest): Promise<{ staffId: string | null } | NextResponse> {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  if (secret && auth === `Bearer ${secret}`) return { staffId: null };

  const staff = await getStaffUser();
  if (staff?.role === 'admin') return { staffId: staff.id };

  if (!secret && !staff) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
