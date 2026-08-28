import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import { BeforeAfterSlider } from '@/components/public/BeforeAfterSlider';

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

const pillarKeys = ['quote', 'inspection', 'tools', 'result'] as const;

const equipmentKeys = [
  'spectro',
  'booth',
  'jig',
  'pdr',
  'gauge',
  'polish',
] as const;

const guaranteeKeys = ['warranty', 'insurers', 'mobile'] as const;

const checklistKeys = [
  'photos',
  'thickness',
  'hidden',
  'alignment',
  'gaps',
  'gloss',
  'handover',
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
        <div className="absolute inset-0 bg-gradient-to-b from-ck-red/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            {t('servicesOverview.eyebrow')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-ck-text sm:text-5xl lg:text-6xl">
            {t('servicesPage.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ck-text-muted">
            {t('servicesPage.subtitle')}
          </p>
        </div>
      </section>

      {/* Pillars / Promises */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ck-red">
              <span className="block h-0.5 w-6 bg-ck-red" />
              {t('pillars.eyebrow')}
            </p>
            <h2 className="mt-5 font-heading text-3xl font-bold uppercase tracking-tight text-ck-text sm:text-4xl">
              {t('pillars.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-base text-ck-text-muted">
              {t('pillars.subtitle')}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {pillarKeys.map((key, i) => (
              <ScrollReveal key={key} delay={i * 45}>
                <article className="relative overflow-hidden rounded-xl border border-ck-border bg-ck-surface p-8">
                  <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-ck-red/55" />
                  <h3 className="font-heading text-xl font-bold tracking-tight text-ck-text">
                    {t(`pillars.${key}.title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ck-text-muted">
                    {t(`pillars.${key}.desc`)}
                  </p>
                  <p className="mt-6 flex items-start gap-2.5 border-t border-dashed border-ck-border pt-4 font-mono text-xs text-ck-text-muted">
                    <strong className="whitespace-nowrap font-semibold text-emerald-500">
                      {t('pillars.proofLabel')}
                    </strong>
                    {t(`pillars.${key}.proof`)}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-px bg-ck-border sm:grid-cols-2">
            {serviceKeys.map((key, i) => {
              const bullets = t(`services.${key}.bullets`).split(' | ');
              return (
                <ScrollReveal key={key} delay={Math.min(i, 4) * 45}>
                  <div className="group bg-ck-bg p-8 transition-colors duration-300 hover:bg-ck-surface sm:p-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ck-red">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h2 className="mt-4 font-heading text-2xl font-bold uppercase tracking-tight text-ck-text">
                      {t(`services.${key}.title`)}
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-ck-text-muted">
                      {t(`services.${key}.desc`)}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {bullets.map((bullet) => (
                        <span
                          key={bullet}
                          className="border border-ck-border px-3 py-1 text-xs text-ck-text-muted"
                        >
                          {bullet}
                        </span>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Evidence section */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ck-red">
              <span className="block h-0.5 w-6 bg-ck-red" />
              {t('evidence.eyebrow')}
            </p>
            <h2 className="mt-5 font-heading text-3xl font-bold uppercase tracking-tight text-ck-text sm:text-4xl">
              {t('evidence.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-base text-ck-text-muted">
              {t('evidence.subtitle')}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Spectrophotometer card */}
            <ScrollReveal>
              <div className="overflow-hidden rounded-xl border border-ck-border bg-ck-surface shadow-lg">
                <div className="flex items-center justify-between border-b border-ck-border bg-ck-bg px-6 py-4">
                  <h3 className="font-heading text-base font-bold text-ck-text">
                    {t('evidence.spectro.title')}
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.13em] text-ck-text-muted">
                    {t('evidence.spectro.tag')}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-ck-text-muted">
                    {t('evidence.spectro.desc')}
                  </p>
                  <div className="mt-6 flex gap-1.5" aria-hidden="true">
                    {['#7d1a15', '#9c211a', '#bd2a21', '#d43a2c', '#e6584a'].map((c, i) => (
                      <span
                        key={c}
                        className={`h-14 flex-1 rounded-md ${i === 2 ? 'outline outline-2 outline-offset-[3px] outline-emerald-500' : ''}`}
                        style={{ background: c }}
                      >
                        {i === 2 && (
                          <span className="relative -bottom-[60px] left-1/2 -translate-x-1/2 font-mono text-[9.5px] tracking-[0.12em] text-emerald-500">
                            MATCH
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="mt-10 divide-y divide-ck-border">
                    {(['code', 'variant', 'deltaE', 'thickness', 'curing'] as const).map((row) => (
                      <div key={row} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <span className="text-ck-text-muted">{t(`evidence.spectro.${row}Label`)}</span>
                        <b className={`font-mono font-semibold tabular-nums ${row === 'deltaE' ? 'text-emerald-500' : 'text-ck-text'}`}>
                          {t(`evidence.spectro.${row}Value`)}
                        </b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Inspection checklist card */}
            <ScrollReveal delay={45}>
              <div className="overflow-hidden rounded-xl border border-ck-border bg-ck-surface shadow-lg">
                <div className="flex items-center justify-between border-b border-ck-border bg-ck-bg px-6 py-4">
                  <h3 className="font-heading text-base font-bold text-ck-text">
                    {t('evidence.checklist.title')}
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.13em] text-ck-text-muted">
                    {t('evidence.checklist.tag')}
                  </span>
                </div>
                <div className="space-y-3 p-6">
                  {checklistKeys.map((key) => (
                    <div key={key} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md bg-ck-red/10 text-emerald-500">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" className="h-3 w-3" aria-hidden="true">
                          <path d="M2.5 8.5l3.5 3.5 7.5-8" />
                        </svg>
                      </span>
                      <span className="text-ck-text-muted">
                        <b className="font-semibold text-ck-text">{t(`evidence.checklist.${key}Title`)}</b>
                        {' — '}
                        {t(`evidence.checklist.${key}Desc`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Before/After + Equipment row */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <ScrollReveal>
              <div className="overflow-hidden rounded-xl border border-ck-border bg-ck-surface shadow-lg">
                <div className="flex items-center justify-between border-b border-ck-border bg-ck-bg px-6 py-4">
                  <h3 className="font-heading text-base font-bold text-ck-text">
                    {t('evidence.beforeAfter.title')}
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.13em] text-ck-text-muted">
                    {t('evidence.beforeAfter.tag')}
                  </span>
                </div>
                <div className="p-6">
                  <BeforeAfterSlider
                    beforeLabel={t('evidence.beforeAfter.beforeLabel')}
                    afterLabel={t('evidence.beforeAfter.afterLabel')}
                    ariaLabel={t('evidence.beforeAfter.ariaLabel')}
                  />
                  <p className="mt-4 font-mono text-xs text-ck-text-muted">
                    {t('evidence.beforeAfter.hint')}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={45}>
              <div className="overflow-hidden rounded-xl border border-ck-border bg-ck-surface shadow-lg">
                <div className="flex items-center justify-between border-b border-ck-border bg-ck-bg px-6 py-4">
                  <h3 className="font-heading text-base font-bold text-ck-text">
                    {t('evidence.equipment.title')}
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.13em] text-ck-text-muted">
                    {t('evidence.equipment.tag')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-6">
                  {equipmentKeys.map((key) => (
                    <div key={key} className="rounded-lg border border-ck-border bg-ck-bg p-4">
                      <b className="font-heading text-sm font-bold text-ck-text">
                        {t(`evidence.equipment.${key}Title`)}
                      </b>
                      <p className="mt-1 text-xs leading-snug text-ck-text-muted">
                        {t(`evidence.equipment.${key}Desc`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ck-red">
              <span className="block h-0.5 w-6 bg-ck-red" />
              {t('guarantee.eyebrow')}
            </p>
            <h2 className="mt-5 font-heading text-3xl font-bold uppercase tracking-tight text-ck-text sm:text-4xl">
              {t('guarantee.title')}
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {guaranteeKeys.map((key, i) => (
              <ScrollReveal key={key} delay={i * 45}>
                <div className="rounded-xl border border-ck-border bg-ck-surface p-7">
                  <b className="font-heading text-3xl font-extrabold tracking-tight text-ck-text">
                    {t(`guarantee.${key}.value`)}
                  </b>
                  <h3 className="mt-2.5 font-heading text-lg font-bold text-ck-text">
                    {t(`guarantee.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ck-text-muted">
                    {t(`guarantee.${key}.desc`)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden border border-ck-border bg-ck-surface px-8 py-16 sm:px-16">
            <div className="absolute right-0 top-0 h-40 w-40 bg-ck-red/10 blur-[80px]" />
            <div className="relative flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-ck-text sm:text-4xl">
                  {t('servicesPage.ctaTitle')}
                </h2>
                <p className="mt-3 text-sm text-ck-text-muted">
                  {t('servicesPage.ctaSubtitle')}
                </p>
              </div>
              <Link
                href="/offerte"
                className="shrink-0 bg-ck-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover"
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
