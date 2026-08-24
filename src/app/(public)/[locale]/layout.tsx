import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';

export default function PublicLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) notFound();

  return children;
}
