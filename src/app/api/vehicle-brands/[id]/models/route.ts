import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { admin } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await admin
    .from('vehicle_models')
    .select('id, name, sort_order')
    .eq('brand_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sorted = (data ?? []).sort((a, b) => {
    const aHas = a.sort_order > 0 ? 1 : 0;
    const bHas = b.sort_order > 0 ? 1 : 0;
    if (aHas !== bHas) return bHas - aHas;
    if (aHas && bHas) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json(sorted);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('vehicle_models')
    .insert({
      brand_id: params.id,
      name: name.trim(),
      sort_order: 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Model already exists for this brand' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
