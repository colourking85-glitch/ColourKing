'use client';

import { useState } from 'react';

/* ── Demo data (until time-tracking & material tables exist) ─────── */

const DEMO_KPIS = [
  { label: 'Afgeleverd', value: '7', unit: '/ 8 gepland', delta: 'Eén vastgehouden voor kleurcorrectie', tone: 'caution' as const, bar: 88 },
  { label: 'Arbeidsbenutting', value: '87', unit: '%', delta: '+4 pnt op 30-daags gemiddelde', tone: 'positive' as const, bar: 87 },
  { label: 'Efficiëntie', value: '112', unit: '%', delta: '46.4 u geproduceerd / 41.5 u geklokt', tone: 'positive' as const, bar: 93 },
  { label: 'Touch time ratio', value: '41', unit: '%', delta: 'Onder de 55% ondergrens', tone: 'critical' as const, bar: 41 },
  { label: 'Omzet geproduceerd', value: '€14.280', unit: '', delta: '+€1.140 boven plan', tone: 'positive' as const, bar: 96 },
  { label: 'WIP op locatie', value: '23', unit: 'voertuigen', delta: '6 boven cabine-doorvoer', tone: 'caution' as const, bar: 78 },
];

const DEMO_PHASES = [
  { name: 'Inname & calculatie', flow: '4 · 3 · 2', cap: 62, tone: 'positive' as const },
  { name: 'Demontage', flow: '3 · 4 · 2', cap: 68, tone: 'positive' as const },
  { name: 'Plaatwerk', flow: '4 · 3 · 6', cap: 81, tone: 'caution' as const },
  { name: 'Spuitvoorbereiding', flow: '3 · 3 · 4', cap: 74, tone: 'positive' as const },
  { name: 'Spuitcabine & bakken', flow: '3 · 2 · 5', cap: 95, tone: 'critical' as const },
  { name: 'Montage', flow: '2 · 3 · 3', cap: 58, tone: 'positive' as const },
  { name: 'QC & detail', flow: '3 · 3 · 1', cap: 44, tone: 'positive' as const },
];

const DEMO_HOURS = [
  { label: '14', h: 4.6 }, { label: '15', h: 5.2 }, { label: '16', h: 5.8 },
  { label: '17', h: 3.1 }, { label: '18', h: 2.4 }, { label: '19', h: 5.5 },
  { label: '20', h: 6.1 }, { label: '21', h: 5.4 }, { label: '22', h: 4.3 },
];

const DEMO_TECHS = [
  { name: 'Marek D.', role: 'Plaat & constructie', clocked: '7.5 u', produced: '9.2 u', eff: 123 },
  { name: 'Ines R.', role: 'Spuiter — cabine 1', clocked: '8.0 u', produced: '8.6 u', eff: 108 },
  { name: 'Anna S.', role: 'Montage & afwerking', clocked: '7.5 u', produced: '8.8 u', eff: 117 },
  { name: 'Tomas K.', role: 'Voorbereiding & afplakken', clocked: '7.0 u', produced: '6.3 u', eff: 90 },
  { name: 'Luca V.', role: 'Plaat — leerling', clocked: '6.5 u', produced: '5.4 u', eff: 83 },
];

const DEMO_EVENTS = [
  { time: '21:05', title: 'Cabine-overloop', detail: 'AB-712-KL 40 min vastgehouden — bakschema opgeschoven, twee opdrachten opnieuw ingedeeld.', tone: 'caution' as const },
  { time: '19:40', title: 'Kleurcorrectie IJ-674-TU', detail: '218 Attitude Black gezakt voor QC onder daglichtlamp. 3.2 u herwerk geboekt.', tone: 'critical' as const },
  { time: '18:15', title: 'Supplement goedgekeurd', detail: 'CD-455-MN — binnenscherm, +6.8 u en €625 onderdelen. Tweede supplement.', tone: 'caution' as const },
  { time: '16:50', title: 'Onderdeel ontvangen', detail: 'GH-231-RS voorbumper binnen; opdracht 1.5 dag eerder vrijgegeven.', tone: 'positive' as const },
  { time: '15:20', title: 'Idle time gesignaleerd', detail: 'Twee plaatwerkers 35 min onbenut — wachtend op cabine-vrijgave.', tone: 'caution' as const },
];

