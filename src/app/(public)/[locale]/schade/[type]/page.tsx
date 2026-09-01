import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

const DAMAGE_TYPES = ['kras', 'deuk', 'lakschade', 'bumper', 'hagel'] as const;
type DamageType = typeof DAMAGE_TYPES[number];

const SERVICE_MAP: Record<DamageType, string[]> = {
  kras: ['spot_repair', 'painting'],
  deuk: ['pdr', 'body_repair'],
  lakschade: ['painting', 'full_respray'],
  bumper: ['body_repair', 'painting'],
  hagel: ['pdr', 'body_repair'],
};

const ICON_PATHS: Record<DamageType, string> = {
  kras: 'M4 20L20 4M6 18l12-12M8 16l8-8',
  deuk: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
  lakschade: 'M7 21h10a1 1 0 001-1v-1a3 3 0 00-3-3H9a3 3 0 00-3 3v1a1 1 0 001 1zM5 10l7-7 7 7M4 10h16v2a3 3 0 01-3 3H7a3 3 0 01-3-3v-2z',
  bumper: 'M3 12h18M3 12a9 9 0 009 9h0a9 9 0 009-9M3 12C3 7.03 7.03 3 12 3s9 4.03 9 9',
  hagel: 'M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24',
};

export async function generateStaticParams() {
  return DAMAGE_TYPES.map(type => ({ type }));
}

export async function generateMetadata({
  params: { locale, type },
}: {
  params: { locale: string; type: string };
}) {
  if (!DAMAGE_TYPES.includes(type as DamageType)) return {};
  const t = await getTranslations({ locale, namespace: 'pub.damage' });
  return {
    title: t(`${type}.metaTitle`),
    description: t(`${type}.metaDesc`),
  };
}

export default async function DamageTypePage({
  params: { locale, type },
}: {
  params: { locale: string; type: string };
}) {
  if (!DAMAGE_TYPES.includes(type as DamageType)) notFound();

  const dt = type as DamageType;
  const t = await getTranslations({ locale, namespace: 'pub.damage' });
  const tOfferte = await getTranslations({ locale, namespace: 'pub.offerte' });

  const services = SERVICE_MAP[dt];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-ck-red/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center border border-ck-red/30 bg-ck-red/10">
              <svg className="h-7 w-7 text-ck-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[dt]} />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
                {t('eyebrow')}
              </p>
              <h1 className="mt-1 font-heading text-4xl font-bold uppercase tracking-tight text-ck-text sm:text-5xl lg:text-6xl">
                {t(`${dt}.title`)}
              </h1>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ck-text-muted">
            {t(`${dt}.intro`)}
          </p>
        </div>
      </section>

      {/* What is this damage */}
      <section className="border-t border-ck-border px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
                {t(`${dt}.whatTitle`)}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ck-text-muted">
                {t(`${dt}.whatDesc`)}
              </p>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
                {t(`${dt}.howTitle`)}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ck-text-muted">
                {t(`${dt}.howDesc`)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended services */}
      <section className="border-t border-ck-border bg-ck-surface px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            {t('servicesEyebrow')}
          </p>
          <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
            {t(`${dt}.servicesTitle`)}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {services.map(svc => (
              <div key={svc} className="border border-ck-border p-6 transition-colors hover:border-ck-red/40">
                <h3 className="text-sm font-semibold text-ck-text">
                  {tOfferte(`service_${svc}`)}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ck-text-muted">
                  {t(`service_${svc}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process steps */}
      <section className="border-t border-ck-border px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
            {t('processTitle')}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="relative border-l-2 border-ck-red/30 pl-6">
                <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center bg-ck-bg text-xs font-bold text-ck-red">
                  {step}
                </span>
                <h3 className="text-sm font-semibold text-ck-text">{t(`step${step}Title`)}</h3>
                <p className="mt-1 text-xs text-ck-text-muted">{t(`step${step}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-ck-border bg-ck-red/5 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-ck-text sm:text-4xl">
            {t(`${dt}.ctaTitle`)}
          </h2>
          <p className="mt-4 text-sm text-ck-text-muted">
            {t(`${dt}.ctaDesc`)}
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/offerte"
              className="bg-ck-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover"
            >
              {t('ctaQuote')}
            </Link>
            <Link
              href="/afspraak"
              className="border border-ck-border px-8 py-4 text-sm font-semibold uppercase tracking-wider text-ck-text transition-colors hover:border-ck-red/40 hover:text-ck-red"
            >
              {t('ctaAppointment')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
