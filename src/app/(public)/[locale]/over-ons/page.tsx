import { getTranslations } from 'next-intl/server';

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
      {/* Header */}
      <section className="px-4 pb-8 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-medium text-white sm:text-4xl">
            {t('about.storyTitle')}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6b6b80]">
            {t('seo.aboutDesc')}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6 sm:p-8">
            <h2 className="text-xl font-medium text-white">
              {t('about.storyTitle')}
            </h2>
            <p className="mt-4 text-sm text-[#6b6b80] leading-relaxed">
              {t('about.storyText')}
            </p>
          </div>
        </div>
      </section>

      {/* Workshop */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6 sm:p-8">
            <h2 className="text-xl font-medium text-white">
              {t('about.workshopTitle')}
            </h2>
            <p className="mt-4 text-sm text-[#6b6b80] leading-relaxed">
              {t('about.storyText')}
            </p>
          </div>
        </div>
      </section>

      {/* Team placeholders */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-xl font-medium text-white">
              {t('about.teamTitle')}
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6 text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0a0a0f] text-2xl text-[#6b6b80]">
                  &#9786;
                </div>
                <p className="mt-4 text-sm font-medium text-white">
                  {t('about.teamMember')} {n}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-medium text-white">
            {t('about.timelineTitle')}
          </h2>
          <div className="mt-8 flex flex-col gap-4">
            {milestones.map((m) => (
              <div
                key={m.year}
                className="flex items-center gap-4 rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4"
              >
                <span className="text-sm font-medium text-[#E8364E]">{m.year}</span>
                <div>
                  <p className="text-sm font-medium text-white">{m.title}</p>
                  <p className="text-xs text-[#6b6b80]">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications placeholder */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6 sm:p-8 text-center">
            <h2 className="text-xl font-medium text-white">
              {t('about.certificationsTitle')}
            </h2>
          </div>
        </div>
      </section>
    </>
  );
}
