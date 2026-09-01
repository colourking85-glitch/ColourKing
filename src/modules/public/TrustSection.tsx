'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Certifications {
  bovag: boolean;
  rdw_apk: boolean;
  erkend_leerbedrijf: boolean;
  erkend_duurzaam: boolean;
  paint_system: string;
  insurer_partners: string;
  google_review_score: string;
  google_review_count: number;
  response_sla_hours: number;
  show_replacement_vehicle: boolean;
  show_pickup_delivery: boolean;
}

const CERT_ICONS: Record<string, string> = {
  bovag: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  rdw_apk: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  erkend_leerbedrijf: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  erkend_duurzaam: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
};

export default function TrustSection() {
  const t = useTranslations('pub.trust');
  const [certs, setCerts] = useState<Certifications | null>(null);

  useEffect(() => {
    fetch('/api/public/site-config')
      .then((r) => r.json())
      .then((data) => setCerts(data.certifications))
      .catch(() => {});
  }, []);

  if (!certs) return null;

  const badges = (['bovag', 'rdw_apk', 'erkend_leerbedrijf', 'erkend_duurzaam'] as const).filter(
    (k) => certs[k]
  );

  const extras: Array<{ label: string; value: string }> = [];
  if (certs.paint_system) extras.push({ label: t('paintSystem'), value: certs.paint_system });
  if (certs.insurer_partners) extras.push({ label: t('insurerPartners'), value: certs.insurer_partners });
  if (certs.show_replacement_vehicle) extras.push({ label: t('replacementVehicle'), value: '' });
  if (certs.show_pickup_delivery) extras.push({ label: t('pickupDelivery'), value: '' });

  const hasReviews = certs.google_review_score && certs.google_review_count > 0;
  const hasAnything = badges.length > 0 || extras.length > 0 || hasReviews;

  if (!hasAnything) return null;

  return (
    <section className="border-y border-ck-border bg-ck-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ck-red">
            {t('eyebrow')}
          </p>
          <h2
            className="font-heading font-extrabold leading-tight text-ck-text"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {t('title')}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((key) => (
            <div
              key={key}
              className="flex items-start gap-4 border border-ck-border p-6 transition-colors hover:border-ck-red/40"
            >
              <svg
                className="mt-0.5 h-6 w-6 shrink-0 text-ck-red"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={CERT_ICONS[key]} />
              </svg>
              <span className="text-sm font-medium text-ck-text">{t(key)}</span>
            </div>
          ))}

          {hasReviews && (
            <div className="flex items-start gap-4 border border-ck-border p-6 transition-colors hover:border-ck-red/40">
              <span className="mt-0.5 text-lg text-ck-red">&#9733;</span>
              <div>
                <p className="text-sm font-medium text-ck-text">
                  {t('reviewScore')}: {certs.google_review_score}/5
                </p>
                <p className="text-xs text-ck-text-muted">
                  {t('reviewCount', { count: certs.google_review_count })}
                </p>
              </div>
            </div>
          )}

          {extras.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 border border-ck-border p-6 transition-colors hover:border-ck-red/40"
            >
              <svg
                className="mt-0.5 h-6 w-6 shrink-0 text-ck-red"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-ck-text">{item.label}</p>
                {item.value && <p className="text-xs text-ck-text-muted">{item.value}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
