import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  const [ongoingRes, scheduledRes] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, number, stage, notes, created_at, updated_at, customers(id, name), vehicles(id, kenteken, make, model, colour)')
      .in('stage', ['checked_in', 'in_progress', 'qc'])
      .order('updated_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('id, number, stage, notes, created_at, updated_at, customers(id, name), vehicles(id, kenteken, make, model, colour)')
      .eq('stage', 'scheduled')
      .order('updated_at', { ascending: true }),
  ]);

  return NextResponse.json({
    ongoing: ongoingRes.data ?? [],
    scheduled: scheduledRes.data ?? [],
  });
}
