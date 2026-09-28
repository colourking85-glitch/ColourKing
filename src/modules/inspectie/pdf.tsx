import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { InspectionReportData } from './template';
import type { CompanyInfo } from '@/lib/company';

/**
 * Server-rendered PDF of the inspection report (IN15) with @react-pdf/renderer.
 * Mirrors the HTML template's structure: summary, guided photo series,
 * findings (with photos), pre-existing damage, verification. Dutch, like the
 * HTML report. Rendered through renderInspectionPdf() in pdf-render.ts.
 */

export type PdfImage = { data: Buffer; format: 'jpg' | 'png' };
export type PdfImages = Map<string, PdfImage>; // photo id -> image

const C = {
  text: '#0c131b',
  body: '#2d343b',
  muted: '#585e65',
  faint: '#8a9096',
  rule: '#dadee3',
  sunken: '#eff3f6',
  accent: '#b35627',
  positive: '#1e7546',
  warn: '#9a6b00',
};

const S = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 52, paddingHorizontal: 44, fontFamily: 'Helvetica', fontSize: 9.5, color: C.body, lineHeight: 1.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1.5, borderBottomColor: C.text, paddingBottom: 6, marginBottom: 14 },
  brand: { fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: C.text, fontFamily: 'Helvetica-Bold' },
  ref: { fontSize: 8, color: C.muted, fontFamily: 'Courier' },
  h1: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.text, marginTop: 6, marginBottom: 8, lineHeight: 1.15 },
  lead: { fontSize: 9, color: C.muted, marginTop: 2, marginBottom: 12 },
  h2: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text, marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: C.rule },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: C.rule },
  k: { width: 95, color: C.muted },
  v: { flex: 1, color: C.text },
  kpis: { flexDirection: 'row', marginTop: 10 },
  kpi: { flex: 1, backgroundColor: C.sunken, borderRadius: 4, padding: 8, marginRight: 6 },
  kpiNum: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.text },
  kpiLbl: { fontSize: 7.5, color: C.muted, marginTop: 1 },
  note: { fontSize: 8.5, color: C.muted, marginTop: 8, lineHeight: 1.5 },
  card: { borderWidth: 0.5, borderColor: C.rule, borderRadius: 4, padding: 8, marginBottom: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  fref: { fontFamily: 'Courier-Bold', fontSize: 9, color: C.accent, width: 34 },
  ftitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.text, flex: 1 },
  fsev: { fontSize: 8, color: C.muted },
  row: { flexDirection: 'row', paddingVertical: 1.5 },
  rk: { width: 80, color: C.muted, fontSize: 8.5 },
  rv: { flex: 1, color: C.body, fontSize: 8.5 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  photoBox: { width: 96, marginRight: 6, marginBottom: 6 },
  photoImg: { width: 96, height: 72, objectFit: 'cover', borderRadius: 3, backgroundColor: C.sunken },
  photoCap: { fontSize: 7, color: C.muted, marginTop: 1, fontFamily: 'Courier' },
  shotBox: { width: '25%', paddingRight: 8, marginBottom: 10 },
  shotImg: { width: '100%', height: 84, objectFit: 'cover', borderRadius: 3, backgroundColor: C.sunken },
  footer: { position: 'absolute', left: 44, right: 44, bottom: 26, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: C.faint, borderTopWidth: 0.5, borderTopColor: C.rule, paddingTop: 4 },
  watermark: { position: 'absolute', top: 330, left: 80, fontSize: 64, color: '#e5e7eb', fontFamily: 'Helvetica-Bold', transform: 'rotate(-28deg)' },
  verRow: { flexDirection: 'row', paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: C.rule },
  vk: { width: 120, color: C.muted, fontSize: 8.5 },
  vv: { flex: 1, color: C.text, fontSize: 8.5, fontFamily: 'Courier' },
  sig: { width: 160, height: 60, objectFit: 'contain', borderWidth: 0.5, borderColor: C.rule, borderRadius: 3, marginTop: 4 },
});

const SEV_LABEL: Record<number, string> = { 1: 'Licht', 2: 'Matig', 3: 'Zwaar', 4: 'Zeer zwaar' };
const DISP: Record<string, string> = { herstellen: 'Herstellen', vervangen: 'Vervangen', onderzoeken: 'Onderzoeken', geen_actie: 'Geen actie' };
const PURPOSE: Record<string, string> = { particulier: 'Particulier', verzekering: 'Verzekering', intern: 'Intern' };
const SHOT_LABEL: Record<string, string> = {
  front: 'Voorzijde', front_left: 'Linksvoor', left: 'Linkerzijde', rear_left: 'Linksachter', rear: 'Achterzijde',
  rear_right: 'Rechtsachter', right: 'Rechterzijde', front_right: 'Rechtsvoor', roof: 'Dak', dashboard: 'Dashboard',
  odometer: 'Kilometerstand', vin_plate: 'VIN plaatje',
};

