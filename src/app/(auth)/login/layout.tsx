'use client';

import { AdminIntlProvider } from '@/components/AdminIntlProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AdminIntlProvider>{children}</AdminIntlProvider>;
}
