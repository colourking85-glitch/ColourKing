'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import { BeforeAfterSlider } from '@/components/public/BeforeAfterSlider';
import { localized, beforeAfterPairs, PUBLIC_FILTER } from '@/modules/portfolio/display';
import type { PublicDossier } from '@/modules/portfolio/public';

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

type Card = {
  key: string;
  category: Exclude<FilterKey, 'all'>;
  href: string | null;
  dossier: string;
  title: string;
  coverUrl: string | null;
  coverAlt: string;
  rows: { label: string; value: string }[];
  isExample: boolean;
};

export default function GalleryPage() {
  const t = useTranslations('pub');
  const tp = useTranslations('portfolio');
  const locale = useLocale();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [dossiers, setDossiers] = useState<PublicDossier[] | null>(null);

  useEffect(() => {
    fetch('/api/public/portfolio')
      .then((r) => (r.ok ? r.json() : []))
      .then(setDossiers)
      .catch(() => setDossiers([]));
  }, []);

  // Real, published dossiers; the examples only show until the first one is live
  const cards: Card[] = dossiers && dossiers.length > 0
    ? dossiers.map((d) => ({
        key: d.id,
        category: PUBLIC_FILTER[d.category] ?? 'bodyRepair',
        href: `/gallerij/${d.dossier_number}`,
        dossier: d.dossier_number,
        title: localized(d, 'title', locale),
        coverUrl: d.cover?.url ?? null,
        coverAlt: (d.cover && (d.cover[`alt_${locale}` as 'alt_nl'] ?? d.cover.alt_nl)) || localized(d, 'title', locale),
        isExample: false,
        rows: [
          { label: t('gallery.jobs.metaVehicle'), value: [d.vehicle, d.build_year].filter(Boolean).join(' · ') || '—' },
          { label: t('gallery.jobs.metaWork'), value: d.work_items.slice(0, 2).map((w) => tp(`work.${w}`)).join(' + ') || tp(`category.${d.category}`) },
          { label: t('gallery.jobs.metaDuration'), value: d.duration_working_days != null ? tp('workingDays', { n: d.duration_working_days }) : '—' },
          { label: t('gallery.jobs.metaHandling'), value: d.handling ? tp(`handling.${d.handling}`) : '—' },
        ],
      }))
    : dossiers === null
      ? []
      : placeholderProjects.map((p) => ({
          key: String(p.id),
          category: p.category,
          href: null,
          dossier: t('gallery.jobs.dossier', { n: String(p.id).padStart(4, '0') }),
          title: t(p.titleKey),
          coverUrl: null,
          coverAlt: '',
          isExample: true,
          rows: [
            { label: t('gallery.jobs.metaVehicle'), value: t(p.vehicleKey) },
            { label: t('gallery.jobs.metaWork'), value: t(p.workKey) },
            { label: t('gallery.jobs.metaDuration'), value: t(p.daysKey) },
            { label: t('gallery.jobs.metaHandling'), value: t(p.handlingKey) },
          ],
        }));

  const filtered = activeFilter === 'all' ? cards : cards.filter((c) => c.category === activeFilter);

  const showcase = dossiers?.find((d) => d.featured && beforeAfterPairs(d.photos).length) ??
    dossiers?.find((d) => beforeAfterPairs(d.photos).length);
  const showcasePair = showcase ? beforeAfterPairs(showcase.photos)[0] : null;

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
              beforeSrc={showcasePair?.before.url}
              afterSrc={showcasePair?.after.url}
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
              {filtered.map((card, i) => {
                const body = (
                  <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-ck-border bg-ck-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-ck-red/40 hover:shadow-lg">
                    {/* Thumbnail */}
                    <div className="relative grid aspect-[16/10] place-items-center overflow-hidden border-b border-ck-border bg-gradient-to-br from-ck-surface to-ck-bg">
                      {card.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.coverUrl} alt={card.coverAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      ) : (
                        <span className="text-center font-mono text-[11px] uppercase leading-7 tracking-[0.14em] text-ck-text-muted">
                          {t('gallery.jobs.thumbLabel')}
                        </span>
                      )}
                      {card.isExample && (
                        <span className="absolute left-3 top-3 rounded-md bg-sky-600/80 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                          {t('gallery.jobs.placeholder')}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <p className="font-mono text-[11.5px] tracking-[0.12em] text-ck-text-muted">
                        {card.isExample ? card.dossier : `${tp('dossierLabel')} ${card.dossier}`}
                      </p>
                      <h3 className="font-heading text-lg font-bold tracking-tight text-ck-text">
                        {card.title}
                      </h3>

                      {/* Meta grid */}
                      <div className="mt-1 divide-y divide-ck-border text-sm">
                        {card.rows.map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-3 py-2">
                            <span className="text-ck-text-muted">{row.label}</span>
                            <b className="text-right font-mono text-[13.5px] font-semibold tabular-nums text-ck-text">
                              {row.value}
                            </b>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-1.5">
                        <span className="border-b border-ck-red/30 pb-0.5 font-mono text-xs uppercase tracking-[0.08em] text-ck-red transition-colors group-hover:border-ck-red">
                          {t('gallery.jobs.viewDossier')}
                        </span>
                      </div>
                    </div>
                  </article>
                );
                return (
                  <ScrollReveal key={card.key} delay={Math.min(i, 4) * 45}>
                    {card.href ? <Link href={card.href} className="block h-full">{body}</Link> : body}
                  </ScrollReveal>
                );
              })}
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
