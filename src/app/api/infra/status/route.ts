import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ServiceStatus = {
  name: string;
  key: string;
  status: 'connected' | 'configured' | 'missing';
  details: Record<string, string>;
};

function mask(val: string | undefined): string {
  if (!val) return '';
  if (val.length <= 8) return '••••';
  return val.slice(0, 4) + '••••' + val.slice(-4);
}

export async function GET() {
  const services: ServiceStatus[] = [];

  // Supabase
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sbService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  services.push({
    name: 'Supabase',
    key: 'supabase',
    status: sbUrl && sbAnon ? 'connected' : 'missing',
    details: {
      url: sbUrl || '',
      anonKey: mask(sbAnon),
      serviceRole: sbService ? mask(sbService) : 'Not set',
      region: sbUrl?.includes('supabase.co') ? 'eu-west-1' : 'unknown',
    },
  });

  // IMAP / Zoho
  const imapHost = process.env.IMAP_HOST;
  const imapUser = process.env.IMAP_USER;
  const imapPass = process.env.IMAP_PASS;
  services.push({
    name: 'IMAP (Zoho)',
    key: 'imap',
    status: imapHost && imapUser && imapPass ? 'configured' : 'missing',
    details: {
      host: imapHost || 'Not set',
      port: process.env.IMAP_PORT || '993',
      user: imapUser || 'Not set',
      password: imapPass ? '••••••••' : 'Not set',
    },
  });

  // Google Drive
  const driveId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const driveSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const driveRefresh = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  services.push({
    name: 'Google Drive',
    key: 'drive',
    status: driveId && driveSecret && driveRefresh ? 'configured' : 'missing',
    details: {
      clientId: mask(driveId),
      clientSecret: driveSecret ? '••••••••' : 'Not set',
      refreshToken: driveRefresh ? '••••••••' : 'Not set',
      folderId: driveFolderId || 'Not set',
    },
  });

  // Mollie
  const mollieKey = process.env.MOLLIE_API_KEY;
  services.push({
    name: 'Mollie (Payments)',
    key: 'mollie',
    status: mollieKey ? 'configured' : 'missing',
    details: {
      apiKey: mask(mollieKey),
    },
  });

  // Resend
  const resendKey = process.env.RESEND_API_KEY;
  services.push({
    name: 'Resend (Email)',
    key: 'resend',
    status: resendKey ? 'configured' : 'missing',
    details: {
      apiKey: mask(resendKey),
    },
  });

  // RDW
  services.push({
    name: 'RDW (Vehicle Registry)',
    key: 'rdw',
    status: 'connected',
    details: {
      endpoint: 'opendata.rdw.nl',
      auth: 'Public API (no key needed)',
    },
  });

  // Platform info
  const platform = {
    framework: 'Next.js 14 (App Router)',
    runtime: `Node ${process.version}`,
    platform: process.env.VERCEL ? 'Vercel' : 'Local',
    region: process.env.VERCEL_REGION || 'local',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    domain: process.env.VERCEL_URL || 'localhost:3000',
  };

  return NextResponse.json({ services, platform });
}