type VehicleData = {
  reg: string; model: string; colour: string; claim: string;
  phase: string; days: string; target: number; touch: string;
  status: string; tone: 'positive' | 'caution' | 'critical';
  supplements: number;
  kpis: [string, string, string, 'positive' | 'caution' | 'critical' | 'muted'][];
  timeline: [string, number, boolean][];
  costs: [string, string, string, string, 'positive' | 'caution' | 'critical' | 'muted'][];
};

const DEMO_VEHICLES: VehicleData[] = [
  { reg: 'AB-712-KL', model: 'Volkswagen Golf VIII', colour: 'LD7X Deep Black', claim: 'INS-40218', phase: 'Spuitcabine', days: '4.5', target: 5, touch: '44%', status: 'Op schema', tone: 'positive', supplements: 1,
    kpis: [['Doorlooptijd', '4.5 d', 'doel 5.0 d', 'positive'], ['Touch ratio', '44%', 'doel ≥ 55%', 'caution'], ['Calculatie-nauwk.', '96%', '2.1 u boven offerte', 'positive'], ['Bruto marge', '38%', 'doel 35%', 'positive']],
    timeline: [['Inname & calculatie', 1.2, true], ['Demontage', 2.0, true], ['Wacht onderdelen', 9.5, false], ['Plaatwerk', 7.4, true], ['Spuitvoorbereiding', 3.6, true], ['Cabinewachtrij', 4.2, false], ['Cabine & bakken', 2.4, true], ['Montage', 3.0, true]],
    costs: [['Arbeid 21.4 u', '1.240', '1.305', '+65', 'caution'], ['Onderdelen', '2.180', '2.410', '+230', 'critical'], ['Verf & materiaal', '430', '388', '−42', 'positive'], ['Uitbesteed (glas)', '0', '120', '+120', 'critical'], ['Totaal', '3.850', '4.223', '+373', 'critical']] },
  { reg: 'CD-455-MN', model: 'Škoda Octavia IV', colour: '9P9P Steel Grey', claim: 'INS-40190', phase: 'Plaatwerk', days: '6.0', target: 5, touch: '31%', status: 'Overschreden', tone: 'critical', supplements: 2,
    kpis: [['Doorlooptijd', '6.0 d', 'doel 5.0 d', 'critical'], ['Touch ratio', '31%', 'idle 4.1 d', 'critical'], ['Calculatie-nauwk.', '81%', '6.8 u boven offerte', 'critical'], ['Bruto marge', '24%', 'doel 35%', 'critical']],
    timeline: [['Inname & calculatie', 1.0, true], ['Demontage', 2.4, true], ['Wacht onderdelen', 18.0, false], ['Supplement goedkeuring', 6.5, false], ['Plaatwerk', 9.8, true]],
    costs: [['Arbeid 28.9 u', '1.410', '1.762', '+352', 'critical'], ['Onderdelen', '1.960', '2.585', '+625', 'critical'], ['Verf & materiaal', '510', '505', '−5', 'positive'], ['Uitbesteed', '0', '0', '—', 'muted'], ['Totaal', '3.880', '4.852', '+972', 'critical']] },
  { reg: 'EF-908-PQ', model: 'BMW 320d G20', colour: 'A96 Mineral White', claim: 'PRV-1182', phase: 'Montage', days: '3.0', target: 4, touch: '61%', status: 'Voorloopt', tone: 'positive', supplements: 0,
    kpis: [['Doorlooptijd', '3.0 d', 'doel 4.0 d', 'positive'], ['Touch ratio', '61%', 'doel ≥ 55%', 'positive'], ['Calculatie-nauwk.', '102%', '0.6 u onder offerte', 'positive'], ['Bruto marge', '44%', 'doel 35%', 'positive']],
    timeline: [['Inname & calculatie', 0.8, true], ['Demontage', 1.6, true], ['Wacht onderdelen', 3.2, false], ['Plaatwerk', 5.1, true], ['Spuitvoorbereiding', 2.8, true], ['Cabinewachtrij', 1.4, false], ['Cabine & bakken', 2.2, true], ['Montage', 2.4, true]],
    costs: [['Arbeid 15.9 u', '980', '941', '−39', 'positive'], ['Onderdelen', '1.640', '1.640', '—', 'muted'], ['Verf & materiaal', '360', '342', '−18', 'positive'], ['Uitbesteed', '0', '0', '—', 'muted'], ['Totaal', '2.980', '2.923', '−57', 'positive']] },
  { reg: 'GH-231-RS', model: 'Ford Transit Custom', colour: 'Frozen White', claim: 'FLT-7734', phase: 'Spuitvoorbereiding', days: '2.5', target: 6, touch: '52%', status: 'Op schema', tone: 'positive', supplements: 0,
    kpis: [['Doorlooptijd', '2.5 d', 'doel 6.0 d', 'positive'], ['Touch ratio', '52%', 'doel ≥ 55%', 'caution'], ['Calculatie-nauwk.', '94%', '1.4 u boven offerte', 'positive'], ['Bruto marge', '33%', 'doel 35%', 'caution']],
    timeline: [['Inname & calculatie', 1.4, true], ['Demontage', 3.0, true], ['Wacht onderdelen', 4.6, false], ['Plaatwerk', 8.2, true], ['Spuitvoorbereiding', 3.4, true]],
    costs: [['Arbeid 16.0 u', '1.120', '1.186', '+66', 'caution'], ['Onderdelen', '890', '890', '—', 'muted'], ['Verf & materiaal', '620', '671', '+51', 'caution'], ['Uitbesteed', '0', '0', '—', 'muted'], ['Totaal', '2.630', '2.747', '+117', 'caution']] },
  { reg: 'IJ-674-TU', model: 'Toyota Corolla Hybrid', colour: '218 Attitude Black', claim: 'INS-40233', phase: 'QC & detail', days: '5.5', target: 5, touch: '48%', status: 'Comeback risico', tone: 'caution', supplements: 1,
    kpis: [['Doorlooptijd', '5.5 d', 'doel 5.0 d', 'caution'], ['Touch ratio', '48%', 'doel ≥ 55%', 'caution'], ['Calculatie-nauwk.', '89%', '3.4 u boven offerte', 'caution'], ['Bruto marge', '29%', 'doel 35%', 'caution']],
    timeline: [['Inname & calculatie', 1.0, true], ['Demontage', 1.8, true], ['Wacht onderdelen', 11.0, false], ['Plaatwerk', 6.6, true], ['Spuitvoorbereiding', 3.0, true], ['Cabinewachtrij', 3.4, false], ['Cabine & bakken', 2.6, true], ['Herwerk — kleurmatch', 3.2, false]],
    costs: [['Arbeid 22.6 u', '1.180', '1.398', '+218', 'critical'], ['Onderdelen', '1.340', '1.405', '+65', 'caution'], ['Verf & materiaal', '470', '596', '+126', 'critical'], ['Uitbesteed', '0', '0', '—', 'muted'], ['Totaal', '2.990', '3.399', '+409', 'critical']] },
  { reg: 'KL-119-VW', model: 'Renault Clio V', colour: 'TENNJ Iron Blue', claim: 'PRV-1190', phase: 'Demontage', days: '0.5', target: 4, touch: '58%', status: 'Voorloopt', tone: 'positive', supplements: 0,
    kpis: [['Doorlooptijd', '0.5 d', 'doel 4.0 d', 'positive'], ['Touch ratio', '58%', 'doel ≥ 55%', 'positive'], ['Calculatie-nauwk.', '—', 'wacht op demontage', 'muted'], ['Bruto marge', '41%', 'geoffreerde marge', 'positive']],
    timeline: [['Inname & calculatie', 0.9, true], ['Demontage', 1.4, true]],
    costs: [['Arbeid 2.3 u', '760', '138', '−622', 'muted'], ['Onderdelen', '1.050', '0', 'in afwachting', 'muted'], ['Verf & materiaal', '290', '0', 'in afwachting', 'muted'], ['Uitbesteed', '0', '0', '—', 'muted'], ['Totaal', '2.100', '138', 'lopend', 'muted']] },
];

