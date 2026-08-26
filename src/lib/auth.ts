'use client';

import { supabase, USING_MOCK } from './supabase/client';

export type Role = 'admin' | 'office' | 'tech';

export type Session = {
  id: string;
  email: string;
  name: string;
  role: Role;
} | null;

export const PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  office: [
    'leads.*',
    'customers.*',
    'vehicles.*',
    'jobs.*',
    'offers.*',
    'parts.*',
    'invoices.*',
    'documents.*',
    'appointments.*',
    'tasks.*',
    'vat.read',
    'purchases.*',
    'bookkeeping.read',
  ],
  tech: [
    'jobs.read',
    'jobs.stage',
    'photos.write',
    'tasks.own',
    'parts.read',
    'documents.sign',
  ],
};

export function can(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const [mod] = permission.split('.');
  return perms.includes(`${mod}.*`);
}

/** Mock session returned when Supabase is not configured */
const MOCK_SESSION = {
  id: 'mock-admin',
  email: 'admin@colourking.nl',
  name: 'Admin (dev)',
  role: 'admin' as Role,
};

export async function getSession(): Promise<Session> {
  // When no Supabase client is available, return mock admin
  if (USING_MOCK || !supabase) {
    return MOCK_SESSION;
  }

  const { data } = await supabase.auth.getSession();

  // Dev bypass: when Supabase is configured but no user is logged in,
  // return a dev admin in development mode
  if (!data.session?.user) {
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 'dev-admin',
        email: MOCK_SESSION.email,
        name: MOCK_SESSION.name,
        role: MOCK_SESSION.role,
      };
    }
    return null;
  }

  const user = data.session.user;

  // Fetch the staff record from the API
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const staff = await res.json();
      return {
        id: user.id,
        email: staff.email,
        name: staff.name,
        role: staff.role as Role,
      };
    }
  } catch {
    // fall through
  }

  return null;
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error?: string }> {
  if (USING_MOCK || !supabase) return {};

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  if (!data.user) return { error: 'Authentication failed' };

  // Verify staff record server-side (bypasses RLS)
  try {
    const res = await fetch('/api/auth/verify-staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: data.user.id }),
    });
    const staff = await res.json();

    if (!staff.exists) {
      await supabase.auth.signOut();
      return { error: 'NO_STAFF_RECORD' };
    }

    if (!staff.active) {
      await supabase.auth.signOut();
      return { error: 'ACCOUNT_DEACTIVATED' };
    }
  } catch {
    await supabase.auth.signOut();
    return { error: 'NO_STAFF_RECORD' };
  }

  return {};
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  window.location.href = '/login';
}
