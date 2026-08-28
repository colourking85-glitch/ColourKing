import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getInspections } from '@/modules/inspectie/queries';
import { InspectionSchema } from '@/modules/inspectie/schema';
import type { InsStatus } from '@/modules/inspectie/machine';

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') as InsStatus | null;
  const search = req.nextUrl.searchParams.get('search');
  const vehicle_id = req.nextUrl.searchParams.get('vehicle_id');
  const customer_id = req.nextUrl.searchParams.get('customer_id');

  try {
    const data = await getInspections({
      status: status || undefined,
      search: search || undefined,
      vehicle_id: vehicle_id || undefined,
      customer_id: customer_id || undefined,
    });
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const data = InspectionSchema.parse(body);

    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v != null)
    );

    const { data: inspection, error } = await supabase
      .from('ins_inspections')
      .insert({
        ...clean,
        status: 'CONCEPT',
        inspector_id: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(inspection, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message === 'Not authenticated' ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
