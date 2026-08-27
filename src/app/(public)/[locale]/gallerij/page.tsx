'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

type FilterKey = 'all' | 'bodyRepair' | 'paint' | 'spotRepair';

const placeholderProjects = [
  { id: 1, category: 'bodyRepair' as const },
  { id: 2, category: 'paint' as const },
  { id: 3, category: 'spotRepair' as const },
  { id: 4, category: 'bodyRepair' as const },
  { id: 5, category: 'paint' as const },
  { id: 6, category: 'spotRepair' as const },
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8364E]/8 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('beforeAfter.eyebrow')}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t('gallery.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/60">
            {t('gallery.subtitle')}
          </p>
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
                  ? 'bg-[#E8364E] text-white'
                  : 'bg-ck-dark text-white/50 hover:text-white'
              }`}
            >
              {t(`gallery.filters.${key}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <p className="py-20 text-center text-sm text-white/40">
              {t('gallery.empty')}
            </p>
          ) : (
            <div className="grid gap-px bg-ck-border sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="group bg-ck-dark overflow-hidden"
                >
                  <div className="grid grid-cols-2">
                    <div className="flex aspect-[4/3] items-center justify-center bg-ck-surface">
                      <span className="text-xs text-white/30">
                        {t('gallery.before')}
                      </span>
                    </div>
                    <div className="flex aspect-[4/3] items-center justify-center border-l border-ck-border bg-ck-dark">
                      <span className="text-xs text-white/30">
                        {t('gallery.after')}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="font-heading text-sm font-bold uppercase tracking-tight text-white">
                      {t('gallery.project', { n: project.id })}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {t(`gallery.filters.${project.category}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
