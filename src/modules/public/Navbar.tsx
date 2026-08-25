'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';

const navLinks = [
  { href: '/', label: 'nav.home' },
  { href: '/diensten', label: 'nav.services' },
  { href: '/gallerij', label: 'nav.gallery' },
  { href: '/over-ons', label: 'nav.about' },
  { href: '/contact', label: 'nav.contact' },
] as const;

const localeLabels: Record<string, string> = {
  nl: 'NL',
  en: 'EN',
  tr: 'TR',
};

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('pub');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1e2a] bg-[#0a0a0f]/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E8364E] text-sm font-medium text-white">
            CK
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-[#6b6b80] hover:text-white'
                }`}
              >
                {t(link.label)}
              </Link>
            );
          })}
        </div>

        {/* Right side: language switcher + CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-1 rounded-[10px] border border-[#1e1e2a] px-2 py-1.5">
            {(['nl', 'en', 'tr'] as const).map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                  locale === loc
                    ? 'bg-[#1e1e2a] text-white'
                    : 'text-[#6b6b80] hover:text-white'
                }`}
              >
                {localeLabels[loc]}
              </Link>
            ))}
          </div>
          <Link
            href="/contact"
            className="rounded-[10px] bg-[#E8364E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d02e44]"
          >
            {t('nav.quote')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#1e1e2a] md:hidden"
          aria-label={t('nav.menu')}
        >
          <span className="sr-only">{t('nav.menu')}</span>
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
              <path d="M3 5h12M3 9h12M3 13h12" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[#1e1e2a] px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 py-3">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-[10px] px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#12121a] text-white'
                      : 'text-[#6b6b80] hover:bg-[#12121a] hover:text-white'
                  }`}
                >
                  {t(link.label)}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-[#1e1e2a] pt-3">
            <div className="flex items-center gap-1">
              {(['nl', 'en', 'tr'] as const).map((loc) => (
                <Link
                  key={loc}
                  href={pathname}
                  locale={loc}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    locale === loc
                      ? 'bg-[#1e1e2a] text-white'
                      : 'text-[#6b6b80] hover:text-white'
                  }`}
                >
                  {localeLabels[loc]}
                </Link>
              ))}
            </div>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-[10px] bg-[#E8364E] px-4 py-2 text-sm font-medium text-white"
            >
              {t('nav.quote')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
