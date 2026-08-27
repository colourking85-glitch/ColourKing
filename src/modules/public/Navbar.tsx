'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { ChevronDown, Globe } from 'lucide-react';

const navLinks = [
  { href: '/diensten', label: 'nav.services' },
  { href: '/gallerij', label: 'nav.gallery' },
  { href: '/over-ons', label: 'nav.about' },
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

          {/* Language dropdown */}
          <div className="relative border-l border-white/20 pl-6" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white hover:bg-white/5"
            >
              <FlagIcon code={currentLocale.code} />
              <ChevronDown size={14} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl shadow-black/50">
                <div className="grid grid-cols-1 p-2">
                  {LOCALES.map(loc => (
                    <button
                      key={loc.code}
                      onClick={() => switchLocale(loc.code)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        locale === loc.code
                          ? 'bg-[#E8364E]/10 text-[#E8364E] font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <FlagIcon code={loc.code} />
                      <span>{loc.label}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/10 p-2">
                  <button
                    onClick={handleAutoDetect}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
                  >
                    <Globe size={18} className="shrink-0" />
                    <span>{t('nav.autoDetect')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <Link
            href="/afspraak"
            className="border border-white/30 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-colors duration-200 hover:border-white/70 hover:bg-white/5"
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

          {/* Mobile language + CTAs */}
          <div className="border-t border-ck-border pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {LOCALES.map(loc => (
                <button
                  key={loc.code}
                  onClick={() => { switchLocale(loc.code); setMenuOpen(false); }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    locale === loc.code
                      ? 'bg-[#E8364E]/10 text-[#E8364E] font-semibold'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <FlagIcon code={loc.code} size={16} />
                  <span>{loc.label}</span>
                </button>
              ))}
              <button
                onClick={() => { handleAutoDetect(); setMenuOpen(false); }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/30 hover:text-white/60"
              >
                <Globe size={14} />
                <span>{t('nav.autoDetect')}</span>
              </button>
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
