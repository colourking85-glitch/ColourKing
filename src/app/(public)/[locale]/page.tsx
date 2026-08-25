import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });
  return {
    title: t('seo.homeTitle'),
    description: t('seo.homeDesc'),
  };
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'pub' });

  return (
    <>
      {/* Hero — full-screen with photo background */}
      <section className="relative flex min-h-screen items-end overflow-hidden pb-24">
        <Image
          src="/images/hero.webp"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
            {t('hero.eyebrow')}
          </p>
          <h1
            className="font-heading font-extrabold leading-[0.92] tracking-tight text-white"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
          >
            {t('hero.headline')}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 bg-[#E8364E] px-7 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 hover:bg-[#d02e44] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E8364E]/30"
            >
              <span>{t('hero.ctaQuote')}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/gallerij"
              className="inline-flex items-center gap-2 border border-white/30 px-7 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 hover:border-white/70 hover:bg-white/5"
            >
              <span>{t('hero.ctaGallery')}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-ck-border bg-ck-surface">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {([
              { value: 'yearsValue', label: 'yearsLabel' },
              { value: 'carsValue', label: 'carsLabel' },
              { value: 'customersValue', label: 'customersLabel' },
              { value: 'guaranteeValue', label: 'guaranteeLabel' },
            ] as const).map(({ value, label }) => (
              <div key={value} className="flex flex-col gap-1">
                <span
                  className="font-heading font-extrabold leading-none text-[#E8364E]"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
                >
                  {t(`stats.${value}`)}
                </span>
                <span className="text-sm font-medium uppercase tracking-widest text-ck-text-muted">
                  {t(`stats.${label}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services — editorial alternating layout */}
      <section className="py-24 bg-ck-dark">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
              {t('servicesOverview.eyebrow')}
            </p>
            <h2
              className="font-heading font-extrabold leading-tight text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('servicesOverview.title')}
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Service 1 — image left, text right */}
            <div className="grid grid-cols-1 overflow-hidden border border-ck-border transition-colors duration-300 hover:border-[#E8364E]/40 md:grid-cols-2">
              <div className="relative h-64 overflow-hidden md:h-auto md:min-h-[260px]">
                <Image
                  src="/images/service-scratch-repair.webp"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
              <div className="flex flex-col justify-center bg-ck-surface p-8 md:p-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                  {t('homeServices.one.eyebrow')}
                </p>
                <h3
                  className="font-heading font-bold text-white"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
                >
                  {t('homeServices.one.title')}
                </h3>
                <p className="mt-4 leading-relaxed text-ck-text-muted">
                  {t('homeServices.one.description')}
                </p>
                <p className="mt-4 border-l-2 border-[#E8364E] pl-4 text-sm text-ck-text-faint">
                  {t('homeServices.one.detail')}
                </p>
              </div>
            </div>

            {/* Service 2 — text left, image right (reversed) */}
            <div className="grid grid-cols-1 overflow-hidden border border-ck-border transition-colors duration-300 hover:border-[#E8364E]/40 md:ml-12 md:grid-cols-2">
              <div className="flex flex-col justify-center bg-ck-surface p-8 order-2 md:order-1 md:p-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                  {t('homeServices.two.eyebrow')}
                </p>
                <h3
                  className="font-heading font-bold text-white"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
                >
                  {t('homeServices.two.title')}
                </h3>
                <p className="mt-4 leading-relaxed text-ck-text-muted">
                  {t('homeServices.two.description')}
                </p>
                <p className="mt-4 border-l-2 border-[#E8364E] pl-4 text-sm text-ck-text-faint">
                  {t('homeServices.two.detail')}
                </p>
              </div>
              <div className="relative h-64 overflow-hidden order-1 md:order-2 md:h-auto md:min-h-[260px]">
                <Image
                  src="/images/service-dent-removal.webp"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
            </div>

            {/* Service 3 — image left, text right */}
            <div className="grid grid-cols-1 overflow-hidden border border-ck-border transition-colors duration-300 hover:border-[#E8364E]/40 md:mr-12 md:grid-cols-2">
              <div className="relative h-64 overflow-hidden md:h-auto md:min-h-[260px]">
                <Image
                  src="/images/service-respray.webp"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
              <div className="flex flex-col justify-center bg-ck-surface p-8 md:p-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                  {t('homeServices.three.eyebrow')}
                </p>
                <h3
                  className="font-heading font-bold text-white"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
                >
                  {t('homeServices.three.title')}
                </h3>
                <p className="mt-4 leading-relaxed text-ck-text-muted">
                  {t('homeServices.three.description')}
                </p>
                <p className="mt-4 border-l-2 border-[#E8364E] pl-4 text-sm text-ck-text-faint">
                  {t('homeServices.three.detail')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="border-y border-ck-border bg-ck-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                {t('beforeAfter.eyebrow')}
              </p>
              <h2
                className="font-heading font-extrabold leading-tight text-white"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {t('beforeAfter.heading')}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-ck-text-muted">
                {t('beforeAfter.subline')}
              </p>
              <div className="mt-8">
                <Link
                  href="/gallerij"
                  className="inline-flex items-center gap-2 bg-[#E8364E] px-7 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 hover:bg-[#d02e44] hover:-translate-y-0.5"
                >
                  <span>{t('beforeAfter.ctaLabel')}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden border border-ck-border">
              <div className="relative flex h-80">
                <div className="relative flex-1">
                  <Image
                    src="/images/before-after.webp"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    style={{ filter: 'grayscale(0.6) brightness(0.7)' }}
                  />
                  <span className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                    {t('gallery.before')}
                  </span>
                </div>
                <div className="w-px bg-white/30" />
                <div className="relative flex-1">
                  <Image
                    src="/images/before-after.webp"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                  <span className="absolute bottom-4 right-4 bg-[#E8364E] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                    {t('gallery.after')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-ck-dark">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
              {t('testimonialsSection.eyebrow')}
            </p>
            <h2
              className="font-heading font-extrabold leading-tight text-white"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('testimonialsSection.title')}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {(['one', 'two', 'three'] as const).map((key) => (
              <div key={key} className="border border-ck-border bg-ck-surface p-8">
                <div className="mb-4 text-[#E8364E]">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p className="text-sm leading-relaxed text-ck-text-muted">
                  &ldquo;{t(`testimonials.${key}.quote`)}&rdquo;
                </p>
                <div className="mt-6">
                  <p className="text-sm font-medium text-white">
                    {t(`testimonials.${key}.name`)}
                  </p>
                  <p className="text-xs text-ck-text-faint">
                    {t(`testimonials.${key}.role`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — prominent with phone number */}
      <section className="relative overflow-hidden py-28">
        <Image
          src="/images/dark.png"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8364E]">
                {t('cta.eyebrow')}
              </p>
              <h2
                className="font-heading font-extrabold leading-tight text-white"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
              >
                {t('cta.title')}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/70">
                {t('cta.subtitle')}
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <a href="tel:+31681631020" className="group flex items-center gap-4">
                <span
                  className="font-heading font-extrabold text-white transition-colors duration-200 group-hover:text-[#E8364E]"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.02em' }}
                >
                  {t('footer.phone')}
                </span>
              </a>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-[#E8364E] px-7 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 hover:bg-[#d02e44] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E8364E]/30"
                >
                  <span>{t('cta.button')}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
