import { NextRequest, NextResponse } from 'next/server';
import { getDocuments } from '@/modules/documents/queries';
import { createDocument } from '@/modules/documents/actions';
import type { DocType, DocStatus } from '@/types/database';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const data = await getDocuments({
      doc_type: sp.get('type') as DocType | undefined,
      status: sp.get('status') as DocStatus | undefined,
      customer_id: sp.get('customer_id') ?? undefined,
      job_id: sp.get('job_id') ?? undefined,
      search: sp.get('search') ?? undefined,
      year: sp.get('year') ? Number(sp.get('year')) : undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const doc = await createDocument(body);
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('parse') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
