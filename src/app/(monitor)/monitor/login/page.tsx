'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signIn } from '@/lib/auth';
import { Monitor } from 'lucide-react';

export default function MonitorLoginPage() {
  const router = useRouter();
  const t = useTranslations('monitor');
  const tAuth = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.replace('/monitor');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8364E]">
            <Monitor size={32} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{t('loginTitle')}</h1>
          <p className="mt-1 text-sm text-[#6b6b80]">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[#6b6b80]">{tAuth('email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[#1e1e2a] bg-[#12121a] px-4 py-2.5 text-sm text-white placeholder:text-[#3a3a50] focus:border-[#E8364E] focus:outline-none"
              placeholder={tAuth('emailPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#6b6b80]">{tAuth('password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[#1e1e2a] bg-[#12121a] px-4 py-2.5 text-sm text-white placeholder:text-[#3a3a50] focus:border-[#E8364E] focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-[#E8364E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d42e44] disabled:opacity-50"
          >
            {loading ? t('loginLoading') : t('loginButton')}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#3a3a50]">
          monitor.colourking.nl
        </p>
      </div>
    </div>
  );
}
