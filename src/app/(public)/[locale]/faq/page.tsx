import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import FaqAccordion from '@/modules/public/FaqAccordion';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });
  return {
    title: t('faq.metaTitle'),
    description: t('faq.metaDesc'),
  };
}

const CATEGORIES = ['General', 'Insurance', 'Techniques', 'Costs', 'Process'] as const;

export default async function FaqPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-ck-red/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            {t('faq.eyebrow')}
          </p>
          <h1
            className="mt-4 font-heading font-extrabold uppercase tracking-tight text-ck-text"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            {t('faq.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ck-text-muted">
            {t('faq.subtitle')}
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl">
          {CATEGORIES.map((cat) => {
            const catKey = `cat${cat}` as const;
            const items = [1, 2, 3, 4, 5].map((n) => ({
              question: t(`faq.${catKey}_q${n}`),
              answer: t(`faq.${catKey}_a${n}`),
            }));

            return (
              <div key={cat} className="mb-12">
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-6 w-1 bg-ck-red" />
                  <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-ck-text sm:text-2xl">
                    {t(`faq.${catKey}`)}
                  </h2>
                </div>
                <FaqAccordion items={items} />
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ck-border bg-ck-surface px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-heading font-extrabold leading-tight text-ck-text"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}
          >
            {t('faq.ctaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ck-text-muted">
            {t('faq.ctaDesc')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/offerte"
              className="inline-flex items-center gap-2 bg-ck-red px-7 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 hover:bg-ck-red-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ck-red/30"
            >
              <span>{t('faq.ctaQuote')}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/afspraak"
              className="inline-flex items-center gap-2 border border-ck-border px-7 py-4 text-sm font-semibold uppercase tracking-wider text-ck-text transition-all duration-200 hover:border-ck-text-3 hover:bg-ck-surface-2 hover:-translate-y-0.5"
            >
              <span>{t('faq.ctaAppointment')}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
