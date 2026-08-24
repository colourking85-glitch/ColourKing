'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push('/app');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ck-dark">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ck-red">
            <span className="font-display text-xl font-bold text-white">CK</span>
          </div>
          <h1 className="font-display text-xl font-bold text-white">
            Colourking
          </h1>
          <p className="mt-1 text-sm text-ck-muted">Beheerconsole</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-ck-muted-light"
            >
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-ck-muted focus:border-ck-red"
              placeholder="naam@colourking.nl"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-ck-muted-light"
            >
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-ck-muted focus:border-ck-red"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/20 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ck-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ck-red-hover disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}
