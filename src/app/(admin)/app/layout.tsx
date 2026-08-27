'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Shell } from '@/components/shell/Shell';
import { AdminIntlProvider } from '@/components/AdminIntlProvider';
import { SettingsProvider } from '@/components/SettingsProvider';
import { getSession } from '@/lib/auth';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations('common');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 8000)
    );

    void Promise.race([getSession().catch(() => null), timeout]).then((s) => {
      if (cancelled) return;
      if (!s) {
        router.replace('/login');
        return;
      }
      setOk(true);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ok) {
    return (
      <div className="flex h-screen items-center justify-center bg-ck-dark">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-ck-dark-border border-t-ck-red" />
          <p className="text-sm text-ck-muted">{t('authenticating')}</p>
        </div>
      </div>
    );
  }

  return <Shell>{children}</Shell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminIntlProvider>
      <SettingsProvider>
        <AuthGate>{children}</AuthGate>
      </SettingsProvider>
    </AdminIntlProvider>
  );
}
