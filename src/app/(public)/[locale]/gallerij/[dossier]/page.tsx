import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { BeforeAfterSlider } from '@/components/public/BeforeAfterSlider';
import { getPublishedDossier } from '@/modules/portfolio/public';
import { localized, beforeAfterPairs } from '@/modules/portfolio/display';
import { DOSSIER_NUMBER_RE } from '@/modules/portfolio/constants';

type Params = { params: { locale: string; dossier: string } };

async function load(dossier: string) {
  if (!DOSSIER_NUMBER_RE.test(dossier)) return null;
  return getPublishedDossier(dossier).catch(() => null);
}

export async function generateMetadata({ params: { locale, dossier } }: Params) {
  const d = await load(dossier);
  if (!d) return {};
  const tp = await getTranslations({ locale, namespace: 'portfolio' });
  const title = localized(d, 'title', locale);
  const summary = localized(d, 'summary', locale);
  return {
    title: `${title} — ${tp('dossierLabel')} ${d.dossier_number} | Colourking`,
    description: summary || [d.vehicle, tp(`category.${d.category}`)].filter(Boolean).join(' · '),
    openGraph: d.cover ? { images: [{ url: d.cover.url, width: d.cover.width ?? undefined, height: d.cover.height ?? undefined }] } : undefined,
  };
}

export default async function DossierPage({ params: { locale, dossier } }: Params) {
  const d = await load(dossier);
  if (!d) notFound();

  const t = await getTranslations({ locale, namespace: 'pub' });
  const tp = await getTranslations({ locale, namespace: 'portfolio' });
  const title = localized(d, 'title', locale);
  const summary = localized(d, 'summary', locale);
  const pairs = beforeAfterPairs(d.photos);
  const pairedIds = new Set(pairs.flatMap(p => [p.before.id, p.after.id]));
  const others = d.photos.filter(p => !pairedIds.has(p.id));
  const alt = (p: (typeof d.photos)[number]) => (p[`alt_${locale}` as 'alt_nl'] ?? p.alt_nl) || title;

  const specs = [
    { label: t('gallery.jobs.metaVehicle'), value: d.vehicle },
    { label: tp('buildYear'), value: d.build_year ? String(d.build_year) : null },
    { label: tp('colour'), value: [d.colour_name, d.paint_code].filter(Boolean).join(' · ') || null },
    { label: tp('categoryLabel'), value: tp(`category.${d.category}`) },
    { label: t('gallery.jobs.metaWork'), value: d.work_items.map(w => tp(`work.${w}`)).join(', ') || null },
    { label: t('gallery.jobs.metaDuration'), value: d.duration_working_days != null ? tp('workingDays', { n: d.duration_working_days }) : null },
    { label: t('gallery.jobs.metaHandling'), value: d.handling ? tp(`handling.${d.handling}`) : null },
  ].filter((s): s is { label: string; value: string } => !!s.value);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    identifier: d.dossier_number,
    description: summary || undefined,
    image: d.cover?.url,
    datePublished: d.published_at ?? undefined,
    creator: { '@type': 'AutoBodyShop', name: 'Colour King' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="px-6 pb-10 pt-32 sm:pt-40">
        <div className="mx-auto max-w-5xl">
          <Link href="/gallerij" className="font-mono text-xs uppercase tracking-[0.12em] text-ck-text-muted hover:text-ck-red">
            ← {t('gallery.title')}
          </Link>
          <p className="mt-6 font-mono text-xs tracking-[0.14em] text-ck-red">
            {tp('dossierLabel')} {d.dossier_number}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-ck-text sm:text-5xl">{title}</h1>
          {summary && <p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-ck-text-muted">{summary}</p>}
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {pairs.map(pair => (
              <BeforeAfterSlider
                key={pair.before.id}
                beforeLabel={t('gallery.before')}
                afterLabel={t('gallery.after')}
                ariaLabel={t('gallery.compareLabel')}
                beforeSrc={pair.before.url}
                afterSrc={pair.after.url}
              />
            ))}
            {others.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {others.map(p => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.url} alt={alt(p)} width={p.width ?? undefined} height={p.height ?? undefined} loading="lazy" className="h-auto w-full rounded-xl border border-ck-border" />
                ))}
              </div>
            )}
          </div>

          <aside className="h-fit rounded-xl border border-ck-border bg-ck-surface p-5">
            <dl className="divide-y divide-ck-border text-sm">
              {specs.map(s => (
                <div key={s.label} className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ck-text-muted">{s.label}</dt>
                  <dd className="text-right font-semibold text-ck-text">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-col gap-2">
              <Link href="/offerte" className="bg-ck-red px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider text-white hover:bg-ck-red-hover">
                {t('hero.ctaQuote')}
              </Link>
              <Link href="/afspraak" className="border border-ck-border px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider text-ck-text hover:border-ck-red">
                {tp('bookAppointment')}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
