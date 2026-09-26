import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';

export const dynamic = 'force-dynamic';

/** Last reminder run (written by runReminders) — lets SY15 prove the scheduler is calling the job. */
export async function GET() {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await admin.from('settings').select('value').eq('key', 'reminders_state').maybeSingle();
  return NextResponse.json(data?.value ?? null);
}
