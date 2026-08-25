import { NextRequest, NextResponse } from 'next/server';
import { getTask } from '@/modules/tasks/queries';
import { updateTask, deleteTask, changeTaskStatus, assignTask } from '@/modules/tasks/actions';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await getTask(params.id);
    return NextResponse.json(task);
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

    if (body.action === 'change_status') {
      const task = await changeTaskStatus(params.id, body.status, body.blocked_reason);
      return NextResponse.json(task);
    }

    if (body.action === 'assign') {
      const task = await assignTask(params.id, body.assigned_to);
      return NextResponse.json(task);
    }

    const task = await updateTask(params.id, body);
    return NextResponse.json(task);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg.includes('Cannot transition') || msg.includes('Only tasks') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteTask(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
