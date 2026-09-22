import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  const [ongoingRes, scheduledRes, leadsRes] = await Promise.all([
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
    supabase
      .from('leads')
      .select('id, number, contact_name, kenteken, status, origin, created_at')
      .is('deleted_at', null)
      .in('status', ['new', 'contacted'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    ongoing: ongoingRes.data ?? [],
    scheduled: scheduledRes.data ?? [],
    leads: leadsRes.data ?? [],
  });
}
