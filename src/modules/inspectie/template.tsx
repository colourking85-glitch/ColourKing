/**
 * Print-ready inspection report – Neutral Base design language.
 * A4 proportions, Archivo / Literata / JetBrains Mono.
 */

type Finding = {
  id: string;
  reference: string;
  sequence_no: number;
  component_key: string;
  sub_location: string | null;
  damage_types: string[];
  severity: number;
  origin: string;
  disposition: string;
  repair_hours: number;
  repair_technique: string | null;
  paint_required: boolean;
  paint_operation: string | null;
  paint_hours: number;
  blend_components: string[] | null;
  hidden_damage_possible: boolean;
  hidden_damage_note: string | null;
  adas_possible: boolean;
  description: string | null;
  ins_finding_parts: {
    id: string;
    description: string;
    part_number: string | null;
    qty: number;
    unit_price_cents: number | null;
  }[];
};

type Photo = {
  id: string;
  reference: string;
  finding_id: string | null;
  shot_key: string | null;
  kind: string;
  sha256: string | null;
  caption: string | null;
};

type Approval = {
  id: string;
  role: string;
  signer_name: string;
  identification: string | null;
  statement_text: string | null;
  document_hash: string | null;
  signed_at: string;
};

type Snapshot = {
  snapshot_hash: string;
  pdf_hash: string | null;
};

