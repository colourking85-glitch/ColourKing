/**
 * Print-ready inspection report HTML template for ColourKing.
 * A4 proportions, mirrors the IN10 Rapport view.
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

const SEV: Record<number, { label: string; bar: string }> = {
  1: { label: 'Licht', bar: '●○○○' },
  2: { label: 'Matig', bar: '●●○○' },
  3: { label: 'Zwaar', bar: '●●●○' },
  4: { label: 'Zeer zwaar', bar: '●●●●' },
};

const DISP: Record<string, string> = {
  herstellen: 'Herstellen',
  vervangen: 'Vervangen',
  onderzoeken: 'Onderzoeken',
  geen_actie: 'Geen actie',
};

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

  const S = {
    page: { maxWidth: '210mm', margin: '0 auto', padding: '40px 48px', minHeight: '297mm', fontFamily: 'Inter, system-ui, sans-serif', color: '#111', fontSize: '13px', lineHeight: '1.5' } as const,
    pageBreak: { pageBreakBefore: 'always' as const, paddingTop: '40px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #111', paddingBottom: '10px', marginBottom: '24px' } as const,
    headerTitle: { fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#111' },
    headerRef: { fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#888' },
    h1: { fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 4px' },
    subtitle: { fontSize: '13px', color: '#666', margin: '0 0 24px' },
    detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' } as const,
    detailRow: { display: 'flex', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e5e7eb', padding: '6px 0', fontSize: '12px' } as const,
    detailLabel: { color: '#888' },
    detailValue: { fontWeight: 500, color: '#111', textAlign: 'right' as const },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' } as const,
    kpiCell: { padding: '12px 16px', borderRight: '1px solid #e5e7eb' } as const,
    kpiValue: { fontSize: '22px', fontWeight: 600 },
    kpiLabel: { fontSize: '11px', color: '#888', marginTop: '2px' },
    sectionTitle: { fontSize: '16px', fontWeight: 600, margin: '28px 0 12px', color: '#111' },
    colsTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' } as const,
    barRow: { marginBottom: '10px' } as const,
    barLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555' } as const,
    barTrack: { height: '4px', borderRadius: '2px', background: '#f3f4f6', marginTop: '4px', overflow: 'hidden' } as const,
    hoursRow: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '6px 0', fontSize: '13px' } as const,
    indicativeBox: { marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px' } as const,
    caveatRow: { display: 'flex', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #e5e7eb' } as const,
    badge: (bg: string, color: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: bg, color, flexShrink: 0 }) as const,
    sigBlock: { marginTop: '40px' } as const,
    sigLabel: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888' },
    sigLine: { borderBottom: '1px solid #111', height: '56px', display: 'flex', alignItems: 'flex-end', paddingBottom: '6px' } as const,
    sigMeta: { fontSize: '11px', color: '#888', marginTop: '6px' },
    findingHeader: { display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '12px' } as const,
    findingRef: { fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 600 },
    findingTitle: { fontSize: '16px', fontWeight: 600, flex: 1 },
    findingSev: { fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', letterSpacing: '0.1em', color: '#888' },
    findingBody: { display: 'grid', gridTemplateColumns: '1fr', gap: '0' } as const,
    findingRow: { display: 'grid', gridTemplateColumns: '112px 1fr', gap: '12px', borderBottom: '1px solid #e5e7eb', padding: '4px 0', fontSize: '12px' } as const,
    preRow: { display: 'grid', gridTemplateColumns: '1fr 130px', gap: '16px', borderTop: '1px solid #e5e7eb', padding: '8px 0', fontSize: '12px' } as const,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '11px' },
    th: { textAlign: 'left' as const, padding: '6px 8px', borderBottom: '2px solid #111', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#888' },
    td: { padding: '6px 8px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' as const },
    tdMono: { fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' },
    tdRight: { textAlign: 'right' as const },
    verRow: { display: 'grid', gridTemplateColumns: '190px 1fr', gap: '16px', borderBottom: '1px solid #e5e7eb', padding: '8px 0', fontSize: '12px' } as const,
  };

  return (
    <div className="inspection-report" style={{ background: '#fff' }}>
      <style>{`
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
          <span style={S.headerTitle}>ColourKing Autoschade</span>
          <span style={S.headerRef}>{data.reference} · blad 1</span>
        </div>

        <h1 style={S.h1}>Schadeopname</h1>
        <p style={S.subtitle}>
          Opname van de vastgestelde staat van het voertuig en de voorgestelde herstelwijze.
          Geen expertiserapport — opgesteld door de herstellende partij.
        </p>

        {/* Vehicle details */}
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
              <span style={S.detailValue}>{v}</span>
            </div>
          ))}
        </div>

        {/* KPIs */}
        <h2 style={S.sectionTitle}>Samenvatting</h2>
        <div style={S.kpiGrid}>
          {[
            { value: findings.length, label: `Bevindingen (incl. ${pre.length} pre-existent)` },
            { value: data.photo_count, label: "Foto's vastgelegd" },
            { value: num(repairTotal), label: 'Uur plaatwerk' },
            { value: num(paintTotal), label: 'Uur spuitwerk' },
          ].map((kpi, i) => (
            <div key={kpi.label} style={{ ...S.kpiCell, ...(i === 3 ? { borderRight: 'none' } : {}) }}>
              <div style={S.kpiValue}>{kpi.value}</div>
              <div style={S.kpiLabel}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Disposition + Hours */}
        <div style={{ ...S.colsTwo, marginTop: '24px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>Herstelwijze</div>
            <div style={{ marginTop: '12px' }}>
              {([
                ['Herstellen', dispCounts.herstellen, '#f97316'],
                ['Vervangen', dispCounts.vervangen, '#3b82f6'],
                ['Nader onderzoeken', dispCounts.onderzoeken, '#9ca3af'],
                ['Pre-existent · buiten opdracht', pre.length, '#d1d5db'],
              ] as [string, number, string][]).map(([label, count, color]) => (
                <div key={label} style={S.barRow}>
                  <div style={S.barLabel}>
                    <span>{label}</span>
                    <span style={{ color: '#888', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                  </div>
                  <div style={S.barTrack}>
                    <div style={{ height: '100%', borderRadius: '2px', background: color, width: `${inScope.length ? Math.round((count / inScope.length) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888' }}>Uren en indicatie</div>
            <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              {([
                ['Plaatwerk', hrs(repairTotal)],
                ['Spuitwerk', hrs(paintTotal)],
                ['Voorbewerking', hrs(Math.round(paintTotal * 0.55 * 10) / 10)],
                ['Onderdelen', `${partCount} posities`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={S.hoursRow}>
                  <span style={{ color: '#555' }}>{k}</span>
                  <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                </div>
              ))}
            </div>

            {data.indicative_total_cents != null && data.indicative_total_cents > 0 && (
              <div style={S.indicativeBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>Indicatief richtbedrag</span>
                  <span style={{ fontSize: '20px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{eur(data.indicative_total_cents)}</span>
                </div>
                <p style={{ marginTop: '6px', fontSize: '11px', color: '#888', lineHeight: '1.6' }}>
                  Excl. btw. Indicatief richtbedrag op basis van de opname. De definitieve prijsopgave volgt in de offerte.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Caveats */}
        {(findings.some(f => f.hidden_damage_possible) || findings.some(f => f.adas_possible) || pre.length > 0) && (
          <>
            <h2 style={S.sectionTitle}>Voorbehoud</h2>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
              {findings.some(f => f.hidden_damage_possible) && (
                <div style={S.caveatRow}>
                  <span style={S.badge('#fef3c7', '#92400e')}>Verborgen</span>
                  <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: 0 }}>
                    Bij {findings.filter(f => f.hidden_damage_possible).map(f => f.reference).join(', ')} is verborgen schade mogelijk.
                    Wat na demontage aan het licht komt, valt buiten deze opname en wordt als meerwerk ter goedkeuring aangeboden.
                  </p>
                </div>
              )}
              {findings.some(f => f.adas_possible) && (
                <div style={S.caveatRow}>
                  <span style={S.badge('#dbeafe', '#1e40af')}>ADAS</span>
                  <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: 0 }}>
                    Bij {findings.filter(f => f.adas_possible).map(f => f.reference).join(', ')} is kalibratie van rijhulpsystemen mogelijk vereist.
                  </p>
                </div>
              )}
              {pre.length > 0 && (
                <div style={{ ...S.caveatRow, borderBottom: 'none' }}>
                  <span style={S.badge('#f3f4f6', '#374151')}>Pre-existent</span>
                  <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: 0 }}>
                    {pre.length} posities zijn als bestaande schade vastgelegd en vallen buiten de opdracht.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Signatures */}
        <div style={{ ...S.colsTwo, ...S.sigBlock }}>
          <div>
            <div style={S.sigLabel}>Opgenomen door</div>
            <div style={S.sigLine}>
              <span style={{ fontSize: '14px', fontStyle: 'italic', color: '#888' }}>
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
                <span style={{ fontSize: '18px', fontStyle: 'italic' }}>{customerApproval.signer_name}</span>
              ) : (
                <span style={{ fontSize: '14px', color: '#888' }}>—</span>
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
      </div>

      {/* ═══ Page 2: Guided photos ═══ */}
      {guidedPhotos.length > 0 && (
        <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
          <div style={S.header}>
            <span style={S.headerTitle}>Fotoserie · geleide opnames</span>
            <span style={S.headerRef}>blad 2</span>
          </div>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
            Vaste opnames rondom het voertuig. Alle bestanden zijn write-once vastgelegd met sha256.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {guidedPhotos.map(p => (
              <div key={p.id}>
                <div style={{ aspectRatio: '4/3', background: '#f3f4f6', borderRadius: '4px', position: 'relative' }}>
                  <span style={{ position: 'absolute', bottom: '6px', left: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#888', background: '#fff', padding: '1px 4px', borderRadius: '2px' }}>
                    {p.reference}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                  {p.caption || p.shot_key || p.reference}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Page 3+: Findings ═══ */}
      {inScope.length > 0 && (
        <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
          <div style={S.header}>
            <span style={S.headerTitle}>Bevindingen {inScope[0].reference}–{inScope[inScope.length - 1].reference}</span>
            <span style={S.headerRef}>blad 3</span>
          </div>

          {inScope.map(f => {
            const sev = SEV[f.severity] || SEV[2];
            const findingPhotos = photos.filter(p => p.finding_id === f.id);
            return (
              <div key={f.id} style={{ borderBottom: '1px solid #e5e7eb', padding: '20px 0' }}>
                <div style={S.findingHeader}>
                  <span style={S.findingRef}>{f.reference}</span>
                  <span style={S.findingTitle}>{f.component_key}</span>
                  <span style={S.findingSev}>{sev.bar} {sev.label}</span>
                </div>

                <div style={S.findingBody}>
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
                      <span style={{ color: '#888' }}>{k}</span>
                      <span style={{ color: '#555' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {findingPhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {findingPhotos.slice(0, 4).map(p => (
                      <div key={p.id} style={{ width: '80px', aspectRatio: '4/3', background: '#f3f4f6', borderRadius: '4px', position: 'relative' }}>
                        <span style={{ position: 'absolute', bottom: '3px', left: '3px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#888', background: '#fff', padding: '1px 3px', borderRadius: '2px' }}>
                          {p.reference}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Pre-existing damage ═══ */}
      {pre.length > 0 && (
        <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
          <div style={S.header}>
            <span style={S.headerTitle}>Pre-existente schade · buiten opdracht</span>
            <span style={S.headerRef}>blad {guidedPhotos.length > 0 ? 4 : 3}</span>
          </div>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
            Deze posities zijn vastgesteld bij de opname, vallen buiten de opdracht en zijn niet meegerekend in uren of richtbedrag.
          </p>
          {pre.map(f => (
            <div key={f.id} style={S.preRow}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600 }}>{f.reference}</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{f.component_key}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>
                  {f.damage_types?.join(', ')} · {f.description || 'buiten opdracht'}
                </p>
              </div>
              <span style={{ justifySelf: 'end', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, background: '#f3f4f6', color: '#888' }}>
                Buiten opdracht
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Findings table ═══ */}
      <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
        <div style={S.header}>
          <span style={S.headerTitle}>Bevindingentabel</span>
          <span style={S.headerRef}>overzicht</span>
        </div>
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
                <tr key={f.id}>
                  <td style={{ ...S.td, ...S.tdMono }}>{f.reference}</td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{f.component_key}</td>
                  <td style={S.td}>{f.damage_types?.join(', ')}</td>
                  <td style={{ ...S.td, ...S.tdMono }}>{sev.bar}</td>
                  <td style={S.td}>{f.repair_technique || DISP[f.disposition] || '—'}</td>
                  <td style={{ ...S.td, ...S.tdMono, ...S.tdRight }}>{f.repair_hours ? num(f.repair_hours) : '—'}</td>
                  <td style={{ ...S.td, ...S.tdMono, ...S.tdRight }}>{f.paint_hours ? num(f.paint_hours) : '—'}</td>
                  <td style={S.td}>{f.ins_finding_parts?.length ? `${f.ins_finding_parts.length}×` : '—'}</td>
                  <td style={{ ...S.td, fontSize: '10px', fontWeight: 600, color: f.hidden_damage_possible ? '#d97706' : f.adas_possible ? '#2563eb' : isPre ? '#888' : '#ddd' }}>
                    {f.hidden_damage_possible ? 'VERB.' : f.adas_possible ? 'ADAS' : isPre ? 'PRE' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #111' }}>
              <td style={S.td} />
              <td style={{ ...S.td, fontWeight: 600 }}>Totaal in opdracht</td>
              <td style={S.td} /><td style={S.td} /><td style={S.td} />
              <td style={{ ...S.td, ...S.tdMono, ...S.tdRight, fontWeight: 600 }}>{num(repairTotal)}</td>
              <td style={{ ...S.td, ...S.tdMono, ...S.tdRight, fontWeight: 600 }}>{num(paintTotal)}</td>
              <td style={S.td}>{partCount} pos.</td>
              <td style={S.td} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ═══ Verification ═══ */}
      <div className="page-break" style={{ ...S.page, ...S.pageBreak }}>
        <div style={{ ...S.header, borderBottomWidth: '2px' }}>
          <span style={S.headerTitle}>Verificatie</span>
        </div>

        <div style={{ marginTop: '20px' }}>
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
              <span style={{ color: '#888' }}>{k}</span>
              <span style={{ color: '#111', ...(k.includes('hash') ? { fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', wordBreak: 'break-all' as const } : {}) }}>{v}</span>
            </div>
          ))}
        </div>

        {approvals.length > 0 && (
          <>
            <h3 style={{ ...S.sectionTitle, marginTop: '32px' }}>Ondertekening</h3>
            {approvals.map(a => (
              <div key={a.id} style={{ marginBottom: '16px' }}>
                {([
                  ['Rol', a.role === 'customer' ? 'Klant' : 'Opnemer'],
                  ['Naam', a.signer_name],
                  ['Identificatie', a.identification || 'Ingelogd'],
                  ['Verklaring', a.statement_text || 'Opname ingezien en akkoord'],
                  ['Tijdstip', fmtDateTime(a.signed_at)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={S.verRow}>
                    <span style={{ color: '#888' }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        <p style={{ marginTop: '24px', fontSize: '13px', color: '#555', lineHeight: '1.7' }}>
          Dit rapport is na vergrendeling niet meer wijzigbaar. De hierboven vermelde snapshot-hash dekt alle bevindingen,
          foto&apos;s en verklaringen zoals ondertekend.
        </p>
        <p style={{ marginTop: '8px', fontSize: '11px', color: '#888', lineHeight: '1.6' }}>
          Gewone elektronische handtekening (eIDAS art. 25 lid 1). Bewaarde bewijsmiddelen: verklaringstekst, tijdstempel,
          IP-adres, user-agent en de document-hash op het moment van ondertekening.
        </p>

        {/* Footer */}
        <div style={{ marginTop: '60px', borderTop: '1px solid #e5e7eb', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
          <span>ColourKing Autoschade · Satijnbloem 6 · 3068 JP Rotterdam</span>
          <span>KvK 82199884 · BTW NL821998840B03</span>
        </div>
      </div>
    </div>
  );
}