/* ── Tone helpers ─────────────────────────────────────────────────── */

const TONE_COLOR = {
  positive: 'text-emerald-400',
  caution: 'text-amber-400',
  critical: 'text-red-400',
  muted: 'text-ck-muted',
} as const;

const TONE_BG = {
  positive: 'bg-emerald-400/10',
  caution: 'bg-amber-400/10',
  critical: 'bg-red-400/10',
  muted: 'bg-white/5',
} as const;

const TONE_BAR = {
  positive: 'bg-emerald-400',
  caution: 'bg-amber-400',
  critical: 'bg-red-400',
  muted: 'bg-white/20',
} as const;

/* ── Component ────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [tab, setTab] = useState<'shift' | 'vehicle'>('shift');
  const [selectedVehicle, setSelectedVehicle] = useState(0);

  const v = DEMO_VEHICLES[selectedVehicle];
  const filteredTimeline = v.timeline.filter(s => s[1] > 0);
  const tlTotal = filteredTimeline.reduce((a, s) => a + s[1], 0) || 1;

  const tabs = [
    { id: 'shift' as const, label: 'Dienstoverzicht' },
    { id: 'vehicle' as const, label: 'Per voertuig' },
  ];

  return (
    <div className="space-y-6">
      {/* Alert strip */}
      <div className="flex items-center gap-3 rounded-[10px] border border-ck-red-border/50 bg-ck-red-bg px-4 py-2.5">
        <span className="text-ck-red">&#9888;</span>
        <span className="flex-1 text-[11px] text-ck-red-text">
          2 opdrachten wachten op onderdelen — Škoda Octavia (CD-455-MN) is over de planning
        </span>
        <button className="text-[11px] font-medium text-ck-red hover:underline">Bekijk →</button>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between border-b border-ck-border pb-4">
        <div>
          <h2 className="text-base font-medium tracking-tight text-ck-text">
            Body & paint prestaties
          </h2>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-ck-text-muted">
            <span>Dienst 2</span>
            <span className="text-ck-text-faint">·</span>
            <span>{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span className="text-ck-text-faint">·</span>
            <span>14:00 – 22:00</span>
            <span className="text-ck-text-faint">·</span>
            <span>11 technici op de vloer</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ck-green">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-ck-green" />
            Live · 6 min geleden
          </div>
          <div className="rounded-lg border border-ck-border bg-ck-surface-2 px-1 py-1 text-xs">
            <span className="rounded bg-ck-amber-bg px-2 py-1 text-[11px] font-medium text-ck-amber">Demo</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex gap-6 border-b border-ck-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 text-sm transition-colors -mb-px border-b-2 ${
              tab === t.id
                ? 'border-ck-red font-medium text-ck-text'
                : 'border-transparent text-ck-text-muted hover:text-ck-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── SHIFT OVERVIEW ────────────────────────────────────────── */}
      {tab === 'shift' && (
        <div className="space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
            {DEMO_KPIS.map(k => (
              <div key={k.label} className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-4">
                <div className="text-[10px] uppercase tracking-wider text-ck-text-muted">{k.label}</div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-mono text-xl font-medium tabular-nums tracking-tight text-ck-text leading-none">{k.value}</span>
                  {k.unit && <span className="text-[13px] text-ck-text-muted">{k.unit}</span>}
                </div>
                <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-ck-surface-3">
                  <div className={`h-full rounded-full ${TONE_BAR[k.tone]}`} style={{ width: `${k.bar}%` }} />
                </div>
                <div className={`mt-2 text-[12px] ${TONE_COLOR[k.tone]}`}>{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Flow + Hours produced */}
          <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            {/* Flow through shop */}
            <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-medium text-ck-text-2">Doorstroom werkplaats, deze dienst</h3>
                <span className="text-[11px] text-ck-muted">voertuigen in · uit · WIP</span>
              </div>
              <div className="mt-5 space-y-3">
                {DEMO_PHASES.map(p => (
                  <div key={p.name} className="grid grid-cols-[140px_1fr_96px_62px] items-center gap-3">
                    <div className={`text-[13px] font-medium ${p.tone === 'critical' ? 'text-ck-text' : 'text-ck-text-3'}`}>{p.name}</div>
                    <div className="h-[22px] overflow-hidden rounded bg-white/5">
                      <div className={`h-full rounded ${TONE_BAR[p.tone]}`} style={{ width: `${p.cap}%` }} />
                    </div>
                    <div className="font-mono text-[13px] tabular-nums tracking-wide text-ck-muted">{p.flow}</div>
                    <div className={`text-right font-mono text-[13px] font-medium tabular-nums ${TONE_COLOR[p.tone]}`}>{p.cap}%</div>
                  </div>
                ))}
              </div>
              {/* Bottleneck alert */}
              <div className="mt-5 flex items-start gap-3 rounded-lg bg-white/5 p-3">
                <span className="shrink-0 rounded bg-ck-red/20 px-2 py-0.5 text-[11px] font-medium text-ck-red">Bottleneck</span>
                <p className="text-[13px] leading-relaxed text-ck-muted-light">
                  Spuitcabine op 95% van bakcapaciteit terwijl plaatwerk 6 voertuigen vasthoudt. Twee van de vijf cabinecycli vanavond zijn enkelpaneelklussen — batch op kleurcode om ca. 1.4 uur cabinetijd vrij te maken.
                </p>
              </div>
            </section>

            {/* Hours produced per hour */}
            <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h3 className="text-xs font-medium text-ck-text-2">Uren geproduceerd per dienstuur</h3>
              <div className="mt-5 flex items-end gap-[5px]" style={{ height: 172 }}>
                {DEMO_HOURS.map(h => (
                  <div key={h.label} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
                    <div
                      className={`w-full rounded-t ${h.h < 3.5 ? 'bg-amber-400' : 'bg-ck-red'}`}
                      style={{ height: `${Math.round((h.h / 6.5) * 100)}%` }}
                    />
                    <span className="text-[11px] text-ck-muted">{h.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ck-border pt-4 text-[13px]">
                <span className="text-ck-muted">Geproduceerd 46.4 u op 41.5 u geklokt</span>
                <span className="font-mono font-medium tabular-nums text-emerald-400">112% efficiëntie</span>
              </div>
            </section>
          </div>

          {/* Technician output + Exceptions */}
          <div className="grid gap-5 xl:grid-cols-2">
            {/* Technician output */}
            <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h3 className="text-xs font-medium text-ck-text-2">Technici output</h3>
              <div className="mt-5 grid grid-cols-[1fr_64px_64px_120px] items-center gap-x-4 gap-y-3">
                <div className="text-[11px] font-medium uppercase tracking-wider text-ck-muted">Technicus</div>
                <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Geklokt</div>
                <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Geproduceerd</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-ck-muted">Efficiëntie</div>
                {DEMO_TECHS.map(t => {
                  const tone = t.eff >= 100 ? 'positive' : t.eff >= 88 ? 'caution' : 'critical';
                  return [
                    <div key={`${t.name}-name`} className="flex flex-col">
                      <span className="text-sm font-medium text-ck-text">{t.name}</span>
                      <span className="text-xs text-ck-muted">{t.role}</span>
                    </div>,
                    <div key={`${t.name}-clocked`} className="text-right font-mono text-sm tabular-nums text-ck-muted">{t.clocked}</div>,
                    <div key={`${t.name}-produced`} className="text-right font-mono text-sm tabular-nums text-ck-muted-light">{t.produced}</div>,
                    <div key={`${t.name}-eff`} className="flex items-center gap-2">
                      <div className="flex-1 h-1 overflow-hidden rounded-full bg-white/5">
                        <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${Math.min(100, Math.round(t.eff / 1.3))}%` }} />
                      </div>
                      <span className={`font-mono text-xs font-medium tabular-nums ${TONE_COLOR[tone]}`} style={{ width: 38, textAlign: 'right' }}>{t.eff}%</span>
                    </div>,
                  ];
                })}
              </div>
            </section>

            {/* Exceptions */}
            <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <h3 className="text-xs font-medium text-ck-text-2">Uitzonderingen deze dienst</h3>
              <div className="mt-5 space-y-3">
                {DEMO_EVENTS.map((e, i) => (
                  <div key={i} className="grid grid-cols-[52px_8px_1fr] items-start gap-3 border-b border-ck-border pb-3 last:border-0">
                    <span className="font-mono text-xs tabular-nums text-ck-muted">{e.time}</span>
                    <span className={`mt-1 inline-block h-2 w-2 rounded-full ${TONE_BAR[e.tone]}`} />
                    <div>
                      <div className="text-[13px] font-medium text-ck-text">{e.title}</div>
                      <div className="mt-0.5 text-xs text-ck-muted">{e.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ── PER VEHICLE ───────────────────────────────────────────── */}
      {tab === 'vehicle' && (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr] items-start">
          {/* Vehicle list */}
          <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xs font-medium text-ck-text-2">Werk in uitvoering</h3>
              <span className="text-[11px] text-ck-muted">23 op locatie · 6 levering vandaag</span>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_104px_74px_74px_92px] items-center gap-x-3 gap-y-1">
              <div className="text-[11px] font-medium uppercase tracking-wider text-ck-muted">Voertuig</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-ck-muted">Fase</div>
              <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Dagen</div>
              <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Touch</div>
              <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Status</div>
              {DEMO_VEHICLES.map((d, i) => (
                <div
                  key={d.reg}
                  onClick={() => setSelectedVehicle(i)}
                  className={`col-span-full grid cursor-pointer grid-cols-[1fr_104px_74px_74px_92px] items-center gap-3 rounded-lg p-2.5 -mx-2.5 transition-colors ${
                    i === selectedVehicle ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div>
                    <div className="font-mono text-sm font-medium tabular-nums tracking-wide text-ck-text">{d.reg}</div>
                    <div className="text-xs text-ck-muted">{d.model}</div>
                  </div>
                  <div className="text-xs text-ck-muted-light">{d.phase}</div>
                  <div className="text-right font-mono text-[13px] tabular-nums text-ck-muted-light">{d.days} d</div>
                  <div className="text-right font-mono text-[13px] tabular-nums text-ck-muted">{d.touch}</div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_BG[d.tone]} ${TONE_COLOR[d.tone]}`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vehicle detail */}
          <div className="space-y-4">
            {/* Vehicle header + KPIs */}
            <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-2xl font-medium tabular-nums tracking-wide text-ck-text">{v.reg}</div>
                  <div className="mt-0.5 text-[13px] text-ck-muted">{v.model} · {v.colour} · claim {v.claim}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TONE_BG[v.tone]} ${TONE_COLOR[v.tone]}`}>
                  {v.status}
                </span>
              </div>

              {/* Mini KPI cards */}
              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {v.kpis.map(([label, value, sub, tone]) => (
                  <div key={label} className="rounded-lg bg-white/5 p-3">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-ck-muted">{label}</div>
                    <div className={`mt-1 font-mono text-xl font-medium tabular-nums ${TONE_COLOR[tone]}`}>{value}</div>
                    <div className="mt-0.5 text-[11px] text-ck-muted">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Cycle timeline */}
              <div className="mt-6">
                <div className="text-[11px] font-medium uppercase tracking-wider text-ck-muted">Doorlooptijd — actief versus wachtend</div>
                <div className="mt-3 flex h-3.5 gap-0.5">
                  {filteredTimeline.map(([name, hrs, active], i) => (
                    <div
                      key={i}
                      className={`h-full rounded-sm ${active ? 'bg-ck-red' : 'bg-white/10'}`}
                      style={{ width: `${(hrs / tlTotal * 100).toFixed(1)}%` }}
                      title={`${name}: ${hrs.toFixed(1)} u`}
                    />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {filteredTimeline.map(([name, hrs, active], i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`inline-block h-2 w-2 rounded-sm ${active ? 'bg-ck-red' : 'bg-white/10'}`} />
                      <span className="flex-1 text-ck-muted-light">{name}</span>
                      <span className="font-mono tabular-nums text-ck-muted">{hrs.toFixed(1)} u</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Estimate vs actual */}
            <section className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-medium text-ck-text-2">Calculatie versus werkelijk</h3>
                <span className="text-[11px] text-ck-muted">{v.supplements} supplement(en) goedgekeurd</span>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_86px_86px_74px] items-center gap-x-4 gap-y-0">
                <div className="text-[11px] font-medium uppercase tracking-wider text-ck-muted">Regel</div>
                <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Offerte</div>
                <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Werkelijk</div>
                <div className="text-right text-[11px] font-medium uppercase tracking-wider text-ck-muted">Verschil</div>
                {v.costs.map(([name, est, act, variance, tone], i) => {
                  const isTotal = i === v.costs.length - 1;
                  return [
                    <div key={`${name}-name`} className={`border-t py-2 text-[13px] ${isTotal ? 'border-ck-muted/30 font-medium text-ck-text' : 'border-ck-border text-ck-muted-light'}`}>{name}</div>,
                    <div key={`${name}-est`} className={`border-t py-2 text-right font-mono text-[13px] tabular-nums ${isTotal ? 'border-ck-muted/30 text-ck-muted' : 'border-ck-border text-ck-muted'}`}>
                      {est === '0' ? est : `€${est}`}
                    </div>,
                    <div key={`${name}-act`} className={`border-t py-2 text-right font-mono text-[13px] tabular-nums ${isTotal ? 'border-ck-muted/30 text-ck-text' : 'border-ck-border text-ck-muted-light'}`}>
                      {act === '0' || act === 'in afwachting' || act === 'lopend' ? act : `€${act}`}
                    </div>,
                    <div key={`${name}-var`} className={`border-t py-2 text-right font-mono text-[13px] font-medium tabular-nums ${isTotal ? 'border-ck-muted/30' : 'border-ck-border'} ${TONE_COLOR[tone]}`}>
                      {variance}
                    </div>,
                  ];
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