export type InspectionReportData = {
  reference: string;
  status: string;
  purpose: string | null;
  licence_plate: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  first_reg_date: string | null;
  fuel: string | null;
  odometer_km: number | null;
  rdw_verified: boolean;
  event_date: string | null;
  event_description: string | null;
  insurer_name: string | null;
  claim_number: string | null;
  finding_count: number;
  photo_count: number;
  total_hours: number | null;
  indicative_total_cents: number | null;
  started_at: string | null;
  locked_at: string | null;
  created_at: string;
  staff: { name: string } | null;
  customers: { name: string } | null;
  ins_findings: Finding[];
  ins_photos: Photo[];
  ins_approvals: Approval[];
  ins_snapshots: Snapshot[];
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

function num(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

function hrs(n: number): string {
  return n ? num(n) + ' u' : '—';
}

function eur(cents: number): string {
  return '€ ' + Math.round(cents / 100).toLocaleString('nl-NL');
}

const SEV: Record<number, { label: string; bar: string; color: string }> = {
  1: { label: 'Licht', bar: '●○○○', color: '#1e7546' },
  2: { label: 'Matig', bar: '●●○○', color: '#9b690b' },
  3: { label: 'Zwaar', bar: '●●●○', color: '#b35627' },
  4: { label: 'Zeer zwaar', bar: '●●●●', color: '#b12c2e' },
};

const DISP: Record<string, string> = {
  herstellen: 'Herstellen',
  vervangen: 'Vervangen',
  onderzoeken: 'Onderzoeken',
  geen_actie: 'Geen actie',
};

/* ── Design tokens (Neutral Base) ───────────────────────────────────────── */

const C = {
  surface: '#f8fafd',
  sunken: '#eff3f6',
  raised: '#ffffff',
  rule: '#dadee3',
  text: '#0c131b',
  body: '#2d343b',
  muted: '#585e65',
  faint: '#6d747b',
  accent: '#b35627',
  accentStrong: '#973e16',
  accentSoft: '#dd8f66',
  accentPale: '#ffe7d8',
  positive: '#1e7546',
  caution: '#9b690b',
  critical: '#b12c2e',
} as const;

const FONT = {
  sans: 'Archivo, "Helvetica Neue", Arial, system-ui, sans-serif',
  serif: 'Literata, Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", SFMono-Regular, Consolas, monospace',
} as const;

/* ── Styles ──────────────────────────────────────────────────────────────── */

const S = {
  page: {
    maxWidth: '210mm',
    margin: '0 auto',
    padding: '48px 48px 40px',
    minHeight: '297mm',
    fontFamily: FONT.sans,
    color: C.body,
    fontSize: '13px',
    lineHeight: '1.6',
    background: C.raised,
  } as const,
  pageBreak: { pageBreakBefore: 'always' as const, paddingTop: '48px' },

  /* Header bar */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${C.rule}`,
    paddingBottom: '12px',
    marginBottom: '32px',
  } as const,
  headerBrand: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: C.accent,
  },
  headerRef: {
    fontFamily: FONT.mono,
    fontSize: '11px',
    color: C.faint,
  },

  /* Title block */
  h1: {
    fontFamily: FONT.sans,
    fontSize: '32px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    color: C.text,
    margin: '0 0 8px',
  },
  subtitle: {
    fontFamily: FONT.serif,
    fontSize: '14px',
    lineHeight: '1.7',
    color: C.muted,
    margin: '0 0 32px',
    maxWidth: '68ch',
  },

  /* Section titles */
  sectionTitle: {
    fontFamily: FONT.sans,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: C.muted,
    margin: '32px 0 16px',
  },
  h2: {
    fontFamily: FONT.sans,
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '-0.005em',
    lineHeight: '1.3',
    color: C.text,
    margin: '48px 0 16px',
  },

  /* Detail grid */
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0 48px',
  } as const,
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    borderBottom: `1px solid ${C.rule}`,
    padding: '8px 0',
    fontSize: '13px',
  } as const,
  detailLabel: { color: C.muted, fontSize: '12px' },
  detailValue: { fontWeight: 500, color: C.text, textAlign: 'right' as const, fontSize: '13px' },

  /* KPI strip */
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0',
    border: `1px solid ${C.rule}`,
    borderRadius: '8px',
    overflow: 'hidden',
    background: C.raised,
  } as const,
  kpiCell: (last: boolean) => ({
    padding: '16px 20px',
    borderRight: last ? 'none' : `1px solid ${C.rule}`,
  }),
  kpiValue: {
    fontFamily: FONT.sans,
    fontSize: '24px',
    fontWeight: 600,
    color: C.text,
    fontVariantNumeric: 'tabular-nums' as const,
    lineHeight: '1.2',
  },
  kpiLabel: {
    fontSize: '11px',
    color: C.faint,
    marginTop: '4px',
    lineHeight: '1.4',
  },

  /* Two-column layout */
  cols2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
  } as const,

  /* Bar chart rows */
  barRow: { marginBottom: '12px' } as const,
  barLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: C.body,
  } as const,
  barTrack: {
    height: '4px',
    borderRadius: '2px',
    background: C.sunken,
    marginTop: '6px',
    overflow: 'hidden',
  } as const,

  /* Hours rows */
  hoursRow: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${C.rule}`,
    padding: '8px 0',
    fontSize: '13px',
  } as const,

  /* Indicative total */
  indicativeBox: {
    marginTop: '16px',
    padding: '16px',
    background: C.accentPale,
    borderRadius: '8px',
  } as const,

  /* Caveat rows */
  caveatRow: {
    display: 'flex',
    gap: '16px',
    padding: '12px 16px',
    borderBottom: `1px solid ${C.rule}`,
    alignItems: 'flex-start',
  } as const,

  /* Tags */
  tag: (bg: string, color: string) => ({
    display: 'inline-block',
    padding: '3px 7px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    background: bg,
    color,
    flexShrink: 0,
    lineHeight: '1.4',
  }),

  /* Signature blocks */
  sigBlock: { marginTop: '48px' } as const,
  sigLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: C.muted,
  },
  sigLine: {
    borderBottom: `1px solid ${C.text}`,
    height: '56px',
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: '8px',
  } as const,
  sigMeta: { fontSize: '11px', color: C.faint, marginTop: '8px' },

  /* Finding cards */
  findingCard: {
    borderBottom: `1px solid ${C.rule}`,
    padding: '24px 0',
  } as const,
  findingHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '12px',
  } as const,
  findingRef: {
    fontFamily: FONT.mono,
    fontSize: '14px',
    fontWeight: 600,
    color: C.accent,
  },
  findingTitle: {
    fontFamily: FONT.sans,
    fontSize: '16px',
    fontWeight: 600,
    flex: 1,
    color: C.text,
  },
  findingSev: {
    fontFamily: FONT.mono,
    fontSize: '12px',
    letterSpacing: '0.08em',
  },
  findingRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: '12px',
    borderBottom: `1px solid ${C.sunken}`,
    padding: '6px 0',
    fontSize: '12px',
  } as const,

  /* Pre-existing damage */
  preRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '16px',
    borderTop: `1px solid ${C.rule}`,
    padding: '10px 0',
    fontSize: '13px',
  } as const,

  /* Table */
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 8px',
    borderBottom: `2px solid ${C.text}`,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: C.muted,
  },
  td: {
    padding: '6px 8px',
    borderBottom: `1px solid ${C.rule}`,
    verticalAlign: 'top' as const,
    color: C.body,
  },
  tdMono: { fontFamily: FONT.mono, fontSize: '11px' },
  tdRight: { textAlign: 'right' as const },

  /* Verification rows */
  verRow: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    gap: '16px',
    borderBottom: `1px solid ${C.rule}`,
    padding: '8px 0',
    fontSize: '13px',
  } as const,

  /* Footer */
  footer: {
    marginTop: '72px',
    borderTop: `1px solid ${C.rule}`,
    paddingTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: C.faint,
  } as const,
};

