import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type SecretGroup = {
  id: string;
  name: string;
  icon: string;
  description: string;
  docsUrl: string;
  secrets: SecretEntry[];
};

type SecretEntry = {
  key: string;
  label: string;
  required: boolean;
  isSet: boolean;
  masked: string;
  scope: 'server' | 'public';
};

function mask(val: string | undefined): string {
  if (!val) return '';
  if (val.length <= 8) return '••••';
  return val.slice(0, 4) + '••••' + val.slice(-4);
}

function entry(key: string, label: string, required: boolean, scope: 'server' | 'public' = 'server'): SecretEntry {
  const val = process.env[key];
  return { key, label, required, isSet: !!val, masked: mask(val), scope };
}

export async function GET() {
  const groups: SecretGroup[] = [
    {
      id: 'supabase',
      name: 'Supabase',
      icon: '🗄️',
      description: 'Database, auth, and storage backend',
      docsUrl: 'https://supabase.com/docs',
      secrets: [
        entry('NEXT_PUBLIC_SUPABASE_URL', 'Project URL', true, 'public'),
        entry('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Anon Key', true, 'public'),
        entry('SUPABASE_SERVICE_ROLE_KEY', 'Service Role Key', true),
      ],
    },
    {
      id: 'mollie',
      name: 'Mollie',
      icon: '💳',
      description: 'Payment processing (iDEAL, credit card, bank transfer)',
      docsUrl: 'https://docs.mollie.com',
      secrets: [
        entry('MOLLIE_API_KEY', 'API Key', true),
        entry('MOLLIE_WEBHOOK_SECRET', 'Webhook Secret', false),
      ],
    },
    {
      id: 'resend',
      name: 'Resend',
      icon: '✉️',
      description: 'Transactional email delivery',
      docsUrl: 'https://resend.com/docs',
      secrets: [
        entry('RESEND_API_KEY', 'API Key', true),
        entry('RESEND_FROM_EMAIL', 'From Address', false),
      ],
    },
    {
      id: 'imap',
      name: 'IMAP (Zoho)',
      icon: '📧',
      description: 'Inbound email polling for lead capture',
      docsUrl: 'https://www.zoho.com/mail/help/imap-access.html',
      secrets: [
        entry('IMAP_HOST', 'IMAP Host', true),
        entry('IMAP_PORT', 'IMAP Port', false),
        entry('IMAP_USER', 'Username', true),
        entry('IMAP_PASS', 'Password (App Password)', true),
        entry('IMAP_POLL_SECRET', 'Poll Endpoint Secret', true),
        entry('NEXT_PUBLIC_IMAP_POLL_SECRET', 'Poll Secret (Client)', false, 'public'),
      ],
    },
    {
      id: 'google',
      name: 'Google Drive',
      icon: '💾',
      description: 'Document and photo storage',
      docsUrl: 'https://developers.google.com/drive',
      secrets: [
        entry('GOOGLE_DRIVE_CLIENT_ID', 'Client ID', true),
        entry('GOOGLE_DRIVE_CLIENT_SECRET', 'Client Secret', true),
        entry('GOOGLE_DRIVE_REFRESH_TOKEN', 'Refresh Token', true),
        entry('GOOGLE_DRIVE_FOLDER_ID', 'Root Folder ID', false),
      ],
    },
    {
      id: 'vercel',
      name: 'Vercel',
      icon: '▲',
      description: 'Hosting and deployment platform',
      docsUrl: 'https://vercel.com/docs',
      secrets: [
        entry('VERCEL', 'Vercel Environment', false),
        entry('VERCEL_ENV', 'Environment Name', false),
        entry('VERCEL_URL', 'Deployment URL', false, 'public'),
        entry('VERCEL_REGION', 'Region', false),
        entry('VERCEL_GIT_COMMIT_SHA', 'Git SHA', false),
      ],
    },
    {
      id: 'app',
      name: 'Application',
      icon: '🔧',
      description: 'App-level configuration secrets',
      docsUrl: '',
      secrets: [
        entry('NEXTAUTH_SECRET', 'Auth Secret', false),
        entry('NEXT_PUBLIC_APP_URL', 'App URL', false, 'public'),
        entry('NEXT_PUBLIC_ADMIN_URL', 'Admin URL', false, 'public'),
      ],
    },
  ];

  const summary = {
    total: groups.reduce((sum, g) => sum + g.secrets.length, 0),
    set: groups.reduce((sum, g) => sum + g.secrets.filter(s => s.isSet).length, 0),
    missing: groups.reduce((sum, g) => sum + g.secrets.filter(s => s.required && !s.isSet).length, 0),
  };

  return NextResponse.json({ groups, summary });
}

export async function POST(req: NextRequest) {
  const { action, service } = await req.json();

  if (action === 'test') {
    const results: Record<string, { ok: boolean; message: string; latencyMs?: number }> = {};

    if (service === 'supabase' || !service) {
      const start = Date.now();
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) throw new Error('Missing credentials');
        const res = await fetch(`${url}/rest/v1/`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        results.supabase = { ok: res.ok, message: res.ok ? 'Connected' : `HTTP ${res.status}`, latencyMs: Date.now() - start };
      } catch (e) {
        results.supabase = { ok: false, message: (e as Error).message, latencyMs: Date.now() - start };
      }
    }

    if (service === 'mollie' || !service) {
      const start = Date.now();
      try {
        const key = process.env.MOLLIE_API_KEY;
        if (!key) throw new Error('API key not set');
        const res = await fetch('https://api.mollie.com/v2/methods', {
          headers: { Authorization: `Bearer ${key}` },
        });
        results.mollie = { ok: res.ok, message: res.ok ? 'Connected' : `HTTP ${res.status}`, latencyMs: Date.now() - start };
      } catch (e) {
        results.mollie = { ok: false, message: (e as Error).message, latencyMs: Date.now() - start };
      }
    }

    if (service === 'resend' || !service) {
      const start = Date.now();
      try {
        const key = process.env.RESEND_API_KEY;
        if (!key) throw new Error('API key not set');
        const res = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${key}` },
        });
        results.resend = { ok: res.ok, message: res.ok ? 'Connected' : `HTTP ${res.status}`, latencyMs: Date.now() - start };
      } catch (e) {
        results.resend = { ok: false, message: (e as Error).message, latencyMs: Date.now() - start };
      }
    }

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
