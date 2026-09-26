'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Pen, Camera } from 'lucide-react';
import { VehicleDamageMap, COMPONENT_SLOTS, defaultPointForKey, type MapMarker } from '@/components/shared/VehicleDamageMap';

/**
 * Public customer signing page for an inspection (share link).
 * Like /s/handover this route has no locale prefix and no intl provider, so
 * labels live here in nl/en/tr and the customer can switch language.
 */

type Locale = 'nl' | 'en' | 'tr';

type Finding = {
  id: string;
  reference: string;
  component_key: string;
  component_name: { nl: string; en: string | null; tr: string | null } | null;
  damage_types: string[];
  severity: number;
  origin: string;
  disposition: string;
  repair_hours: number;
  paint_required: boolean;
  paint_hours: number;
  description: string | null;
  hotspot_point: { x: number; y: number } | null;
};

type Photo = { id: string; reference: string; kind: string; finding_id: string | null; shot_key: string | null; caption: string | null; url: string | null };

type View = {
  id: string;
  reference: string;
  status: string;
  purpose: string;
  licence_plate: string | null;
  make: string | null;
  model: string | null;
  odometer_km: number | null;
  event_date: string | null;
  event_description: string | null;
  total_hours: number;
  finding_count: number;
  submitted_at: string | null;
  locked_at: string | null;
  customer: { name: string } | null;
  inspector: { name: string } | null;
  findings: Finding[];
  photos: Photo[];
  approvals: { role: string; signer_name: string; signed_at: string }[];
  token: { expires_at: string; used_at: string | null; recipient_email: string | null };
};

