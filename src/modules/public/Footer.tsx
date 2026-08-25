'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function Footer() {
  const t = useTranslations('pub');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ck-border bg-ck-dark">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Link href="/">
              <span className="font-heading text-xl font-bold tracking-tight text-white">
                COLOUR<span className="text-[#E8364E]">KING</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ck-text-muted">
              {t('footer.description')}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-widest text-ck-text-muted">
              {t('footer.quickLinks')}
            </h3>
            <nav aria-label="Footer" className="flex flex-col gap-3">
              <Link href="/diensten" className="text-sm text-ck-text-muted transition-colors duration-200 hover:text-white">
                {t('nav.services')}
              </Link>
              <Link href="/gallerij" className="text-sm text-ck-text-muted transition-colors duration-200 hover:text-white">
                {t('nav.gallery')}
              </Link>
              <Link href="/over-ons" className="text-sm text-ck-text-muted transition-colors duration-200 hover:text-white">
                {t('nav.about')}
              </Link>
              <Link href="/contact" className="text-sm text-ck-text-muted transition-colors duration-200 hover:text-white">
                {t('nav.contact')}
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-widest text-ck-text-muted">
              {t('footer.contactInfo')}
            </h3>
            <div className="flex flex-col gap-4">
              <a
                href="tel:+31681631020"
                className="flex items-center gap-3 text-sm text-ck-text-muted transition-colors hover:text-white group"
              >
                <svg className="h-4 w-4 shrink-0 text-[#E8364E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                {t('footer.phone')}
              </a>
              <a
                href="mailto:info@colourking.nl"
                className="flex items-center gap-3 text-sm text-ck-text-muted transition-colors hover:text-white"
              >
                <svg className="h-4 w-4 shrink-0 text-[#E8364E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                </svg>
                {t('footer.email')}
              </a>
              <div className="flex items-start gap-3 text-sm text-ck-text-muted">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#E8364E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 01-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0116 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <address className="not-italic leading-relaxed">
                  {t('footer.address')}
                </address>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ck-border pt-8 md:flex-row">
          <p className="text-xs text-ck-text-muted">
            {t('footer.copyright', { year })}
          </p>
          <p className="text-xs text-ck-text-muted">
            {t('footer.kvk')}&nbsp;&nbsp;{t('footer.btw')}
          </p>
        </div>
      </div>
    </footer>
  );
}
