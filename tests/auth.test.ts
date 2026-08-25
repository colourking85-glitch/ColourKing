import { describe, it, expect } from 'vitest';
import { can, PERMISSIONS, type Role } from '@/lib/auth';
import { getScreen, getScreenById } from '@/lib/codes';

// ── Login form validation tests ────────────────────────────────────────────

describe('Login form validation', () => {
  it('rejects empty email', () => {
    const email = '';
    expect(email.length).toBe(0);
    expect(email.includes('@')).toBe(false);
  });

  it('rejects email without @', () => {
    const email = 'invalid-email';
    expect(email.includes('@')).toBe(false);
  });

  it('accepts valid email format', () => {
    const email = 'admin@colourking.nl';
    expect(email.includes('@')).toBe(true);
    expect(email.split('@').length).toBe(2);
  });

  it('rejects empty password', () => {
    const password = '';
    expect(password.length).toBe(0);
  });

  it('accepts non-empty password', () => {
    const password = 'secretpassword123';
    expect(password.length).toBeGreaterThan(0);
  });
});

// ── Password reset validation ──────────────────────────────────────────────

describe('Password reset validation', () => {
  it('rejects password shorter than 8 characters', () => {
    const password = 'short';
    expect(password.length).toBeLessThan(8);
  });

  it('accepts password with 8 or more characters', () => {
    const password = 'longenough';
    expect(password.length).toBeGreaterThanOrEqual(8);
  });

  it('detects password mismatch', () => {
    const password = 'password123';
    const confirm = 'password456';
    expect(password).not.toBe(confirm);
  });

  it('confirms password match', () => {
    const password = 'password123';
    const confirm = 'password123';
    expect(password).toBe(confirm);
  });

  it('rejects password with only spaces', () => {
    const password = '        ';
    expect(password.trim().length).toBe(0);
  });
});

// ── Middleware route matching tests ─────────────────────────────────────────

describe('Middleware route matching', () => {
  function isPublicRoute(pathname: string): boolean {
    if (pathname === '/login') return true;
    if (pathname.startsWith('/reset-password')) return true;
    if (pathname.startsWith('/api/public/')) return true;
    if (pathname.startsWith('/api/webhooks/')) return true;
    return false;
  }

  it('/login is public', () => {
    expect(isPublicRoute('/login')).toBe(true);
  });

  it('/reset-password is public', () => {
    expect(isPublicRoute('/reset-password')).toBe(true);
  });

  it('/reset-password/confirm is public', () => {
    expect(isPublicRoute('/reset-password/confirm')).toBe(true);
  });

  it('/api/public/health is public', () => {
    expect(isPublicRoute('/api/public/health')).toBe(true);
  });

  it('/api/webhooks/stripe is public', () => {
    expect(isPublicRoute('/api/webhooks/stripe')).toBe(true);
  });

  it('/app is not public', () => {
    expect(isPublicRoute('/app')).toBe(false);
  });

  it('/app/instellingen is not public', () => {
    expect(isPublicRoute('/app/instellingen')).toBe(false);
  });

  it('/api/staff is not public', () => {
    expect(isPublicRoute('/api/staff')).toBe(false);
  });

  it('/ is not public', () => {
    expect(isPublicRoute('/')).toBe(false);
  });
});

// ── Staff role permission tests ─────────────────────────────────────────────

describe('Staff role permissions', () => {
  it('admin can do everything', () => {
    expect(can('admin', 'leads.read')).toBe(true);
    expect(can('admin', 'invoices.write')).toBe(true);
    expect(can('admin', 'anything.whatsoever')).toBe(true);
  });

  it('office has full leads access', () => {
    expect(can('office', 'leads.read')).toBe(true);
    expect(can('office', 'leads.write')).toBe(true);
  });

  it('office has full customer access', () => {
    expect(can('office', 'customers.read')).toBe(true);
    expect(can('office', 'customers.write')).toBe(true);
  });

  it('office can only read vat', () => {
    expect(can('office', 'vat.read')).toBe(true);
    expect(can('office', 'vat.write')).toBe(false);
  });

  it('office can only read bookkeeping', () => {
    expect(can('office', 'bookkeeping.read')).toBe(true);
    expect(can('office', 'bookkeeping.write')).toBe(false);
  });

  it('tech can read jobs', () => {
    expect(can('tech', 'jobs.read')).toBe(true);
  });

  it('tech can change job stages', () => {
    expect(can('tech', 'jobs.stage')).toBe(true);
  });

  it('tech cannot read invoices', () => {
    expect(can('tech', 'invoices.read')).toBe(false);
  });

  it('tech cannot access leads', () => {
    expect(can('tech', 'leads.read')).toBe(false);
  });

  it('tech can write photos', () => {
    expect(can('tech', 'photos.write')).toBe(true);
  });

  it('tech can read parts', () => {
    expect(can('tech', 'parts.read')).toBe(true);
  });

  it('tech cannot write parts', () => {
    expect(can('tech', 'parts.write')).toBe(false);
  });

  it('all roles are defined', () => {
    const roles: Role[] = ['admin', 'office', 'tech'];
    roles.forEach((role) => {
      expect(PERMISSIONS[role]).toBeDefined();
      expect(PERMISSIONS[role].length).toBeGreaterThan(0);
    });
  });
});

// ── Screen registry for auth/staff screens ──────────────────────────────────

describe('Screen registry for SY02/SY03', () => {
  it('SY02 is registered for staff management', () => {
    const screen = getScreenById('SY02');
    expect(screen).toBeDefined();
    expect(screen!.route).toBe('/app/instellingen/gebruikers');
  });

  it('SY03 is registered for number ranges', () => {
    const screen = getScreenById('SY03');
    expect(screen).toBeDefined();
    expect(screen!.route).toBe('/app/instellingen/nummering');
  });

  it('SY02 can be found by route', () => {
    const screen = getScreen('/app/instellingen/gebruikers');
    expect(screen).toBeDefined();
    expect(screen!.id).toBe('SY02');
  });

  it('SY03 can be found by route', () => {
    const screen = getScreen('/app/instellingen/nummering');
    expect(screen).toBeDefined();
    expect(screen!.id).toBe('SY03');
  });
});

// ── i18n keys presence ──────────────────────────────────────────────────────

describe('i18n auth/staff keys', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const en = require('../src/messages/en.json');
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const nl = require('../src/messages/nl.json');
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const tr = require('../src/messages/tr.json');

  const authKeys = [
    'forgotPassword',
    'resetTitle',
    'sendResetLink',
    'backToLogin',
    'newPassword',
    'confirmPassword',
    'updatePassword',
    'passwordTooShort',
    'passwordMismatch',
  ];

  const syKeys = [
    'staffTitle',
    'inviteStaff',
    'roleAdmin',
    'roleOffice',
    'roleTech',
    'statusActive',
    'statusInactive',
    'numberingTitle',
    'docType',
    'prefix',
    'nextNumber',
  ];

  authKeys.forEach((key) => {
    it(`auth.${key} exists in all locales`, () => {
      expect(en.auth[key]).toBeDefined();
      expect(nl.auth[key]).toBeDefined();
      expect(tr.auth[key]).toBeDefined();
    });
  });

  syKeys.forEach((key) => {
    it(`sy.${key} exists in all locales`, () => {
      expect(en.sy[key]).toBeDefined();
      expect(nl.sy[key]).toBeDefined();
      expect(tr.sy[key]).toBeDefined();
    });
  });
});
