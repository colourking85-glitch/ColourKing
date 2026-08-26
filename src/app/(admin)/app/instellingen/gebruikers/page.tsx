'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { supabase } from '@/lib/supabase/client';

type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'office' | 'tech';
  active: boolean;
  created_at: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  );
}

const ROLES = ['admin', 'office', 'tech'] as const;

const ROLE_DESC_KEYS: Record<string, string> = {
  admin: 'roleAdminDesc',
  office: 'roleOfficeDesc',
  tech: 'roleTechDesc',
};

export default function StaffManagementPage() {
  const t = useTranslations('sy');
  const tCommon = useTranslations('common');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // New user form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<string>('office');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setCurrentUserId(data.user.id);
      });
    }
  }, []);

  async function loadStaff() {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreateLoading(true);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword || undefined,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('inviteFailed'));
        setCreateLoading(false);
        return;
      }

      setSuccess(t('inviteSent'));
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('office');
      await loadStaff();
    } catch {
      setError(t('inviteFailed'));
    } finally {
      setCreateLoading(false);
    }
  }

  async function changeRole(member: StaffMember, newRoleVal: string) {
    try {
      await fetch(`/api/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRoleVal }),
      });
      await loadStaff();
    } catch {
      // ignore
    }
  }

  async function handleResetPassword(member: StaffMember) {
    setActionLoading(member.id);
    setError('');
    try {
      const res = await fetch(`/api/staff/${member.id}/reset-password`, {
        method: 'POST',
      });
      if (res.ok) {
        setSuccess(t('resetSent', { email: member.email }));
      } else {
        const data = await res.json();
        setError(data.error || t('resetFailed'));
      }
    } catch {
      setError(t('resetFailed'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(memberId: string) {
    setActionLoading(memberId);
    setError('');
    try {
      const res = await fetch(`/api/staff/${memberId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess(t('userDeleted'));
        setConfirmDelete(null);
        await loadStaff();
      } else {
        const data = await res.json();
        setError(data.error || t('deleteFailed'));
      }
    } catch {
      setError(t('deleteFailed'));
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-white">{t('staffTitle')}</h1>
        <ScreenBadge id="SY02" />
      </div>
      <p className="mb-8 text-sm text-ck-text-muted">{t('staffSubtitle')}</p>

      {/* Feedback */}
      {success && (
        <div className="mb-4 rounded-[10px] border-[0.5px] border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-400">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-400/60 hover:text-green-400">&times;</button>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-[10px] border-[0.5px] border-ck-red/30 bg-ck-red/10 px-4 py-2.5 text-sm text-ck-red">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-ck-red/60 hover:text-ck-red">&times;</button>
        </div>
      )}

      {/* ── User list ─────────────────────────────────────────── */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
        {t('staffTitle')} ({staff.length})
      </h2>

      {loading ? (
        <p className="text-sm text-ck-text-muted">{tCommon('loading')}</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-ck-text-muted">{t('noStaff')}</p>
      ) : (
        <div className="mb-10 space-y-3">
          {staff.map((member) => {
            const isYou = member.id === currentUserId;
            return (
              <div
                key={member.id}
                className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: user info */}
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${member.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {member.active ? (
                          <>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <path d="m9 12 2 2 4-4"/>
                          </>
                        ) : (
                          <>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                          </>
                        )}
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{member.email}</span>
                        {isYou && (
                          <span className="rounded bg-ck-blue/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ck-blue">
                            you
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-ck-text-muted">
                        {member.name} &middot; {t('createdAt')} {formatDate(member.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Right: role + actions */}
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member, e.target.value)}
                      className="rounded-[8px] border-[0.5px] border-ck-border bg-ck-bg px-2.5 py-1.5 text-xs text-white outline-none focus:border-ck-red/50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{t(`role${r.charAt(0).toUpperCase()}${r.slice(1)}` as 'roleAdmin')}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleResetPassword(member)}
                      disabled={actionLoading === member.id}
                      title={t('resetPassword')}
                      className="rounded-[8px] border-[0.5px] border-ck-border bg-ck-bg p-1.5 text-ck-text-muted transition-colors hover:text-white disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                    </button>

                    {!isYou && (
                      confirmDelete === member.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(member.id)}
                            disabled={actionLoading === member.id}
                            className="rounded-[8px] bg-red-500/20 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                          >
                            {actionLoading === member.id ? '...' : t('confirmDelete')}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-[8px] px-2 py-1.5 text-xs text-ck-text-muted hover:text-white"
                          >
                            {tCommon('cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(member.id)}
                          title={tCommon('delete')}
                          className="rounded-[8px] border-[0.5px] border-ck-border bg-ck-bg p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add new user ──────────────────────────────────────── */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ck-text-muted">
        {t('addNewUser')}
      </h2>

      <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Name + Email row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ck-text-muted">
                {t('staffName')}
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jan de Vries"
                className="w-full rounded-[8px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2.5 text-sm text-white placeholder:text-ck-text-faint outline-none focus:border-ck-red/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ck-text-muted">
                {t('staffEmail')}
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jan@colourking.nl"
                className="w-full rounded-[8px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2.5 text-sm text-white placeholder:text-ck-text-faint outline-none focus:border-ck-red/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ck-text-muted">
              {t('passwordLabel')}
            </label>
            <div className="relative max-w-sm">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                minLength={8}
                className="w-full rounded-[8px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-ck-text-faint outline-none focus:border-ck-red/50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ck-text-muted transition-colors hover:text-white"
                tabIndex={-1}
              >
                <EyeIcon open={showNewPassword} />
              </button>
            </div>
          </div>

          {/* Role cards */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-ck-text-muted">
              {t('staffRole')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map((r) => {
                const selected = newRole === r;
                const label = t(`role${r.charAt(0).toUpperCase()}${r.slice(1)}` as 'roleAdmin');
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setNewRole(r)}
                    className={`rounded-[10px] border-[0.5px] p-3 text-left transition-colors ${
                      selected
                        ? r === 'admin'
                          ? 'border-ck-red/50 bg-ck-red/10'
                          : 'border-ck-blue/50 bg-ck-blue/10'
                        : 'border-ck-border bg-ck-bg hover:border-ck-text-muted/30'
                    }`}
                  >
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${
                      selected
                        ? r === 'admin' ? 'bg-ck-red text-white' : 'bg-ck-blue text-white'
                        : 'text-ck-text-muted'
                    }`}>
                      {label}
                    </span>
                    <p className="mt-2 text-xs text-ck-text-muted">
                      {t(ROLE_DESC_KEYS[r] as 'roleAdminDesc')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createLoading}
            className="inline-flex items-center gap-2 rounded-[10px] bg-ck-red px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            {createLoading ? tCommon('loading') : t('createUser')}
          </button>
        </form>
      </div>
    </div>
  );
}
