import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const entityType = req.nextUrl.searchParams.get('entity_type');
  const entityId = req.nextUrl.searchParams.get('entity_id');

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entity_type and entity_id required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('internal_notes')
    .select('id, entity_type, entity_id, author_id, body, created_at')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { entity_type, entity_id, body: noteBody } = body;

  if (!entity_type || !entity_id || !noteBody?.trim()) {
    return NextResponse.json({ error: 'entity_type, entity_id, and body required' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const authorId = user?.id ?? null;

  const { data, error } = await supabase
    .from('internal_notes')
    .insert({
      entity_type,
      entity_id,
      author_id: authorId,
      body: noteBody.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