const LABELS: Record<Locale, Record<string, string>> = {
  nl: {
    title: 'Schadeopname',
    intro: 'Bekijk de vastgestelde schade en onderteken voor akkoord.',
    vehicle: 'Voertuig',
    plate: 'Kenteken',
    odometer: 'Kilometerstand',
    inspector: 'Opnemer',
    date: 'Datum opname',
    eventDate: 'Schadedatum',
    findings: 'Bevindingen',
    preExisting: 'pre-existent (buiten opdracht)',
    hours: 'uur',
    bodywork: 'plaatwerk',
    paint: 'spuitwerk',
    photos: "Foto's",
    disp_herstellen: 'Herstellen',
    disp_vervangen: 'Vervangen',
    disp_onderzoeken: 'Nader onderzoeken',
    disp_geen_actie: 'Geen actie',
    declaration: 'Ondergetekende verklaart de bovenstaande opname te hebben ingezien en akkoord te gaan met de vastgestelde staat van het voertuig en de voorgestelde herstelwijze, met inachtneming van het voorbehoud voor verborgen schade.',
    signerName: 'Uw naam',
    signerEmail: 'Uw e-mailadres (optioneel)',
    signHere: 'Teken hier',
    clear: 'Wissen',
    sign: 'Onderteken en ga akkoord',
    signing: 'Bezig...',
    signed: 'Ondertekend',
    signedBy: 'Ondertekend door',
    thankYou: 'Bedankt! Uw akkoord is vastgelegd.',
    alreadySigned: 'Deze opname is al door u ondertekend.',
    notOpen: 'Deze opname is nog niet klaar om te ondertekenen. Probeer het later opnieuw.',
    locked: 'Deze opname is afgerond en vergrendeld.',
    notFound: 'Opname niet gevonden.',
    expired: 'Deze link is verlopen. Vraag een nieuwe link aan bij ColourKing.',
    error: 'Er ging iets mis. Probeer het opnieuw.',
    eSign: 'Gewone elektronische handtekening (eIDAS art. 25). Vastgelegd worden: verklaring, tijdstip, IP-adres, browser en de document-hash.',
    legalNote: 'Geen expertiserapport — opgesteld door de herstellende partij.',
  },
  en: {
    title: 'Damage inspection',
    intro: 'Review the recorded damage and sign to approve.',
    vehicle: 'Vehicle',
    plate: 'Registration',
    odometer: 'Odometer',
    inspector: 'Inspector',
    date: 'Inspection date',
    eventDate: 'Damage date',
    findings: 'Findings',
    preExisting: 'pre-existing (out of scope)',
    hours: 'h',
    bodywork: 'bodywork',
    paint: 'paint',
    photos: 'Photos',
    disp_herstellen: 'Repair',
    disp_vervangen: 'Replace',
    disp_onderzoeken: 'Investigate',
    disp_geen_actie: 'No action',
    declaration: 'The undersigned declares to have reviewed the above inspection and agrees with the established condition of the vehicle and the proposed repair method, taking into account the disclaimer for hidden damage.',
    signerName: 'Your name',
    signerEmail: 'Your email (optional)',
    signHere: 'Sign here',
    clear: 'Clear',
    sign: 'Sign and approve',
    signing: 'Working...',
    signed: 'Signed',
    signedBy: 'Signed by',
    thankYou: 'Thank you! Your approval has been recorded.',
    alreadySigned: 'You have already signed this inspection.',
    notOpen: 'This inspection is not ready for signing yet. Please try again later.',
    locked: 'This inspection has been finalised and locked.',
    notFound: 'Inspection not found.',
    expired: 'This link has expired. Ask ColourKing for a new one.',
    error: 'Something went wrong. Please try again.',
    eSign: 'Simple electronic signature (eIDAS art. 25). Recorded: statement, timestamp, IP address, browser and the document hash.',
    legalNote: 'Not an expert report — prepared by the repairing party.',
  },
  tr: {
    title: 'Hasar ekspertizi',
    intro: 'Kaydedilen hasarı inceleyin ve onaylamak için imzalayın.',
    vehicle: 'Araç',
    plate: 'Plaka',
    odometer: 'Kilometre',
    inspector: 'Eksper',
    date: 'Ekspertiz tarihi',
    eventDate: 'Hasar tarihi',
    findings: 'Bulgular',
    preExisting: 'önceden mevcut (kapsam dışı)',
    hours: 'sa',
    bodywork: 'kaporta',
    paint: 'boya',
    photos: 'Fotoğraflar',
    disp_herstellen: 'Onarım',
    disp_vervangen: 'Değiştirme',
    disp_onderzoeken: 'İnceleme',
    disp_geen_actie: 'İşlem yok',
    declaration: 'Aşağıda imzası bulunan kişi, yukarıdaki ekspertizi incelediğini ve gizli hasar çekincesi saklı kalmak kaydıyla aracın tespit edilen durumunu ve önerilen onarım yöntemini onayladığını beyan eder.',
    signerName: 'Adınız',
    signerEmail: 'E-posta adresiniz (isteğe bağlı)',
    signHere: 'Buraya imzalayın',
    clear: 'Temizle',
    sign: 'İmzala ve onayla',
    signing: 'İşleniyor...',
    signed: 'İmzalandı',
    signedBy: 'İmzalayan',
    thankYou: 'Teşekkürler! Onayınız kaydedildi.',
    alreadySigned: 'Bu ekspertizi zaten imzaladınız.',
    notOpen: 'Bu ekspertiz henüz imzaya hazır değil. Lütfen daha sonra tekrar deneyin.',
    locked: 'Bu ekspertiz tamamlandı ve kilitlendi.',
    notFound: 'Ekspertiz bulunamadı.',
    expired: 'Bu bağlantının süresi doldu. ColourKing’den yeni bir bağlantı isteyin.',
    error: 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',
    eSign: 'Basit elektronik imza (eIDAS md. 25). Kaydedilenler: beyan, zaman damgası, IP adresi, tarayıcı ve belge özeti.',
    legalNote: 'Ekspertiz raporu değildir — onarımı yapan tarafça hazırlanmıştır.',
  },
};

const fmtDate = (d: string | null, locale: Locale) =>
  d ? new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'tr' ? 'tr-TR' : 'nl-NL') : '—';
const hrs = (n: number) => n.toFixed(1).replace('.', ',');