/* ── Template ────────────────────────────────────────────────────────────── */

export function InspectionReportTemplate({ data }: { data: InspectionReportData }) {
  const findings = data.ins_findings || [];
  const photos = data.ins_photos || [];
  const approvals = data.ins_approvals || [];
  const snapshot = data.ins_snapshots?.[0];

  const inScope = findings.filter(f => f.origin !== 'pre_existent');
  const pre = findings.filter(f => f.origin === 'pre_existent');

  const repairTotal = inScope.reduce((a, f) => a + f.repair_hours, 0);
  const paintTotal = inScope.reduce((a, f) => a + f.paint_hours, 0);
  const partCount = inScope.reduce((a, f) => a + (f.ins_finding_parts?.length || 0), 0);

  const dispCounts: Record<string, number> = { herstellen: 0, vervangen: 0, onderzoeken: 0 };
  inScope.forEach(f => { if (dispCounts[f.disposition] !== undefined) dispCounts[f.disposition]++; });

  const inspectorApproval = approvals.find(a => a.role === 'inspector');
  const customerApproval = approvals.find(a => a.role === 'customer');
  const guidedPhotos = photos.filter(p => p.kind === 'guided');

  return (
    <div className="inspection-report" style={{ background: C.raised }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Literata:opsz,wght@7..72,400;7..72,600&family=JetBrains+Mono:wght@400;500&display=swap');
        @media print {
          body { margin: 0; padding: 0; }
          .inspection-report { box-shadow: none !important; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* ═══ Page 1: Summary ═══ */}
      <div style={S.page}>
        <div style={S.header}>
          <span style={S.headerBrand}>ColourKing Autoschade</span>
          <span style={S.headerRef}>{data.reference} · blad 1</span>
        </div>

        <h1 style={S.h1}>Schadeopname</h1>
        <p style={S.subtitle}>
          Opname van de vastgestelde staat van het voertuig en de voorgestelde herstelwijze.
          Geen expertiserapport — opgesteld door de herstellende partij.
        </p>

        {/* ── Vehicle + incident details ── */}
        <div style={S.sectionTitle}>Voertuiggegevens</div>
        <div style={S.detailGrid}>
          {([
            ['Kenteken', data.licence_plate || '—'],
            ['Referentie', data.reference],
            ['Merk / model', `${data.make || ''} ${data.model || ''}`.trim() || '—'],
            ['Soort opname', data.purpose || '—'],
            ['VIN', data.vin || '—'],
            ['Schadedatum', fmtDate(data.event_date)],
            ['Eerste toelating', fmtDate(data.first_reg_date)],
            ['Toedracht', data.event_description || '—'],
            ['Kilometerstand', data.odometer_km ? data.odometer_km.toLocaleString('nl-NL') + ' km' : '—'],
            ['Opnamedatum', data.started_at ? fmtDateTime(data.started_at) : fmtDateTime(data.created_at)],
            ['Brandstof', data.fuel || '—'],
            ['RDW-controle', data.rdw_verified ? 'Geverifieerd' : '—'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={S.detailRow}>
              <span style={S.detailLabel}>{k}</span>
              <span style={{
                ...S.detailValue,
                ...(k === 'Kenteken' ? { fontFamily: FONT.mono, letterSpacing: '0.05em' } : {}),
                ...(k === 'VIN' ? { fontFamily: FONT.mono, fontSize: '11px' } : {}),
              }}>{v}</span>
            </div>
          ))}
        </div>

        {/* ── KPI strip ── */}
        <div style={S.h2}>Samenvatting</div>
        <div style={S.kpiStrip}>
          {[
            { value: String(findings.length), label: `Bevindingen (incl. ${pre.length} pre-existent)` },
            { value: String(data.photo_count), label: "Foto's vastgelegd" },
            { value: num(repairTotal), label: 'Uur plaatwerk' },
            { value: num(paintTotal), label: 'Uur spuitwerk' },
          ].map((kpi, i) => (
            <div key={kpi.label} style={S.kpiCell(i === 3)}>
              <div style={S.kpiValue}>{kpi.value}</div>
              <div style={S.kpiLabel}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ── Disposition + Hours ── */}
        <div style={{ ...S.cols2, marginTop: '32px' }}>
          <div>
            <div style={S.sectionTitle}>Herstelwijze</div>
            <div style={{ marginTop: '4px' }}>
              {([
                ['Herstellen', dispCounts.herstellen, C.accent],
                ['Vervangen', dispCounts.vervangen, '#3b6fc4'],
                ['Nader onderzoeken', dispCounts.onderzoeken, C.muted],
                ['Pre-existent', pre.length, C.rule],
              ] as [string, number, string][]).map(([label, count, color]) => (
                <div key={label} style={S.barRow}>
                  <div style={S.barLabel}>
                    <span>{label}</span>
                    <span style={{ color: C.faint, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                  </div>
                  <div style={S.barTrack}>
                    <div style={{
                      height: '100%',
                      borderRadius: '2px',
                      background: color,
                      width: `${inScope.length ? Math.round((count / inScope.length) * 100) : 0}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={S.sectionTitle}>Uren en indicatie</div>
            <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: '4px' }}>
              {([
                ['Plaatwerk', hrs(repairTotal)],
                ['Spuitwerk', hrs(paintTotal)],
                ['Voorbewerking', hrs(Math.round(paintTotal * 0.55 * 10) / 10)],
                ['Onderdelen', `${partCount} posities`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={S.hoursRow}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: C.text }}>{v}</span>
                </div>
              ))}
            </div>

            {data.indicative_total_cents != null && data.indicative_total_cents > 0 && (
              <div style={S.indicativeBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '12px', color: C.accentStrong }}>Indicatief richtbedrag</span>
                  <span style={{ fontSize: '22px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: C.accentStrong }}>{eur(data.indicative_total_cents)}</span>
                </div>
                <p style={{ marginTop: '8px', fontFamily: FONT.serif, fontSize: '12px', color: C.muted, lineHeight: '1.6' }}>
                  Excl. btw. Indicatief richtbedrag op basis van de opname. De definitieve prijsopgave volgt in de offerte.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Caveats ── */}
        {(findings.some(f => f.hidden_damage_possible) || findings.some(f => f.adas_possible) || pre.length > 0) && (
          <>
            <div style={S.h2}>Voorbehoud</div>
            <div style={{ border: `1px solid ${C.rule}`, borderRadius: '8px', overflow: 'hidden' }}>
              {findings.some(f => f.hidden_damage_possible) && (
                <div style={S.caveatRow}>
                  <span style={S.tag('#fef3c7', '#92400e')}>Verborgen</span>
                  <p style={{ fontFamily: FONT.serif, fontSize: '13px', color: C.body, lineHeight: '1.7', margin: 0 }}>
                    Bij {findings.filter(f => f.hidden_damage_possible).map(f => f.reference).join(', ')} is verborgen schade mogelijk.
                    Wat na demontage aan het licht komt, valt buiten deze opname en wordt als meerwerk ter goedkeuring aangeboden.
                  </p>
                </div>
              )}
              {findings.some(f => f.adas_possible) && (
                <div style={S.caveatRow}>
                  <span style={S.tag('#dbeafe', '#1e40af')}>ADAS</span>
                  <p style={{ fontFamily: FONT.serif, fontSize: '13px', color: C.body, lineHeight: '1.7', margin: 0 }}>
                    Bij {findings.filter(f => f.adas_possible).map(f => f.reference).join(', ')} is kalibratie van rijhulpsystemen mogelijk vereist.
                  </p>
                </div>
              )}
              {pre.length > 0 && (
                <div style={{ ...S.caveatRow, borderBottom: 'none' }}>
                  <span style={S.tag(C.sunken, C.muted)}>Pre-existent</span>
                  <p style={{ fontFamily: FONT.serif, fontSize: '13px', color: C.body, lineHeight: '1.7', margin: 0 }}>
                    {pre.length} posities zijn als bestaande schade vastgelegd en vallen buiten de opdracht.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Signatures ── */}
        <div style={{ ...S.cols2, ...S.sigBlock }}>
          <div>
            <div style={S.sigLabel}>Opgenomen door</div>
            <div style={S.sigLine}>
              <span style={{ fontFamily: FONT.serif, fontSize: '16px', fontStyle: 'italic', color: C.muted }}>
                {inspectorApproval ? inspectorApproval.signer_name : data.staff?.name || '—'}
              </span>
            </div>
            <div style={S.sigMeta}>
              {data.staff?.name || '—'} · {data.started_at ? fmtDateTime(data.started_at) : '—'}
            </div>
          </div>
          <div>
            <div style={S.sigLabel}>Akkoord klant</div>
            <div style={S.sigLine}>
              {customerApproval ? (
                <span style={{ fontFamily: FONT.serif, fontSize: '20px', fontStyle: 'italic', color: C.text }}>{customerApproval.signer_name}</span>
              ) : (
                <span style={{ fontFamily: FONT.serif, fontSize: '16px', color: C.faint }}>—</span>
              )}
            </div>
            <div style={S.sigMeta}>
              {customerApproval
                ? `${customerApproval.signer_name} · elektronisch ondertekend · ${fmtDateTime(customerApproval.signed_at)}`
                : 'Niet ondertekend'
              }
            </div>
          </div>
        </div>

        <div style={S.footer}>
          <span>ColourKing Autoschade · Satijnbloem 6 · 3068 JP Rotterdam</span>
          <span>KvK 82199884 · BTW NL821998840B03</span>
        </div>
      </div>

      {/* ═══ Page 2: Guided photos ═══ */}
      {guidedPhotos.length > 0 && (
        <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
          <div style={S.header}>
            <span style={S.headerBrand}>Fotoserie · geleide opnames</span>
            <span style={S.headerRef}>{data.reference} · blad 2</span>
          </div>
          <p style={{ fontFamily: FONT.serif, fontSize: '13px', color: C.muted, marginBottom: '24px', lineHeight: '1.7' }}>
            Vaste opnames rondom het voertuig. Alle bestanden zijn write-once vastgelegd met sha256.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {guidedPhotos.map(p => (
              <div key={p.id}>
                <div style={{
                  aspectRatio: '4/3',
                  background: C.sunken,
                  borderRadius: '6px',
                  border: `1px solid ${C.rule}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '6px',
                    fontFamily: FONT.mono,
                    fontSize: '10px',
                    color: C.muted,
                    background: C.raised,
                    padding: '2px 6px',
                    borderRadius: '3px',
                  }}>
                    {p.reference}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: C.body, marginTop: '6px', lineHeight: '1.4' }}>
                  {p.caption || p.shot_key || p.reference}
                </div>
              </div>
            ))}
          </div>

          <div style={S.footer}>
            <span>ColourKing Autoschade · Satijnbloem 6 · 3068 JP Rotterdam</span>
            <span>KvK 82199884 · BTW NL821998840B03</span>
          </div>
        </div>
      )}

      {/* ═══ Page 3+: Findings ═══ */}
      {inScope.length > 0 && (
        <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
          <div style={S.header}>
            <span style={S.headerBrand}>Bevindingen {inScope[0].reference}–{inScope[inScope.length - 1].reference}</span>
            <span style={S.headerRef}>{data.reference} · blad 3</span>
          </div>

          {inScope.map(f => {
            const sev = SEV[f.severity] || SEV[2];
            const findingPhotos = photos.filter(p => p.finding_id === f.id);
            return (
              <div key={f.id} style={S.findingCard}>
                <div style={S.findingHeader}>
                  <span style={S.findingRef}>{f.reference}</span>
                  <span style={S.findingTitle}>{f.component_key}</span>
                  <span style={{ ...S.findingSev, color: sev.color }}>{sev.bar} {sev.label}</span>
                </div>

                <div>
                  {([
                    ['Zone', f.sub_location ? `${f.component_key} · ${f.sub_location}` : f.component_key],
                    ['Schade', f.damage_types?.join(', ') || '—'],
                    ['Herstelwijze', f.repair_technique || DISP[f.disposition] || '—'],
                    ['Lakwerk', f.paint_required ? (f.paint_operation || 'Paneel') + (f.blend_components?.length ? ' · inspuiten ' + f.blend_components.join(', ') : '') : 'Niet vereist'],
                    ['Uren', `Plaatwerk ${hrs(f.repair_hours)} · Spuitwerk ${hrs(f.paint_hours)}`],
                    ...(f.ins_finding_parts?.length ? [['Onderdelen', f.ins_finding_parts.map(p => `${p.description}${p.part_number ? ' (' + p.part_number + ')' : ''} × ${p.qty}`).join(' · ')]] : []),
                    ...(f.hidden_damage_possible && f.hidden_damage_note ? [['Voorbehoud', f.hidden_damage_note]] : []),
                    ...(f.adas_possible ? [['Rijhulpsystemen', 'Kalibratie mogelijk vereist']] : []),
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} style={S.findingRow}>
                      <span style={{ color: C.muted }}>{k}</span>
                      <span style={{ color: C.body }}>{v}</span>
                    </div>
                  ))}
                </div>

                {findingPhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {findingPhotos.slice(0, 4).map(p => (
                      <div key={p.id} style={{
                        width: '80px',
                        aspectRatio: '4/3',
                        background: C.sunken,
                        borderRadius: '4px',
                        border: `1px solid ${C.rule}`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        <span style={{
                          position: 'absolute',
                          bottom: '3px',
                          left: '3px',
                          fontFamily: FONT.mono,
                          fontSize: '9px',
                          color: C.muted,
                          background: C.raised,
                          padding: '1px 3px',
                          borderRadius: '2px',
                        }}>
                          {p.reference}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={S.footer}>
            <span>ColourKing Autoschade · Satijnbloem 6 · 3068 JP Rotterdam</span>
            <span>KvK 82199884 · BTW NL821998840B03</span>
          </div>
        </div>
      )}

      {/* ═══ Pre-existing damage ═══ */}
      {pre.length > 0 && (
        <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
          <div style={S.header}>
            <span style={S.headerBrand}>Pre-existente schade · buiten opdracht</span>
            <span style={S.headerRef}>{data.reference} · blad {guidedPhotos.length > 0 ? 4 : 3}</span>
          </div>
          <p style={{ fontFamily: FONT.serif, fontSize: '13px', color: C.muted, marginBottom: '20px', lineHeight: '1.7' }}>
            Deze posities zijn vastgesteld bij de opname, vallen buiten de opdracht en zijn niet meegerekend in uren of richtbedrag.
          </p>
          {pre.map(f => (
            <div key={f.id} style={S.preRow}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: '13px', fontWeight: 600, color: C.accent }}>{f.reference}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: C.text }}>{f.component_key}</span>
                </div>
                <p style={{ fontSize: '12px', color: C.muted, margin: '4px 0 0', lineHeight: '1.5' }}>
                  {f.damage_types?.join(', ')} · {f.description || 'buiten opdracht'}
                </p>
              </div>
              <span style={S.tag(C.sunken, C.muted)}>Buiten opdracht</span>
            </div>
          ))}

          <div style={S.footer}>
            <span>ColourKing Autoschade · Satijnbloem 6 · 3068 JP Rotterdam</span>
            <span>KvK 82199884 · BTW NL821998840B03</span>
          </div>
        </div>
      )}

      {/* ═══ Findings table ═══ */}
      <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
        <div style={S.header}>
          <span style={S.headerBrand}>Bevindingentabel</span>
          <span style={S.headerRef}>{data.reference} · overzicht</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['Ref', 'Onderdeel', 'Schade', 'Ernst', 'Herstelwijze', 'Plaat', 'Spuit', 'Ond.', 'Vlag'].map(h => (
                  <th key={h} style={{ ...S.th, ...(h === 'Plaat' || h === 'Spuit' ? S.tdRight : {}) }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {findings.map(f => {
                const sev = SEV[f.severity] || SEV[2];
                const isPre = f.origin === 'pre_existent';
                return (
                  <tr key={f.id} style={isPre ? { color: C.faint } : {}}>
                    <td style={{ ...S.td, ...S.tdMono, color: C.accent }}>{f.reference}</td>
                    <td style={{ ...S.td, fontWeight: 500, color: C.text }}>{f.component_key}</td>
                    <td style={S.td}>{f.damage_types?.join(', ')}</td>
                    <td style={{ ...S.td, ...S.tdMono, color: sev.color }}>{sev.bar}</td>
                    <td style={S.td}>{f.repair_technique || DISP[f.disposition] || '—'}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...S.tdRight }}>{f.repair_hours ? num(f.repair_hours) : '—'}</td>
                    <td style={{ ...S.td, ...S.tdMono, ...S.tdRight }}>{f.paint_hours ? num(f.paint_hours) : '—'}</td>
                    <td style={S.td}>{f.ins_finding_parts?.length ? `${f.ins_finding_parts.length}×` : '—'}</td>
                    <td style={{
                      ...S.td,
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      color: f.hidden_damage_possible ? C.caution : f.adas_possible ? '#2563eb' : isPre ? C.faint : 'transparent',
                    }}>
                      {f.hidden_damage_possible ? 'VERB.' : f.adas_possible ? 'ADAS' : isPre ? 'PRE' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid ${C.text}` }}>
                <td style={S.td} />
                <td style={{ ...S.td, fontWeight: 600, color: C.text }}>Totaal in opdracht</td>
                <td style={S.td} /><td style={S.td} /><td style={S.td} />
                <td style={{ ...S.td, ...S.tdMono, ...S.tdRight, fontWeight: 600, color: C.text }}>{num(repairTotal)}</td>
                <td style={{ ...S.td, ...S.tdMono, ...S.tdRight, fontWeight: 600, color: C.text }}>{num(paintTotal)}</td>
                <td style={{ ...S.td, color: C.text }}>{partCount} pos.</td>
                <td style={S.td} />
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={S.footer}>
          <span>ColourKing Autoschade · Satijnbloem 6 · 3068 JP Rotterdam</span>
          <span>KvK 82199884 · BTW NL821998840B03</span>
        </div>
      </div>

      {/* ═══ Verification ═══ */}
      <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
        <div style={S.header}>
          <span style={S.headerBrand}>Verificatie</span>
          <span style={S.headerRef}>{data.reference}</span>
        </div>

        <div style={{ marginTop: '8px' }}>
          {([
            ['Rapport', data.reference],
            ['Vergrendeld', fmtDateTime(data.locked_at)],
            ['Opgenomen door', data.staff ? `${data.staff.name} · ingelogd` : '—'],
            ['Akkoord', customerApproval ? `${customerApproval.signer_name} (klant) · elektronisch ondertekend` : '—'],
            ['Bevindingen / foto\'s', `${findings.length} / ${data.photo_count}`],
            ...(snapshot ? [
              ['Snapshot-hash', snapshot.snapshot_hash || '—'],
              ['PDF-hash', snapshot.pdf_hash || '—'],
            ] : []),
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={S.verRow}>
              <span style={{ color: C.muted }}>{k}</span>
              <span style={{
                color: C.text,
                ...(k.includes('hash') ? { fontFamily: FONT.mono, fontSize: '11px', wordBreak: 'break-all' as const } : {}),
              }}>{v}</span>
            </div>
          ))}
        </div>

        {approvals.length > 0 && (
          <>
            <div style={S.h2}>Ondertekening</div>
            {approvals.map(a => (
              <div key={a.id} style={{ marginBottom: '24px' }}>
                {([
                  ['Rol', a.role === 'customer' ? 'Klant' : 'Opnemer'],
                  ['Naam', a.signer_name],
                  ['Identificatie', a.identification || 'Ingelogd'],
                  ['Verklaring', a.statement_text || 'Opname ingezien en akkoord'],
                  ['Tijdstip', fmtDateTime(a.signed_at)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={S.verRow}>
                    <span style={{ color: C.muted }}>{k}</span>
                    <span style={{ color: C.text }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        <p style={{ marginTop: '32px', fontFamily: FONT.serif, fontSize: '13px', color: C.body, lineHeight: '1.7' }}>
          Dit rapport is na vergrendeling niet meer wijzigbaar. De hierboven vermelde snapshot-hash dekt alle bevindingen,
          foto&apos;s en verklaringen zoals ondertekend.
        </p>
        <p style={{ marginTop: '8px', fontFamily: FONT.serif, fontSize: '11px', color: C.muted, lineHeight: '1.7' }}>
          Gewone elektronische handtekening (eIDAS art. 25 lid 1). Bewaarde bewijsmiddelen: verklaringstekst, tijdstempel,
          IP-adres, user-agent en de document-hash op het moment van ondertekening.
        </p>

        <div style={S.footer}>
          <span>ColourKing Autoschade · Satijnbloem 6 · 3068 JP Rotterdam</span>
          <span>KvK 82199884 · BTW NL821998840B03</span>
        </div>
      </div>
    </div>
  );
}
