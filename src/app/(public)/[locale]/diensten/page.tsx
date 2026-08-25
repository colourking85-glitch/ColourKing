import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });
  return {
    title: t('seo.servicesTitle'),
    description: t('seo.servicesDesc'),
  };
}

const serviceKeys = [
  { key: 'damageRepair', icon: '\u{1F6E0}' },
  { key: 'painting', icon: '\u{1F3A8}' },
  { key: 'spotRepair', icon: '\u{1F4CD}' },
  { key: 'bodywork', icon: '\u{2728}' },
  { key: 'insurance', icon: '\u{1F4CB}' },
  { key: 'dentRepair', icon: '\u{1F528}' },
  { key: 'assessment', icon: '\u{1F698}' },
  { key: 'pickupDelivery', icon: '\u{1F69A}' },
] as const;

export default async function ServicesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });

  return (
    <>
      {/* Header */}
      <section className="px-4 pb-8 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-medium text-white sm:text-4xl">
            {t('servicesPage.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6b6b80]">
            {t('servicesPage.subtitle')}
          </p>
        </div>
      </section>

      {/* Service cards */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-6xl grid gap-4 sm:grid-cols-2">
          {serviceKeys.map(({ key, icon }) => {
            const bullets = t(`services.${key}.bullets`).split(' | ');
            return (
              <div
                key={key}
                className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <h2 className="text-base font-medium text-white">
                      {t(`services.${key}.title`)}
                    </h2>
                    <p className="mt-2 text-sm text-[#6b6b80] leading-relaxed">
                      {t(`services.${key}.desc`)}
                    </p>
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1.5">
                        {bullets.map((bullet) => (
                          <span
                            key={bullet}
                            className="rounded-md bg-[#0a0a0f] px-2 py-1 text-xs text-[#6b6b80]"
                          >
                            {bullet}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-4xl rounded-[10px] border border-[#E8364E]/20 bg-gradient-to-r from-[#E8364E]/10 to-[#E8364E]/5 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-medium text-white">
            {t('servicesPage.ctaTitle')}
          </h2>
          <p className="mt-3 text-sm text-[#6b6b80]">
            {t('servicesPage.ctaSubtitle')}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center rounded-[10px] bg-[#E8364E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d02e44]"
          >
            {t('servicesPage.ctaButton')}
          </Link>
        </div>
      </section>
    </>
  );
}
