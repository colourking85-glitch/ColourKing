'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'office' | 'tech';
  active: boolean;
  created_at: string;
};

export default function StaffManagementPage() {
  const t = useTranslations('sy');
  const tCommon = useTranslations('common');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('office');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviteLoading(true);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('inviteFailed'));
        setInviteLoading(false);
        return;
      }

      setSuccess(t('inviteSent'));
      setInviteEmail('');
      setInviteName('');
      setInviteRole('office');
      setShowInvite(false);
      await loadStaff();
    } catch {
      setError(t('inviteFailed'));
    } finally {
      setInviteLoading(false);
    }
  }

  async function toggleActive(member: StaffMember) {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !member.active }),
      });
      if (res.ok) {
        await loadStaff();
      }
    } catch {
      // ignore
    }
  }

  async function changeRole(member: StaffMember, newRole: string) {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await loadStaff();
      }
    } catch {
      // ignore
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

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return t('roleAdmin');
      case 'office':
        return t('roleOffice');
      case 'tech':
        return t('roleTech');
      default:
        return role;
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-white">{t('staffTitle')}</h1>
          <ScreenBadge id="SY02" />
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t('inviteStaff')}
        </button>
      </div>

      <p className="mb-6 text-sm text-ck-text-muted">{t('staffSubtitle')}</p>

      {/* Success/error messages */}
      {success && (
        <div className="mb-4 rounded-[10px] border-[0.5px] border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 text-green-400/60 hover:text-green-400">&times;</button>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-[10px] border-[0.5px] border-ck-red/30 bg-ck-red/10 px-3 py-2 text-sm text-ck-red">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-ck-red/60 hover:text-ck-red">&times;</button>
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="mb-6 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-white">{t('inviteStaff')}</h2>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3">
            <input
              type="text"
              required
              placeholder={t('staffName')}
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="flex-1 rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-white placeholder:text-ck-text-faint outline-none focus:border-ck-red/50"
            />
            <input
              type="email"
              required
              placeholder={t('staffEmail')}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-white placeholder:text-ck-text-faint outline-none focus:border-ck-red/50"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-3 py-2 text-sm text-white outline-none focus:border-ck-red/50"
            >
              <option value="admin">{t('roleAdmin')}</option>
              <option value="office">{t('roleOffice')}</option>
              <option value="tech">{t('roleTech')}</option>
            </select>
            <button
              type="submit"
              disabled={inviteLoading}
              className="rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {inviteLoading ? tCommon('loading') : tCommon('submit')}
            </button>
          </form>
        </div>
      )}

      {/* Staff list */}
      {loading ? (
        <p className="text-sm text-ck-text-muted">{tCommon('loading')}</p>
      ) : staff.length === 0 ? (
        <p className="text-sm text-ck-text-muted">{t('noStaff')}</p>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border-[0.5px] border-ck-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ck-border bg-ck-surface">
                <th className="px-4 py-3 text-left font-medium text-ck-text-muted">
                  {t('staffName')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-ck-text-muted">
                  {t('staffEmail')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-ck-text-muted">
                  {t('staffRole')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-ck-text-muted">
                  {t('staffStatus')}
                </th>
                <th className="px-4 py-3 text-right font-medium text-ck-text-muted">
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-ck-border last:border-0"
                >
                  <td className="px-4 py-3 text-white">{member.name}</td>
                  <td className="px-4 py-3 text-ck-text-muted">{member.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member, e.target.value)}
                      className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg px-2 py-1 text-xs text-white outline-none"
                    >
                      <option value="admin">{t('roleAdmin')}</option>
                      <option value="office">{t('roleOffice')}</option>
                      <option value="tech">{t('roleTech')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        member.active
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {member.active ? t('statusActive') : t('statusInactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActive(member)}
                        className="rounded px-2 py-1 text-xs text-ck-text-muted transition-colors hover:bg-white/5 hover:text-white"
                      >
                        {member.active ? t('deactivate') : t('activate')}
                      </button>
                      <button
                        onClick={() => handleResetPassword(member)}
                        disabled={actionLoading === member.id}
                        className="rounded px-2 py-1 text-xs text-ck-blue transition-colors hover:bg-ck-blue/10 disabled:opacity-50"
                      >
                        {t('resetPassword')}
                      </button>
                      {confirmDelete === member.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(member.id)}
                            disabled={actionLoading === member.id}
                            className="rounded bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                          >
                            {actionLoading === member.id ? '...' : t('confirmDelete')}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded px-2 py-1 text-xs text-ck-text-muted hover:text-white"
                          >
                            {tCommon('cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(member.id)}
                          className="rounded px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          {tCommon('delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
