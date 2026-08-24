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

const DEV_BYPASS = process.env.NODE_ENV === 'development';

export async function getSession(): Promise<Session> {
  if (USING_MOCK || !supabase) {
    return {
      id: 'mock-admin',
      email: 'admin@colourking.nl',
      name: 'Admin (dev)',
      role: 'admin',
    };
  }

  if (DEV_BYPASS) {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      return {
        id: 'dev-admin',
        email: 'admin@colourking.nl',
        name: 'Admin (dev)',
        role: 'admin',
      };
    }
  }

  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const user = data.session.user;

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

  return {
    id: user.id,
    email: user.email ?? '',
    name: '',
    role: 'tech',
  };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error?: string }> {
  if (USING_MOCK || !supabase) return {};
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { error: error.message } : {};
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}
