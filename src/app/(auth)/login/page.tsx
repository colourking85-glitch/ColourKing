'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(t('invalidCredentials'));
        setLoading(false);
        return;
      }
      router.replace('/app');
    } catch {
      setError(t('invalidCredentials'));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#E8364E]">
            <span className="font-mono text-lg font-medium text-white">CK</span>
          </div>
          <h1 className="text-lg font-medium text-white">{t('signInTitle')}</h1>
          <p className="mt-1 text-sm text-[#6b6b80]">{t('signInSubtitle')}</p>
        </div>

        {/* Form */}
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
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-[#1e1e2a] bg-[#12121a] px-3 py-2.5 text-sm text-white placeholder-[#6b6b80]/50 outline-none transition-colors focus:border-[#E8364E]/50"
              autoComplete="current-password"
            />
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
      </div>
    </div>
  );
}
