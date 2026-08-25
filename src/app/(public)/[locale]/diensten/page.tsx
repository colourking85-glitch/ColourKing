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
  'damageRepair',
  'painting',
  'spotRepair',
  'bodywork',
  'insurance',
  'dentRepair',
  'assessment',
  'pickupDelivery',
] as const;

export default async function ServicesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8364E]/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('servicesOverview.eyebrow')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('servicesPage.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
            {t('servicesPage.subtitle')}
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-px bg-ck-border sm:grid-cols-2">
            {serviceKeys.map((key, i) => {
              const bullets = t(`services.${key}.bullets`).split(' | ');
              return (
                <div
                  key={key}
                  className="group bg-ck-dark p-8 transition-colors duration-300 hover:bg-ck-surface sm:p-10"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-4 font-heading text-2xl font-bold uppercase tracking-tight text-white">
                    {t(`services.${key}.title`)}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-white/60">
                    {t(`services.${key}.desc`)}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="border border-ck-border px-3 py-1 text-xs text-white/50"
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden border border-ck-border bg-ck-surface px-8 py-16 sm:px-16">
            <div className="absolute right-0 top-0 h-40 w-40 bg-[#E8364E]/10 blur-[80px]" />
            <div className="relative flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
                  {t('servicesPage.ctaTitle')}
                </h2>
                <p className="mt-3 text-sm text-white/60">
                  {t('servicesPage.ctaSubtitle')}
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 bg-[#E8364E] px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44]"
              >
                {t('servicesPage.ctaButton')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
