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

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ck-text-muted">
                {t('footer.followUs')}
              </h3>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/colourking.nl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center bg-white transition-colors group-hover:bg-[#E8364E]">
                    <svg className="h-5 w-5 text-ck-dark group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-ck-text-muted transition-colors group-hover:text-white">
                    Instagram
                  </span>
                </a>
                <a
                  href="https://www.facebook.com/colourking.nl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center bg-white transition-colors group-hover:bg-[#E8364E]">
                    <svg className="h-5 w-5 text-ck-dark group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-ck-text-muted transition-colors group-hover:text-white">
                    Facebook
                  </span>
                </a>
              </div>
            </div>
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