const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtDateTime = (iso: string | null) => iso ? `${fmtDate(iso)} ${new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}` : '—';
const hrs = (n: number) => `${n.toFixed(1).replace('.', ',')} u`;
const short = (h: string | null | undefined) => h ? `${h.slice(0, 8)}…${h.slice(-8)}` : '—';

export type InspectionPdfProps = {
  data: InspectionReportData;
  company: CompanyInfo;
  images: PdfImages;
  /** component key -> Dutch name */
  componentNames?: Record<string, string>;
  signatures?: Map<string, PdfImage>; // approval id -> signature image
};

export function InspectionPdf({ data, company, images, componentNames = {}, signatures }: InspectionPdfProps) {
  const findings = [...(data.ins_findings ?? [])].sort((a, b) => a.sequence_no - b.sequence_no);
  const inScope = findings.filter(f => f.origin !== 'pre_existent');
  const pre = findings.filter(f => f.origin === 'pre_existent');
  const photos = data.ins_photos ?? [];
  const guided = photos.filter(p => p.kind === 'shot');
  const approvals = data.ins_approvals ?? [];
  const snapshot = data.ins_snapshots?.[0];
  const repairTotal = inScope.reduce((a, f) => a + f.repair_hours, 0);
  const paintTotal = inScope.reduce((a, f) => a + f.paint_hours, 0);
  const partCount = inScope.reduce((a, f) => a + (f.ins_finding_parts?.length || 0), 0);
  const locked = data.status === 'VERGRENDELD';
  const name = (key: string) => componentNames[key] ?? key;

  const Footer = () => (
    <View style={S.footer} fixed>
      <Text>{company.legal_name} · {company.address} · {company.postcode} {company.city} · KvK {company.kvk} · BTW {company.vat_number}</Text>
      <Text render={({ pageNumber, totalPages }) => `${data.reference} · blad ${pageNumber}/${totalPages}`} />
    </View>
  );
  const Header = ({ sub }: { sub: string }) => (
    <View style={S.header} fixed>
      <Text style={S.brand}>{company.name} · {sub}</Text>
      <Text style={S.ref}>{data.reference}</Text>
    </View>
  );
  const Watermark = () => (!locked ? <Text style={S.watermark} fixed>CONCEPT</Text> : null);

  return (
    <Document title={`Schadeopname ${data.reference}`} author={company.legal_name} subject="Schadeopname">
      {/* ── Blad 1: samenvatting ── */}
      <Page size="A4" style={S.page}>
        <Watermark />
        <Header sub="Schadeopname" />
        <Text style={S.h1}>Schadeopname</Text>
        <Text style={S.lead}>Opname van de vastgestelde staat van het voertuig en de voorgestelde herstelwijze. Geen expertiserapport — opgesteld door de herstellende partij.</Text>

        <View style={S.grid}>
          {([
            ['Kenteken', data.licence_plate || '—'],
            ['Referentie', data.reference],
            ['Merk / model', `${data.make || ''} ${data.model || ''}`.trim() || '—'],
            ['Soort opname', data.purpose ? (PURPOSE[data.purpose] ?? data.purpose) : '—'],
            ['VIN', data.vin || '—'],
            ['Schadedatum', fmtDate(data.event_date)],
            ['Eerste toelating', fmtDate(data.first_reg_date)],
            ['Opnemer', data.staff?.name || '—'],
            ['Kilometerstand', data.odometer_km ? `${data.odometer_km.toLocaleString('nl-NL')} km` : '—'],
            ['Klant', data.customers?.name || '—'],
            ['Brandstof', data.fuel || '—'],
            ['Status', locked ? `Vergrendeld ${fmtDateTime(data.locked_at)}` : data.status],
            ...(data.insurer_name ? [['Verzekeraar', data.insurer_name]] : []),
            ...(data.claim_number ? [['Schadenummer', data.claim_number]] : []),
          ] as [string, string][]).map(([k, v]) => (
            <View key={k} style={S.cell}><Text style={S.k}>{k}</Text><Text style={S.v}>{v}</Text></View>
          ))}
        </View>

        <View style={S.kpis}>
          {[
            [String(inScope.length), 'Bevindingen'],
            [hrs(repairTotal), 'Plaatwerk'],
            [hrs(paintTotal), 'Spuitwerk'],
            [String(partCount), 'Onderdelen'],
            [String(photos.length), "Foto's"],
          ].map(([n, l]) => (
            <View key={l} style={S.kpi}><Text style={S.kpiNum}>{n}</Text><Text style={S.kpiLbl}>{l}</Text></View>
          ))}
        </View>

        {data.event_description ? (
          <>
            <Text style={S.h2}>Toedracht</Text>
            <Text>{data.event_description}</Text>
          </>
        ) : null}

        <Text style={S.h2}>Overzicht bevindingen</Text>
        {inScope.map(f => (
          <View key={f.id} style={S.row}>
            <Text style={[S.rk, { width: 34, fontFamily: 'Courier' }]}>{f.reference}</Text>
            <Text style={[S.rv, { flex: 2 }]}>{name(f.component_key)}{f.sub_location ? ` · ${f.sub_location}` : ''}</Text>
            <Text style={[S.rv, { flex: 1.5 }]}>{(f.damage_types || []).join(', ') || '—'}</Text>
            <Text style={[S.rv, { flex: 1 }]}>{DISP[f.disposition] ?? f.disposition}</Text>
            <Text style={[S.rv, { flexGrow: 0, flexShrink: 0, flexBasis: 60, textAlign: 'right' }]}>{hrs(f.repair_hours + f.paint_hours)}</Text>
          </View>
        ))}
        {inScope.length === 0 && <Text style={S.note}>Geen bevindingen vastgelegd.</Text>}

        <Text style={S.note}>
          Voorbehoud: verborgen schade kan pas na demontage worden vastgesteld. Genoemde uren zijn indicatief en gebaseerd op de zichtbare schade op het moment van opname.
        </Text>
        <Footer />
      </Page>

      {/* ── Fotoserie ── */}
      {guided.length > 0 && (
        <Page size="A4" style={S.page}>
          <Watermark />
          <Header sub="Fotoserie · geleide opnames" />
          <Text style={S.lead}>Vaste opnames rondom het voertuig. Alle bestanden zijn write-once vastgelegd met sha256.</Text>
          <View style={S.grid}>
            {guided.map(p => {
              const img = images.get(p.id);
              return (
                <View key={p.id} style={S.shotBox} wrap={false}>
                  {img ? <Image style={S.shotImg} src={img} /> : <View style={S.shotImg} />}
                  <Text style={S.photoCap}>{p.reference} · {p.shot_key ? (SHOT_LABEL[p.shot_key] ?? p.shot_key) : p.caption ?? ''}</Text>
                </View>
              );
            })}
          </View>
          <Footer />
        </Page>
      )}

      {/* ── Bevindingen ── */}
      {inScope.length > 0 && (
        <Page size="A4" style={S.page}>
          <Watermark />
          <Header sub="Bevindingen en herstelplan" />
          {inScope.map(f => {
            const fp = photos.filter(p => p.finding_id === f.id);
            return (
              <View key={f.id} style={S.card} wrap={false}>
                <View style={S.cardHead}>
                  <Text style={S.fref}>{f.reference}</Text>
                  <Text style={S.ftitle}>{name(f.component_key)}</Text>
                  <Text style={S.fsev}>{SEV_LABEL[f.severity] ?? ''}</Text>
                </View>
                {([
                  ['Locatie', f.sub_location ? `${name(f.component_key)} · ${f.sub_location}` : name(f.component_key)],
                  ['Schade', (f.damage_types || []).join(', ') || '—'],
                  ['Herstelwijze', f.repair_technique || DISP[f.disposition] || '—'],
                  ['Lakwerk', f.paint_required ? `${f.paint_operation || 'paneel'}${f.blend_components?.length ? ` · inspuiten ${f.blend_components.map(name).join(', ')}` : ''}` : 'Niet vereist'],
                  ['Uren', `Plaatwerk ${hrs(f.repair_hours)} · Spuitwerk ${hrs(f.paint_hours)}`],
                  ...(f.ins_finding_parts?.length ? [['Onderdelen', f.ins_finding_parts.map(p => `${p.description}${p.part_number ? ` (${p.part_number})` : ''} × ${p.qty}`).join(' · ')]] : []),
                  ...(f.hidden_damage_possible ? [['Voorbehoud', f.hidden_damage_note || 'Verborgen schade mogelijk']] : []),
                  ...(f.adas_possible ? [['Rijhulpsystemen', 'Kalibratie mogelijk vereist']] : []),
                  ...(f.description ? [['Toelichting', f.description]] : []),
                ] as [string, string][]).map(([k, v]) => (
                  <View key={k} style={S.row}><Text style={S.rk}>{k}</Text><Text style={S.rv}>{v}</Text></View>
                ))}
                {fp.length > 0 && (
                  <View style={S.photoRow}>
                    {fp.slice(0, 4).map(p => {
                      const img = images.get(p.id);
                      return (
                        <View key={p.id} style={S.photoBox}>
                          {img ? <Image style={S.photoImg} src={img} /> : <View style={S.photoImg} />}
                          <Text style={S.photoCap}>{p.reference}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
          <Footer />
        </Page>
      )}

      {/* ── Pre-existente schade ── */}
      {pre.length > 0 && (
        <Page size="A4" style={S.page}>
          <Watermark />
          <Header sub="Pre-existente schade · buiten opdracht" />
          <Text style={S.lead}>Reeds aanwezige schade die niet in het herstelplan is opgenomen. Vastgelegd ter bescherming van beide partijen.</Text>
          {pre.map(f => {
            const fp = photos.filter(p => p.finding_id === f.id);
            const img = fp[0] ? images.get(fp[0].id) : undefined;
            return (
              <View key={f.id} style={[S.row, { borderBottomWidth: 0.5, borderBottomColor: C.rule, paddingVertical: 5, alignItems: 'center' }]} wrap={false}>
                {img ? <Image style={{ width: 54, height: 40, objectFit: 'cover', borderRadius: 3, marginRight: 8 }} src={img} /> : <View style={{ width: 54, marginRight: 8 }} />}
                <Text style={[S.rk, { width: 34, fontFamily: 'Courier' }]}>{f.reference}</Text>
                <Text style={[S.rv, { flex: 2 }]}>{name(f.component_key)}</Text>
                <Text style={[S.rv, { flex: 2 }]}>{(f.damage_types || []).join(', ') || '—'}{f.description ? ` · ${f.description}` : ''}</Text>
              </View>
            );
          })}
          <Footer />
        </Page>
      )}

      {/* ── Verificatie ── */}
      <Page size="A4" style={S.page}>
        <Watermark />
        <Header sub="Verificatie en ondertekening" />
        <Text style={S.h2}>Integriteit</Text>
        {([
          ['Snapshot-hash', short(snapshot?.snapshot_hash)],
          ['Vergrendeld op', fmtDateTime(data.locked_at)],
          ["Foto's", `${photos.length} bestanden, elk met sha256`],
          ['Bevindingen', String(findings.length)],
        ] as [string, string][]).map(([k, v]) => (
          <View key={k} style={S.verRow}><Text style={S.vk}>{k}</Text><Text style={S.vv}>{v}</Text></View>
        ))}

        <Text style={S.h2}>Ondertekening</Text>
        {approvals.length === 0 && <Text style={S.note}>Nog niet ondertekend.</Text>}
        {approvals.map(a => {
          const sig = signatures?.get(a.id);
          return (
            <View key={a.id} style={{ marginBottom: 12 }} wrap={false}>
              {([
                ['Rol', a.role === 'klant' ? 'Klant' : 'Opnemer'],
                ['Naam', a.signer_name],
                ['Identificatie', a.identification === 'share_link' ? 'Ondertekenlink (e-mail)' : a.identification === 'staff_login' ? 'Ingelogde medewerker' : a.identification || '—'],
                ['Verklaring', a.statement_text || 'Opname ingezien en akkoord'],
                ['Tijdstip', fmtDateTime(a.signed_at)],
                ['Document-hash', short(a.document_hash)],
              ] as [string, string][]).map(([k, v]) => (
                <View key={k} style={S.verRow}><Text style={S.vk}>{k}</Text><Text style={[S.vv, k === 'Tijdstip' || k === 'Document-hash' ? {} : { fontFamily: 'Helvetica' }]}>{v}</Text></View>
              ))}
              {sig && <Image style={S.sig} src={sig} />}
            </View>
          );
        })}
        <Text style={S.note}>
          Gewone elektronische handtekening (eIDAS art. 25 lid 1). Bewaarde bewijsmiddelen: verklaringstekst, tijdstempel, IP-adres, user-agent en de document-hash op het moment van ondertekening.
        </Text>
        <Footer />
      </Page>
    </Document>
  );
}
