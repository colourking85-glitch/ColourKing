'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function Footer() {
  const t = useTranslations('pub');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#1e1e2a] bg-[#0a0a0f]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#E8364E] text-xs font-medium text-white">
                CK
              </span>
              <span className="text-sm font-medium text-white">Colourking</span>
            </div>
            <p className="mt-3 text-sm text-[#6b6b80]">
              {t('footer.description')}
            </p>
            <div className="mt-3 space-y-1 text-xs text-[#6b6b80]">
              <p>{t('footer.kvk')}</p>
              <p>{t('footer.btw')}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-medium text-white">{t('footer.quickLinks')}</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/" className="text-sm text-[#6b6b80] transition-colors hover:text-white">
                {t('nav.home')}
              </Link>
              <Link href="/diensten" className="text-sm text-[#6b6b80] transition-colors hover:text-white">
                {t('nav.services')}
              </Link>
              <Link href="/gallerij" className="text-sm text-[#6b6b80] transition-colors hover:text-white">
                {t('nav.gallery')}
              </Link>
              <Link href="/over-ons" className="text-sm text-[#6b6b80] transition-colors hover:text-white">
                {t('nav.about')}
              </Link>
              <Link href="/contact" className="text-sm text-[#6b6b80] transition-colors hover:text-white">
                {t('nav.contact')}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-medium text-white">{t('footer.contactInfo')}</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#6b6b80]">
              <p>{t('footer.address')}</p>
              <a href="tel:+31681631020" className="transition-colors hover:text-white">
                {t('footer.phone')}
              </a>
              <a href="mailto:info@colourking.nl" className="transition-colors hover:text-white">
                {t('footer.email')}
              </a>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-medium text-white">{t('footer.hours')}</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#6b6b80]">
              <p>{t('footer.hoursWeekdays')}</p>
              <p>{t('footer.hoursSaturday')}</p>
              <p>{t('footer.hoursSunday')}</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#1e1e2a] pt-6 sm:flex-row">
          <p className="text-xs text-[#6b6b80]">
            {t('footer.copyright', { year })}
          </p>
          <div className="flex gap-4 text-xs text-[#6b6b80]">
            <span className="cursor-default">{t('footer.privacy')}</span>
            <span className="cursor-default">{t('footer.terms')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
