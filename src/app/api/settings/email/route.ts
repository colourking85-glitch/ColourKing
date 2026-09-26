import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/supabase/admin';
import { getStaffUser } from '@/lib/supabase/staff';
import { getEmailIdentities, invalidateIdentityCache } from '@/lib/email-identity';
import { EmailIdentitiesSchema, ReminderSettingsSchema } from '@/modules/email/schema';
import { getReminderSettings } from '@/modules/reminders/run';

export const dynamic = 'force-dynamic';

export async function GET() {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [identities, reminders] = await Promise.all([getEmailIdentities(), getReminderSettings()]);
  return NextResponse.json({ identities, reminders });
}

export async function PUT(req: NextRequest) {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (staff.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const rows: Array<{ key: string; value: unknown }> = [];

  if (body.identities !== undefined) {
    const parsed = EmailIdentitiesSchema.safeParse(body.identities);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid identities', details: parsed.error.flatten() }, { status: 400 });
    rows.push({ key: 'email_identities', value: parsed.data });
  }
  if (body.reminders !== undefined) {
    const parsed = ReminderSettingsSchema.safeParse(body.reminders);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid reminders', details: parsed.error.flatten() }, { status: 400 });
    rows.push({ key: 'reminders', value: parsed.data });
  }
  if (!rows.length) return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });

  const { error } = await admin.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateIdentityCache();
  return NextResponse.json({ success: true });
}
