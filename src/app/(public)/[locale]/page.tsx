export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f]">
      <div className="mx-auto max-w-lg px-6 text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#E8364E] shadow-lg shadow-[#E8364E]/20">
          <span className="font-display text-4xl font-bold text-white">CK</span>
        </div>

        <h1 className="font-display text-5xl font-bold text-white">
          Colourking
        </h1>

        <p className="mt-3 text-lg text-[#6b6b80]">
          Vakkundige lakschadeherstel — Amsterdam
        </p>

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-[#E8364E]/30 to-transparent" />

        <div className="rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-8">
          <h2 className="text-xl font-bold text-white">Binnenkort online</h2>
          <p className="mt-2 text-sm text-[#6b6b80]">
            Wij werken aan een nieuwe website. Neem gerust contact met ons op.
          </p>

          <div className="mt-6 space-y-3 text-sm">
            <a
              href="tel:+31207372727"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1e1e2a] bg-[#0f0f17] px-4 py-3 text-white transition-colors hover:border-[#E8364E]/30"
            >
              <span className="text-[#E8364E]">&#9742;</span>
              020 - 737 27 27
            </a>
            <a
              href="mailto:info@colourking.nl"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1e1e2a] bg-[#0f0f17] px-4 py-3 text-white transition-colors hover:border-[#E8364E]/30"
            >
              <span className="text-[#E8364E]">&#9993;</span>
              info@colourking.nl
            </a>
          </div>
        </div>

        <p className="mt-8 text-xs text-[#3a3a50]">
          Colourking B.V. — Amsterdam
        </p>
      </div>
    </div>
  );
}
