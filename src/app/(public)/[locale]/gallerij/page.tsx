'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import { BeforeAfterSlider } from '@/components/public/BeforeAfterSlider';

type FilterKey = 'all' | 'bodyRepair' | 'paint' | 'spotRepair';

const placeholderProjects = [
  {
    id: 1,
    category: 'bodyRepair' as const,
    titleKey: 'gallery.jobs.sidePanel',
    vehicleKey: 'gallery.jobs.vehiclePlaceholder',
    workKey: 'gallery.jobs.workBodyPaint',
    daysKey: 'gallery.jobs.daysPlaceholder',
    handlingKey: 'gallery.jobs.handlingInsurance',
  },
  {
    id: 2,
    category: 'paint' as const,
    titleKey: 'gallery.jobs.hailDamage',
    vehicleKey: 'gallery.jobs.vehiclePlaceholder',
    workKey: 'gallery.jobs.workPDR',
    daysKey: 'gallery.jobs.daysPlaceholder',
    handlingKey: 'gallery.jobs.handlingPrivate',
  },
  {
    id: 3,
    category: 'spotRepair' as const,
    titleKey: 'gallery.jobs.frontDamage',
    vehicleKey: 'gallery.jobs.vehiclePlaceholder',
    workKey: 'gallery.jobs.workFront',
    daysKey: 'gallery.jobs.daysPlaceholder',
    handlingKey: 'gallery.jobs.handlingInsurance',
  },
  {
    id: 4,
    category: 'spotRepair' as const,
    titleKey: 'gallery.jobs.scratchRepair',
    vehicleKey: 'gallery.jobs.vehiclePlaceholder',
    workKey: 'gallery.jobs.workSpot',
    daysKey: 'gallery.jobs.hoursPlaceholder',
    handlingKey: 'gallery.jobs.handlingPrivate',
  },
  {
    id: 5,
    category: 'bodyRepair' as const,
    titleKey: 'gallery.jobs.rustRepair',
    vehicleKey: 'gallery.jobs.vehiclePlaceholder',
    workKey: 'gallery.jobs.workRust',
    daysKey: 'gallery.jobs.daysPlaceholder',
    handlingKey: 'gallery.jobs.handlingPrivate',
  },
  {
    id: 6,
    category: 'paint' as const,
    titleKey: 'gallery.jobs.fullRespray',
    vehicleKey: 'gallery.jobs.vehiclePlaceholder',
    workKey: 'gallery.jobs.workFull',
    daysKey: 'gallery.jobs.daysPlaceholder',
    handlingKey: 'gallery.jobs.handlingPrivate',
  },
];

const filterKeys: FilterKey[] = ['all', 'bodyRepair', 'paint', 'spotRepair'];

export default function GalleryPage() {
  const t = useTranslations('pub');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered =
    activeFilter === 'all'
      ? placeholderProjects
      : placeholderProjects.filter((p) => p.category === activeFilter);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-32 sm:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-ck-red/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            {t('beforeAfter.eyebrow')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-ck-text sm:text-5xl lg:text-6xl">
            {t('gallery.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ck-text-muted">
            {t('gallery.subtitle')}
          </p>
        </div>
      </section>

      {/* Before/After showcase */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal>
            <BeforeAfterSlider
              beforeLabel={t('gallery.before')}
              afterLabel={t('gallery.after')}
              ariaLabel={t('gallery.compareLabel')}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="px-6">
        <div className="mx-auto flex max-w-7xl gap-px overflow-x-auto bg-ck-border">
          {filterKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`whitespace-nowrap px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                activeFilter === key
                  ? 'bg-ck-red text-white'
                  : 'bg-ck-bg text-ck-text-muted hover:text-ck-text'
              }`}
            >
              {t(`gallery.filters.${key}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Portfolio job cards */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <p className="py-20 text-center text-sm text-ck-text-muted">
              {t('gallery.empty')}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project, i) => (
                <ScrollReveal key={project.id} delay={Math.min(i, 4) * 45}>
                  <article className="group flex flex-col overflow-hidden rounded-xl border border-ck-border bg-ck-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-ck-red/40 hover:shadow-lg">
                    {/* Thumbnail */}
                    <div className="relative grid aspect-[16/10] place-items-center border-b border-ck-border bg-gradient-to-br from-ck-surface to-ck-bg">
                      <span className="absolute left-3 top-3 rounded-md bg-sky-600/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                        {t('gallery.jobs.placeholder')}
                      </span>
                      <span className="text-center font-mono text-[11px] uppercase leading-7 tracking-[0.14em] text-ck-text-muted">
                        {t('gallery.jobs.thumbLabel')}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <p className="font-mono text-[11.5px] tracking-[0.12em] text-ck-text-muted">
                        {t('gallery.jobs.dossier', { n: String(project.id).padStart(4, '0') })}
                      </p>
                      <h3 className="font-heading text-lg font-bold tracking-tight text-ck-text">
                        {t(project.titleKey)}
                      </h3>

                      {/* Meta grid */}
                      <div className="mt-1 divide-y divide-ck-border text-sm">
                        {[
                          { label: t('gallery.jobs.metaVehicle'), value: t(project.vehicleKey) },
                          { label: t('gallery.jobs.metaWork'), value: t(project.workKey) },
                          { label: t('gallery.jobs.metaDuration'), value: t(project.daysKey) },
                          { label: t('gallery.jobs.metaHandling'), value: t(project.handlingKey) },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-3 py-2">
                            <span className="text-ck-text-muted">{row.label}</span>
                            <b className="font-mono text-[13.5px] font-semibold tabular-nums text-ck-text">
                              {row.value}
                            </b>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-1.5">
                        <span className="border-b border-ck-red/30 pb-0.5 font-mono text-xs uppercase tracking-[0.08em] text-ck-red transition-colors hover:border-ck-red">
                          {t('gallery.jobs.viewDossier')}
                        </span>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* Gallery CTA strip */}
          <ScrollReveal>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-ck-border bg-ck-surface px-7 py-6">
              <p className="max-w-xl text-sm text-ck-text-muted">
                {t('gallery.ctaStrip')}
              </p>
              <Link
                href="/offerte"
                className="shrink-0 bg-ck-red px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover"
              >
                {t('hero.ctaQuote')}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden border border-ck-border bg-ck-surface px-8 py-16 sm:px-16">
            <div className="absolute right-0 top-0 h-40 w-40 bg-ck-red/10 blur-[80px]" />
            <div className="relative flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-ck-text">
                  {t('cta.title')}
                </h2>
                <p className="mt-3 text-sm text-ck-text-muted">
                  {t('cta.subtitle')}
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 bg-ck-red px-8 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-ck-red-hover"
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
