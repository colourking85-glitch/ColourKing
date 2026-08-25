import { NextRequest, NextResponse } from 'next/server';
import { getDocument, getDocumentChain } from '@/modules/documents/queries';
import { issueDocument, cancelDocument, deleteDocument, updateDocumentPayload } from '@/modules/documents/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await getDocument(params.id);
    const chain = await getDocumentChain(params.id);
    return NextResponse.json({ ...doc, chain });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    if (body.action === 'issue') {
      const doc = await issueDocument({ id: params.id, payload: body.payload });
      return NextResponse.json(doc);
    }

    if (body.action === 'cancel') {
      const doc = await cancelDocument({ id: params.id, cancel_reason: body.cancel_reason });
      return NextResponse.json(doc);
    }

    if (body.payload) {
      const doc = await updateDocumentPayload(params.id, body.payload);
      return NextResponse.json(doc);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Only draft') || msg.includes('cannot be') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteDocument(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
