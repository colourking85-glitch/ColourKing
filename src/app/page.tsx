import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ck-dark">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-ck-red">
          <span className="font-display text-3xl font-bold text-white">CK</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-white">
          Colourking
        </h1>
        <p className="mt-2 text-lg text-ck-muted">
          Vakkundige lakschadeverstelling — Amsterdam
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/app"
            className="rounded-lg bg-ck-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ck-red-hover"
          >
            Admin Console
          </Link>
          <a
            href="#"
            className="rounded-lg border border-ck-dark-border px-6 py-3 text-sm font-semibold text-ck-muted-light transition-colors hover:border-ck-muted/30 hover:text-white"
          >
            Offerte Aanvragen
          </a>
        </div>
      </div>
    </div>
  );
}
