'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSession, type Session } from '@/lib/auth';
import { AdminIntlProvider } from '@/components/AdminIntlProvider';

function MonitorLoading() {
  const t = useTranslations('monitor');
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#1e1e2a] border-t-[#E8364E]" />
        <p className="text-sm text-[#6b6b80]">{t('loadingMonitor')}</p>
      </div>
    </div>
  );
}

function MonitorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | undefined>(undefined);

  const isLoginPage = pathname === '/monitor/login';

  useEffect(() => {
    if (isLoginPage) return;
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
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        {children}
      </div>
    );
  }

  if (session === undefined) {
    return <MonitorLoading />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {children}
    </div>
  );
}

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminIntlProvider>
      <MonitorShell>{children}</MonitorShell>
    </AdminIntlProvider>
  );
}
