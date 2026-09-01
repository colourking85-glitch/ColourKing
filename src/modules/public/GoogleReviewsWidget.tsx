'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ReviewConfig {
  google_review_score: string;
  google_review_count: number;
  google_place_id?: string;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.min(1, Math.max(0, score - (i - 1)));
        return (
          <svg key={i} className="h-5 w-5" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`star-${i}`}>
                <stop offset={`${fill * 100}%`} stopColor="var(--color-ck-red, #dc2626)" />
                <stop offset={`${fill * 100}%`} stopColor="var(--color-ck-border, #333)" />
              </linearGradient>
            </defs>
            <path
              d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.28l-4.77 2.44.91-5.33L2.27 6.62l5.34-.78L10 1z"
              fill={`url(#star-${i})`}
            />
          </svg>
        );
      })}
    </div>
  );
}

export default function GoogleReviewsWidget() {
  const t = useTranslations('pub.reviews');
  const [config, setConfig] = useState<ReviewConfig | null>(null);

  useEffect(() => {
    fetch('/api/public/site-config')
      .then(r => r.json())
      .then(data => {
        const c = data.certifications;
        if (c?.google_review_score && c?.google_review_count > 0) {
          setConfig({
            google_review_score: c.google_review_score,
            google_review_count: c.google_review_count,
            google_place_id: c.google_place_id,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!config) return null;

  const score = parseFloat(config.google_review_score);

  return (
    <section className="border-y border-ck-border bg-ck-surface py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            {t('eyebrow')}
          </p>
          <h2
            className="font-heading font-extrabold leading-tight text-ck-text"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
          >
            {t('title')}
          </h2>

          <div className="mt-8 flex flex-col items-center gap-3">
            <StarRating score={score} />
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-4xl font-bold text-ck-text">{config.google_review_score}</span>
              <span className="text-sm text-ck-text-muted">/ 5</span>
            </div>
            <p className="text-sm text-ck-text-muted">
              {t('basedOn', { count: config.google_review_count })}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-xs font-medium text-ck-text-muted">Google Reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
}
