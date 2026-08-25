'use client';

import { AdminIntlProvider } from '@/components/AdminIntlProvider';

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <AdminIntlProvider>{children}</AdminIntlProvider>;
}
