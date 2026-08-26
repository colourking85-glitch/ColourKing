'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from '@/lib/auth';
import { LanguageSwitcher } from '@/components/auth/LanguageSwitcher';

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        if (result.error === 'NO_STAFF_RECORD') {
          setError(t('noStaffRecord'));
        } else if (result.error === 'ACCOUNT_DEACTIVATED') {
          setError(t('accountDeactivated'));
        } else {
          setError(t('invalidCredentials'));
        }
        setLoading(false);
        return;
      }
      window.location.href = '/app';
    } catch {
      setError(t('invalidCredentials'));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#E8364E]">
            <span className="font-mono text-lg font-medium text-white">CK</span>
          </div>
          <h1 className="text-lg font-medium text-white">{t('signInTitle')}</h1>
          <p className="mt-1 text-sm text-[#6b6b80]">{t('signInSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#6b6b80]">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className="w-full rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#12121a] px-3 py-2.5 text-sm text-white placeholder-[#6b6b80]/50 outline-none transition-colors focus:border-[#E8364E]/50"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#6b6b80]">
              {t('password')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#12121a] px-3 py-2.5 pr-10 text-sm text-white placeholder-[#6b6b80]/50 outline-none transition-colors focus:border-[#E8364E]/50"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b80] transition-colors hover:text-white"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-[10px] border-[0.5px] border-[#E8364E]/30 bg-[#E8364E]/10 px-3 py-2 text-sm text-[#E8364E]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-[#E8364E] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>

          <div className="text-center">
            <a
              href="/reset-password"
              className="text-sm text-[#6b6b80] transition-colors hover:text-white"
            >
              {t('forgotPassword')}
            </a>
          </div>
        </form>

        <div className="mt-8">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
