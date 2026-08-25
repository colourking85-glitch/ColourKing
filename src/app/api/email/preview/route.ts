import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailTemplateName, EmailLocale } from '@/modules/email/schema';
import { renderTemplate, getSampleData } from '@/modules/email/templates';
import type { TemplateDataMap } from '@/modules/email/schema';

/**
 * GET /api/email/preview?template=invoiceSent&locale=nl
 * Preview a template with sample data. Staff only.
 * Returns rendered HTML.
 */
export async function GET(req: NextRequest) {
  // Auth check — only authenticated staff
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const templateParam = url.searchParams.get('template');
  const localeParam = url.searchParams.get('locale') ?? 'nl';

  // Validate template name
  const templateResult = EmailTemplateName.safeParse(templateParam);
  if (!templateResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid template name',
        validTemplates: EmailTemplateName.options,
      },
      { status: 400 },
    );
  }

  // Validate locale
  const localeResult = EmailLocale.safeParse(localeParam);
  if (!localeResult.success) {
    return NextResponse.json(
      { error: 'Invalid locale', validLocales: EmailLocale.options },
      { status: 400 },
    );
  }

  const template = templateResult.data;
  const locale = localeResult.data;
  const sampleData = getSampleData(template);

  try {
    const html = renderTemplate(
      template as keyof TemplateDataMap,
      sampleData as TemplateDataMap[keyof TemplateDataMap],
      locale,
    );

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
