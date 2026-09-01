'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { ChevronDown, Globe } from 'lucide-react';

const navLinks = [
  { href: '/diensten', label: 'nav.services' },
  { href: '/gallerij', label: 'nav.gallery' },
  { href: '/over-ons', label: 'nav.about' },
  { href: '/faq', label: 'nav.faq' },
  { href: '/contact', label: 'nav.contact' },
] as const;

function FlagNL({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 20 14" className="rounded-sm overflow-hidden shrink-0">
      <rect width="20" height="4.67" fill="#AE1C28" />
      <rect y="4.67" width="20" height="4.67" fill="#FFF" />
      <rect y="9.33" width="20" height="4.67" fill="#21468B" />
    </svg>
  );
}

function FlagTR({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 20 14" className="rounded-sm overflow-hidden shrink-0">
      <rect width="20" height="14" fill="#E30A17" />
      <circle cx="7.5" cy="7" r="3.5" fill="#FFF" />
      <circle cx="8.3" cy="7" r="2.8" fill="#E30A17" />
      <polygon points="10,7 11.5,5.8 10.3,7.3 11.8,7 10.3,7.7 11.5,8.2" fill="#FFF" transform="rotate(18 10.5 7)" />
    </svg>
  );
}

function FlagIcon({ code, size = 20 }: { code: string; size?: number }) {
  if (code === 'nl') return <FlagNL size={size} />;
  if (code === 'tr') return <FlagTR size={size} />;
  return <Globe size={size - 4} className="shrink-0" />;
}

const LOCALES = [
  { code: 'nl', label: 'Nederlands' },
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
] as const;

const BROWSER_LANG_MAP: Record<string, string> = {
  nl: 'nl', 'nl-nl': 'nl', 'nl-be': 'nl',
  en: 'en', 'en-us': 'en', 'en-gb': 'en', 'en-au': 'en',
  tr: 'tr', 'tr-tr': 'tr',
};

function detectBrowserLocale(): string | null {
  if (typeof navigator === 'undefined') return null;
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    const match = BROWSER_LANG_MAP[lang.toLowerCase()];
    if (match) return match;
    const base = lang.split('-')[0].toLowerCase();
    const baseMatch = BROWSER_LANG_MAP[base];
    if (baseMatch) return baseMatch;
  }
  return null;
}

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('pub');
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLocale = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function handleAutoDetect() {
    const detected = detectBrowserLocale();
    if (detected && detected !== locale) {
      router.replace(pathname || '/', { locale: detected as 'nl' | 'en' | 'tr' });
    }
    setLangOpen(false);
  }

  function switchLocale(loc: string) {
    setLangOpen(false);
    if (loc !== locale) {
      router.replace(pathname || '/', { locale: loc as 'nl' | 'en' | 'tr' });
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-ck-bg/95 backdrop-blur-md border-b border-ck-border py-3'
          : 'py-5'
      }`}
      style={scrolled ? undefined : { background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)' }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/images/logo-colourking.svg"
            alt="Colourking"
            className="h-12 w-auto ck-logo"
          />
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
                    ? scrolled ? 'text-ck-text' : 'text-white'
                    : scrolled ? 'text-ck-text-3 hover:text-ck-text' : 'text-white/80 hover:text-white'
                }`}
              >
                {t(link.label)}
              </Link>
            );
          })}

          {/* Language dropdown */}
          <div className={`relative border-l pl-6 ${scrolled ? 'border-ck-border' : 'border-white/20'}`} ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                scrolled ? 'text-ck-text-3 hover:text-ck-text hover:bg-ck-surface-2' : 'text-white/80 hover:text-white'
              }`}
            >
              <FlagIcon code={currentLocale.code} />
              <ChevronDown size={14} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-ck-border bg-ck-surface shadow-2xl shadow-black/20">
                <div className="grid grid-cols-1 p-2">
                  {LOCALES.map(loc => (
                    <button
                      key={loc.code}
                      onClick={() => switchLocale(loc.code)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        locale === loc.code
                          ? 'bg-ck-red/10 text-ck-red font-semibold'
                          : 'text-ck-text-3 hover:bg-ck-surface-2 hover:text-ck-text'
                      }`}
                    >
                      <FlagIcon code={loc.code} />
                      <span>{loc.label}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-ck-border p-2">
                  <button
                    onClick={handleAutoDetect}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-ck-text-faint transition-colors hover:bg-ck-surface-2 hover:text-ck-text-3"
                  >
                    <Globe size={18} className="shrink-0" />
                    <span>{t('nav.autoDetect')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/autoschadeherstelcolourking/"
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex h-8 w-8 items-center justify-center border transition-colors ${
              scrolled ? 'border-ck-border hover:border-ck-text-3 hover:bg-ck-surface-2' : 'border-white/30 hover:border-white hover:bg-white/10'
            }`}
            aria-label="Instagram"
          >
            <svg className={`h-4 w-4 transition-colors ${scrolled ? 'text-ck-text-muted group-hover:text-ck-text' : 'text-white/70 group-hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </a>

          {/* CTAs */}
          <Link
            href="/afspraak"
            className={`border px-5 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors duration-200 ${
              scrolled
                ? 'border-ck-border text-ck-text hover:border-ck-text-3 hover:bg-ck-surface-2'
                : 'border-white/40 text-white hover:border-white hover:bg-white/10'
            }`}
          >
            {t('nav.appointment')}
          </Link>
          <Link
            href="/offerte"
            className="bg-ck-red px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-ck-red-hover"
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
          <span className={`block h-0.5 w-6 transition-all ${scrolled ? 'bg-ck-text' : 'bg-white'} duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 transition-all ${scrolled ? 'bg-ck-text' : 'bg-white'} duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 transition-all ${scrolled ? 'bg-ck-text' : 'bg-white'} duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-ck-border bg-ck-bg/98 px-6 pb-6 md:hidden">
          <div className="flex flex-col gap-1 py-4">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm font-medium uppercase tracking-wide text-ck-text-3 transition-colors hover:text-ck-text"
            >
              {t('nav.home')}
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-sm font-medium uppercase tracking-wide text-ck-text-3 transition-colors hover:text-ck-text"
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          {/* Mobile language + CTAs */}
          <div className="border-t border-ck-border pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {LOCALES.map(loc => (
                <button
                  key={loc.code}
                  onClick={() => { switchLocale(loc.code); setMenuOpen(false); }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    locale === loc.code
                      ? 'bg-ck-red/10 text-ck-red font-semibold'
                      : 'text-ck-text-muted hover:text-ck-text'
                  }`}
                >
                  <FlagIcon code={loc.code} size={16} />
                  <span>{loc.label}</span>
                </button>
              ))}
              <button
                onClick={() => { handleAutoDetect(); setMenuOpen(false); }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ck-text-faint hover:text-ck-text-muted"
              >
                <Globe size={14} />
                <span>{t('nav.autoDetect')}</span>
              </button>
            </div>
            <div className="flex gap-2">
              <Link
                href="/afspraak"
                onClick={() => setMenuOpen(false)}
                className="border border-ck-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ck-text"
              >
                {t('nav.appointment')}
              </Link>
              <Link
                href="/offerte"
                onClick={() => setMenuOpen(false)}
                className="bg-ck-red px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"
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
