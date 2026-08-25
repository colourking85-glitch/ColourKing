'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type FilterKey = 'all' | 'bodyRepair' | 'paint' | 'spotRepairFilter';

const placeholderProjects = [
  { id: 1, category: 'bodyRepair' as const },
  { id: 2, category: 'paint' as const },
  { id: 3, category: 'spotRepairFilter' as const },
  { id: 4, category: 'bodyRepair' as const },
  { id: 5, category: 'paint' as const },
  { id: 6, category: 'spotRepairFilter' as const },
];

const filterKeys: FilterKey[] = ['all', 'bodyRepair', 'paint', 'spotRepairFilter'];

export default function GalleryPage() {
  const t = useTranslations('pub');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered =
    activeFilter === 'all'
      ? placeholderProjects
      : placeholderProjects.filter((p) => p.category === activeFilter);

  return (
    <>
      {/* Header */}
      <section className="px-4 pb-8 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-medium text-white sm:text-4xl">
            {t('gallery.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6b6b80]">
            {t('gallery.subtitle')}
          </p>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {filterKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`whitespace-nowrap rounded-[10px] px-4 py-2 text-sm transition-colors ${
                activeFilter === key
                  ? 'bg-[#E8364E] text-white'
                  : 'border border-[#1e1e2a] bg-[#12121a] text-[#6b6b80] hover:text-white'
              }`}
            >
              {t(`gallery.${key}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          {filtered.length === 0 ? (
            <p className="py-20 text-center text-sm text-[#6b6b80]">
              {t('gallery.empty')}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] overflow-hidden"
                >
                  {/* Placeholder before/after */}
                  <div className="grid grid-cols-2">
                    <div className="flex aspect-[4/3] items-center justify-center bg-[#0a0a0f]">
                      <span className="text-xs text-[#6b6b80]">
                        {t('gallery.before')}
                      </span>
                    </div>
                    <div className="flex aspect-[4/3] items-center justify-center bg-[#12121a] border-l border-[#1e1e2a]">
                      <span className="text-xs text-[#6b6b80]">
                        {t('gallery.after')}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-white">
                      {t('gallery.placeholder', { number: project.id })}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6b6b80]">
                      {t(`gallery.${project.category}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
