import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './request';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localeDetection: false,
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing);
