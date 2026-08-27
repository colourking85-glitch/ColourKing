'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';

const navLinks = [
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ck-dark/95 backdrop-blur-md border-b border-ck-border py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <span className="font-heading text-2xl font-bold tracking-tight text-white">
            COLOUR<span className="text-[#E8364E]">KING</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium uppercase tracking-wide transition-colors duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t(link.label)}
              </Link>
            );
          })}

          {/* Language switcher */}
          <div className="flex items-center gap-1 border-l border-white/20 pl-6">
            {(['nl', 'en', 'tr'] as const).map((loc) => (
              <Link
                key={loc}
                href={pathname || '/'}
                locale={loc}
                className={`px-2 py-0.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                  locale === loc
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {localeLabels[loc]}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <Link
            href="/afspraak"
            className="ml-4 border border-white/30 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors duration-200 hover:border-white/70 hover:bg-white/5"
          >
            {t('nav.appointment')}
          </Link>
          <Link
            href="/contact"
            className="bg-[#E8364E] px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-[#d02e44]"
          >
            {t('nav.quote')}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 p-2 md:hidden"
          aria-label={t('nav.menu')}
        >
          <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition-all duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-ck-border bg-ck-dark/98 px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-1 py-4">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm font-medium uppercase tracking-wide text-white/70 transition-colors hover:text-white"
            >
              {t('nav.home')}
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium uppercase tracking-wide text-white/70 transition-colors hover:text-white"
              >
                {t(link.label)}
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-ck-border pt-4">
            <div className="flex items-center gap-2">
              {(['nl', 'en', 'tr'] as const).map((loc) => (
                <Link
                  key={loc}
                  href={pathname || '/'}
                  locale={loc}
                  onClick={() => setMenuOpen(false)}
                  className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${
                    locale === loc ? 'text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {localeLabels[loc]}
                </Link>
              ))}
            </div>
            <div className="flex gap-2">
              <Link
                href="/afspraak"
                onClick={() => setMenuOpen(false)}
                className="border border-white/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"
              >
                {t('nav.appointment')}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="bg-[#E8364E] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"
              >
                {t('nav.quote')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
