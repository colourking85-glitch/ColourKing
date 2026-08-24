import {
  Wrench,
  FileText,
  CalendarDays,
  Receipt,
  Package,
  Inbox,
} from 'lucide-react';

const QUICK_STATS = [
  { label: 'Actieve opdrachten', value: '—', icon: Wrench, color: 'text-cyan-400' },
  { label: 'Open offertes', value: '—', icon: FileText, color: 'text-green-400' },
  { label: 'Afspraken vandaag', value: '—', icon: CalendarDays, color: 'text-indigo-400' },
  { label: 'Onbetaalde facturen', value: '—', icon: Receipt, color: 'text-amber-400' },
  { label: 'Blokkerende onderdelen', value: '—', icon: Package, color: 'text-orange-400' },
  { label: 'Nieuwe leads', value: '—', icon: Inbox, color: 'text-purple-400' },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-white">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-ck-muted">
          Welkom bij Colourking — Overzicht van vandaag
        </p>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {QUICK_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-4"
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={stat.color} />
                <span className="text-[11px] font-medium uppercase tracking-wide text-ck-muted">
                  {stat.label}
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-white">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder sections */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Opdrachten per fase
          </h3>
          <div className="flex h-48 items-center justify-center text-sm text-ck-muted">
            Werkplaatsbord wordt geladen na Sprint 2
          </div>
        </div>
        <div className="rounded-xl border border-ck-dark-border bg-ck-dark-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Komende afspraken
          </h3>
          <div className="flex h-48 items-center justify-center text-sm text-ck-muted">
            Afsprakenkalender wordt geladen na Sprint 8
          </div>
        </div>
      </div>
    </div>
  );
}
