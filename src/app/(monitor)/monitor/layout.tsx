'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, type Session } from '@/lib/auth';

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then(s => {
        if (cancelled) return;
        if (!s) {
          router.replace('/monitor/login');
          return;
        }
        setSession(s);
      })
      .catch(() => {
        if (!cancelled) router.replace('/monitor/login');
      });
    return () => { cancelled = true; };
  }, [router]);

  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#1e1e2a] border-t-[#E8364E]" />
          <p className="text-sm text-[#6b6b80]">Monitoring laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  );
}