export default function InspectionSignPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<Locale>('nl');
  const [view, setView] = useState<View | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not_found' | 'expired' | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const [justSigned, setJustSigned] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const q = searchParams.get('lang');
    const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'nl';
    const pick = (q || nav) as string;
    setLocale(pick === 'en' || pick === 'tr' ? pick : 'nl');
  }, [searchParams]);

  const t = LABELS[locale];

  const load = () => {
    fetch(`/api/public/inspection/${token}`)
      .then(async r => {
        if (r.status === 410) throw new Error('expired');
        if (!r.ok) throw new Error('not_found');
        return r.json();
      })
      .then((v: View) => { setView(v); if (v.token.recipient_email) setSignerEmail(v.token.recipient_email); })
      .catch(e => setError(e.message === 'expired' ? 'expired' : 'not_found'))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [token]);

  const componentName = (f: Finding) =>
    (locale === 'en' && f.component_name?.en) || (locale === 'tr' && f.component_name?.tr) || f.component_name?.nl || f.component_key;

  const markers = useMemo<MapMarker[]>(() => (view?.findings ?? []).flatMap(f => {
    const point = f.hotspot_point ?? defaultPointForKey(f.component_key);
    return point ? [{ id: f.id, point, label: f.reference, muted: f.origin === 'pre_existent' }] : [];
  }), [view]);

  // ── canvas helpers ──
  const ctx = () => {
    const c = canvasRef.current; if (!c) return null;
    if (c.width !== c.offsetWidth * 2) { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; }
    const x = c.getContext('2d'); if (!x) return null;
    x.lineWidth = 3; x.lineCap = 'round'; x.strokeStyle = '#111'; return x;
  };
  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const p = 'touches' in e ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * 2, y: (p.clientY - r.top) * 2 };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => { const x = ctx(); if (!x) return; const p = pos(e); x.beginPath(); x.moveTo(p.x, p.y); drawing.current = true; };
  const move = (e: React.MouseEvent | React.TouchEvent) => { if (!drawing.current) return; const x = ctx(); if (!x) return; const p = pos(e); x.lineTo(p.x, p.y); x.stroke(); setHasInk(true); };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = canvasRef.current; const x = c?.getContext('2d'); if (c && x) x.clearRect(0, 0, c.width, c.height); setHasInk(false); };

  const handleSign = async () => {
    if (!signerName.trim() || !hasInk || !canvasRef.current) return;
    setSigning(true); setSignError('');
    try {
      const res = await fetch(`/api/public/inspection/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName.trim(),
          signer_email: signerEmail.trim() || null,
          signature_data: canvasRef.current.toDataURL('image/png'),
          statement_text: t.declaration,
        }),
      });
      if (!res.ok) {
        if (res.status === 409) { setJustSigned(false); load(); return; }
        if (res.status === 423) { setSignError(t.notOpen); return; }
        if (res.status === 410) { setError('expired'); return; }
        setSignError(t.error); return;
      }
      setJustSigned(true);
      load();
    } finally { setSigning(false); }
  };

  const LangSwitch = (
    <div className="flex gap-1 text-xs">
      {(['nl', 'en', 'tr'] as Locale[]).map(l => (
        <button key={l} onClick={() => setLocale(l)} className={`rounded px-2 py-1 uppercase ${locale === l ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-200'}`}>{l}</button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
          <p className="text-gray-700">{error === 'expired' ? t.expired : t.notFound}</p>
        </div>
      </div>
    );
  }

  const customerApproval = view.approvals.find(a => a.role === 'klant');
  const isLocked = view.status === 'VERGRENDELD' || view.status === 'GEANNULEERD';
  const canSign = view.status === 'TER_AKKOORD' && !customerApproval && !view.token.used_at;
  const guided = view.photos.filter(p => p.kind === 'shot');
  const inScope = view.findings.filter(f => f.origin !== 'pre_existent');
  const pre = view.findings.filter(f => f.origin === 'pre_existent');
  const repairTotal = inScope.reduce((a, f) => a + f.repair_hours, 0);
  const paintTotal = inScope.reduce((a, f) => a + f.paint_hours, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">ColourKing Autoschade</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">{t.title}</h1>
              <p className="font-mono text-sm text-gray-500">{view.reference}</p>
            </div>
            {LangSwitch}
          </div>
          <p className="mt-3 text-sm text-gray-600">{t.intro}</p>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-gray-500">{t.vehicle}</dt><dd className="text-gray-900">{[view.make, view.model].filter(Boolean).join(' ') || '—'}</dd>
            <dt className="text-gray-500">{t.plate}</dt><dd className="font-mono text-gray-900">{view.licence_plate ?? '—'}</dd>
            <dt className="text-gray-500">{t.odometer}</dt><dd className="text-gray-900">{view.odometer_km ? `${view.odometer_km.toLocaleString('nl-NL')} km` : '—'}</dd>
            <dt className="text-gray-500">{t.inspector}</dt><dd className="text-gray-900">{view.inspector?.name ?? '—'}</dd>
            <dt className="text-gray-500">{t.date}</dt><dd className="text-gray-900">{fmtDate(view.submitted_at, locale)}</dd>
            <dt className="text-gray-500">{t.eventDate}</dt><dd className="text-gray-900">{fmtDate(view.event_date, locale)}</dd>
          </dl>
        </div>

        {/* Map + findings */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t.findings} <span className="text-sm font-normal text-gray-500">({inScope.length})</span>
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="mx-auto w-[200px] flex-none rounded-xl bg-gray-50 p-2" style={{ ['--ck-border-2' as string]: '#d1d5db', ['--ck-border' as string]: '#e5e7eb', ['--ck-text-muted' as string]: '#6b7280', ['--ck-surface-2' as string]: '#fff' }}>
              <VehicleDamageMap slots={COMPONENT_SLOTS} showLabels={false} markers={markers} className="w-full" />
            </div>
            <ul className="min-w-0 flex-1 divide-y divide-gray-100">
              {inScope.map(f => (
                <li key={f.id} className="py-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-gray-500">{f.reference}</span>
                    <span className="text-sm font-medium text-gray-900">{componentName(f)}</span>
                    <span className="ml-auto text-xs text-gray-500">{t[`disp_${f.disposition}`] ?? f.disposition}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {f.damage_types.join(', ')}{f.damage_types.length ? ' · ' : ''}
                    {hrs(f.repair_hours)} {t.hours} {t.bodywork}{f.paint_required ? ` · ${hrs(f.paint_hours)} ${t.hours} ${t.paint}` : ''}
                  </p>
                  {f.description && <p className="mt-0.5 text-xs text-gray-600">{f.description}</p>}
                </li>
              ))}
              {pre.map(f => (
                <li key={f.id} className="py-2.5 opacity-70">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-gray-500">{f.reference}</span>
                    <span className="text-sm text-gray-700">{componentName(f)}</span>
                    <span className="ml-auto text-[11px] italic text-gray-400">{t.preExisting}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 border-t border-gray-100 pt-3 text-right text-sm text-gray-700">
            {hrs(repairTotal)} {t.hours} {t.bodywork} · {hrs(paintTotal)} {t.hours} {t.paint}
          </p>
        </div>

        {/* Photos */}
        {view.photos.some(p => p.url) && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900"><Camera size={16} /> {t.photos}</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {[...guided, ...view.photos.filter(p => p.kind !== 'shot')].filter(p => p.url).map(p => (
                <a key={p.id} href={p.url!} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url!} alt={p.reference} className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1 font-mono text-[10px] text-gray-700">{p.reference}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Signing */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {justSigned || customerApproval ? (
            <div className="text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
              <p className="font-medium text-gray-900">{justSigned ? t.thankYou : t.alreadySigned}</p>
              {customerApproval && (
                <p className="mt-1 text-sm text-gray-500">{t.signedBy} {customerApproval.signer_name} · {fmtDate(customerApproval.signed_at, locale)}</p>
              )}
            </div>
          ) : isLocked ? (
            <p className="text-center text-sm text-gray-600">{t.locked}</p>
          ) : !canSign ? (
            <p className="text-center text-sm text-gray-600">{t.notOpen}</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-gray-700">{t.declaration}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder={t.signerName}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                />
                <input
                  value={signerEmail}
                  onChange={e => setSignerEmail(e.target.value)}
                  placeholder={t.signerEmail}
                  type="email"
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <p className="mb-1 flex items-center gap-1 text-xs text-gray-500"><Pen size={12} /> {t.signHere}</p>
                <canvas
                  ref={canvasRef}
                  className="h-36 w-full cursor-crosshair touch-none rounded-lg border border-gray-300 bg-white"
                  onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                  onTouchStart={e => { e.preventDefault(); start(e); }} onTouchMove={e => { e.preventDefault(); move(e); }} onTouchEnd={end}
                />
                <button onClick={clear} className="mt-1 text-xs text-gray-400 hover:text-gray-600">{t.clear}</button>
              </div>
              {signError && <p className="text-sm text-red-600">{signError}</p>}
              <button
                onClick={handleSign}
                disabled={signing || !signerName.trim() || !hasInk}
                className="w-full rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {signing ? t.signing : t.sign}
              </button>
              <p className="text-[11px] leading-relaxed text-gray-400">{t.eSign}</p>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400">{t.legalNote}</p>
      </div>
    </div>
  );
}
