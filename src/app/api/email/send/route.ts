import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SendEmailRequestSchema, TemplateDataMap } from '@/modules/email/schema';
import { renderTemplate, getSubject } from '@/modules/email/templates';
import { sendEmail } from '@/modules/email/sender';
import { logEmail } from '@/modules/email/log';
import type { EmailLocale, EmailTemplateName } from '@/modules/email/schema';

/**
 * POST /api/email/send
 * Send an email using a named template. Staff only.
 * Body: { template, to, locale, data }
 */
export async function POST(req: NextRequest) {
  // Auth check — only authenticated staff
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate staff role
  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!staff || staff.role === 'tech') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse body
  const body = await req.json();
  const parsed = SendEmailRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { template, to, locale, data } = parsed.data;

  // Validate template data against its specific schema
  const templateSchema = TemplateDataMap[template as EmailTemplateName];
  if (templateSchema) {
    const dataResult = templateSchema.safeParse(data);
    if (!dataResult.success) {
      return NextResponse.json(
        { error: 'Invalid template data', details: dataResult.error.flatten() },
        { status: 400 },
      );
    }
  }

  try {
    const html = renderTemplate(
      template as keyof typeof TemplateDataMap,
      data as TemplateDataMap[keyof TemplateDataMap],
      locale as EmailLocale,
    );
    const subject = getSubject(
      template as keyof typeof TemplateDataMap,
      data as TemplateDataMap[keyof TemplateDataMap],
      locale as EmailLocale,
    );

    const result = await sendEmail(to, subject, html);

    await logEmail({
      to,
      subject,
      template: template as EmailTemplateName,
      locale: locale as EmailLocale,
      status: result.success ? 'sent' : 'failed',
      error: result.error,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
