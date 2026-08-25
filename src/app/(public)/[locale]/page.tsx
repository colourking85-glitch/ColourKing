import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });
  return {
    title: t('seo.homeTitle'),
    description: t('seo.homeDesc'),
  };
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });

  const services = [
    { key: 'damageRepair', icon: '\u{1F6E0}' },
    { key: 'painting', icon: '\u{1F3A8}' },
    { key: 'spotRepair', icon: '\u{1F4CD}' },
    { key: 'bodywork', icon: '\u{1F698}' },
  ] as const;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8364E]/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-medium text-white sm:text-5xl sm:leading-tight">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#6b6b80] sm:text-lg">
            {t('hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-[10px] bg-[#E8364E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d02e44]"
            >
              {t('hero.ctaQuote')}
            </Link>
            <a
              href="tel:+31681631020"
              className="inline-flex items-center gap-2 rounded-[10px] border border-[#1e1e2a] px-6 py-3 text-sm font-medium text-white transition-colors hover:border-[#E8364E]/30"
            >
              <span className="text-[#E8364E]">&#9742;</span>
              {t('hero.ctaCall')}
            </a>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1e1e2a] bg-[#12121a]">
        <div className="mx-auto grid max-w-4xl grid-cols-1 divide-y divide-[#1e1e2a] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {([
            { value: 'yearsValue', label: 'yearsLabel' },
            { value: 'carsValue', label: 'carsLabel' },
            { value: 'customersValue', label: 'customersLabel' },
          ] as const).map(({ value, label }) => (
            <div key={value} className="px-6 py-6 text-center">
              <p className="text-xl font-medium text-[#E8364E]">{t(`stats.${value}`)}</p>
              <p className="mt-1 text-sm text-[#6b6b80]">{t(`stats.${label}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services overview */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-white sm:text-3xl">
              {t('servicesOverview.title')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6b6b80]">
              {t('servicesOverview.subtitle')}
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ key, icon }) => (
              <div
                key={key}
                className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6 transition-colors hover:border-[#E8364E]/20"
              >
                <span className="text-2xl">{icon}</span>
                <h3 className="mt-3 text-sm font-medium text-white">
                  {t(`services.${key}.title`)}
                </h3>
                <p className="mt-2 text-xs text-[#6b6b80] leading-relaxed">
                  {t(`services.${key}.desc`)}
                </p>
                <Link
                  href="/diensten"
                  className="mt-4 inline-block text-xs text-[#E8364E] transition-colors hover:text-[#d02e44]"
                >
                  {t('servicesPage.moreInfo')} &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-[#1e1e2a] bg-[#12121a] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-medium text-white sm:text-3xl">
            {t('testimonialsSection.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[#6b6b80]">
            {t('testimonialsSection.subtitle')}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {(['one', 'two', 'three'] as const).map((key) => (
              <div
                key={key}
                className="rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] p-6"
              >
                <div className="mb-3 text-[#E8364E]">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p className="text-sm text-[#6b6b80] leading-relaxed">
                  &ldquo;{t(`testimonials.${key}.quote`)}&rdquo;
                </p>
                <p className="mt-4 text-xs font-medium text-white">
                  {t(`testimonials.${key}.name`)}
                </p>
                <p className="text-xs text-[#6b6b80]">
                  {t(`testimonials.${key}.role`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl rounded-[10px] bg-gradient-to-r from-[#E8364E]/10 to-[#E8364E]/5 border border-[#E8364E]/20 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-medium text-white sm:text-3xl">
            {t('cta.title')}
          </h2>
          <p className="mt-3 text-sm text-[#6b6b80]">
            {t('cta.subtitle')}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center rounded-[10px] bg-[#E8364E] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d02e44]"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>
    </>
  );
}
