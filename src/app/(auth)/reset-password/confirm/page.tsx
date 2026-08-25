'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase/client';

export default function ConfirmResetPasswordPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash automatically
    if (!supabase) return;
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    // If we arrive with a session already, allow password update
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (!supabase) {
      setError(t('resetNotAvailable'));
      return;
    }

    setLoading(true);

    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(t('resetFailed'));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.replace('/app'), 2000);
  }

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
        <p className="text-sm text-[#6b6b80]">{t('resetNotAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#E8364E]">
            <span className="font-mono text-lg font-medium text-white">CK</span>
          </div>
          <h1 className="text-lg font-medium text-white">{t('newPasswordTitle')}</h1>
          <p className="mt-1 text-sm text-[#6b6b80]">{t('newPasswordSubtitle')}</p>
        </div>

        {success ? (
          <div className="rounded-[10px] border-[0.5px] border-green-500/30 bg-green-500/10 p-4 text-center">
            <p className="text-sm text-green-400">{t('passwordUpdated')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#6b6b80]">
                {t('newPassword')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#12121a] px-3 py-2.5 text-sm text-white placeholder-[#6b6b80]/50 outline-none transition-colors focus:border-[#E8364E]/50"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-[#6b6b80]">
                {t('confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#12121a] px-3 py-2.5 text-sm text-white placeholder-[#6b6b80]/50 outline-none transition-colors focus:border-[#E8364E]/50"
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {error && (
              <div className="rounded-[10px] border-[0.5px] border-[#E8364E]/30 bg-[#E8364E]/10 px-3 py-2 text-sm text-[#E8364E]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full rounded-[10px] bg-[#E8364E] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? t('saving') : t('updatePassword')}
            </button>

            <div className="text-center">
              <a
                href="/login"
                className="text-sm text-[#6b6b80] transition-colors hover:text-white"
              >
                {t('backToLogin')}
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
