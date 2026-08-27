import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });
  return {
    title: t('seo.aboutTitle'),
    description: t('seo.aboutDesc'),
  };
}

export default async function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });

  const milestones = [
    { year: t('about.milestones.one.year'), title: t('about.milestones.one.title'), desc: t('about.milestones.one.desc') },
    { year: t('about.milestones.two.year'), title: t('about.milestones.two.title'), desc: t('about.milestones.two.desc') },
    { year: t('about.milestones.three.year'), title: t('about.milestones.three.title'), desc: t('about.milestones.three.desc') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8364E]/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('about.storyTitle')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('seo.aboutTitle').replace(' — Colour King', '')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
            {t('seo.aboutDesc')}
          </p>
        </div>
      </section>

      {/* Story + Workshop two-column */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl grid gap-px bg-ck-border lg:grid-cols-2">
          <div className="bg-ck-dark p-8 sm:p-12">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
              {t('about.storyTitle')}
            </h2>
            <p className="mt-6 text-sm leading-[1.8] text-white/60">
              {t('about.storyText')}
            </p>
          </div>
          <div className="bg-ck-dark p-8 sm:p-12">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
              {t('about.workshopTitle')}
            </h2>
            <p className="mt-6 text-sm leading-[1.8] text-white/60">
              {t('about.storyText')}
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('about.timelineTitle')}
          </p>
          <div className="mt-10 grid gap-px bg-ck-border sm:grid-cols-3">
            {milestones.map((m) => (
              <div key={m.year} className="bg-ck-dark p-8">
                <span className="font-heading text-4xl font-bold text-[#E8364E]">
                  {m.year}
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold uppercase tracking-tight text-white">
                  {m.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('about.teamTitle')}
          </p>
          <div className="mt-10 grid gap-px bg-ck-border sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col items-center bg-ck-dark px-8 py-12">
                <div className="flex h-24 w-24 items-center justify-center border border-ck-border bg-ck-surface text-3xl text-white/20">
                  &#9786;
                </div>
                <p className="mt-6 font-heading text-lg font-bold uppercase tracking-tight text-white">
                  {t('about.teamMember')} {n}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="border border-ck-border bg-ck-surface px-8 py-12 text-center sm:px-16">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
              {t('about.certificationsTitle')}
            </h2>
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
                <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-white">
                  {t('cta.title')}
                </h2>
                <p className="mt-3 text-sm text-white/60">
                  {t('cta.subtitle')}
                </p>
              </div>
              <Link
                href="/offerte"
                className="shrink-0 bg-[#E8364E] px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#d02e44]"
              >
                {t('cta.button')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
