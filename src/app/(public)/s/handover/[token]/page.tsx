'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle, AlertCircle, FileText, Pen,
  CheckSquare, Square, Printer,
} from 'lucide-react';

type HandoverPublic = {
  id: string;
  doc_number: string | null;
  status: string;
  locale: string;
  gallery_consent: boolean | null;
  issued_at: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  payload: {
    work_summary: string;
    mileage_out: number;
    warranty_text: string;
    gallery_consent: boolean;
    items_returned: string[];
  };
  customers: { name: string; email: string | null; phone: string | null } | null;
  vehicles: { kenteken: string | null; make: string | null; model: string | null } | null;
  signatures: Array<{
    id: string;
    signer_name: string;
    signer_role: string;
    signature_data: string;
    created_at: string;
  }>;
};

const LABELS: Record<string, Record<string, string>> = {
  nl: {
    title: 'Afleverbon',
    workSummary: 'Werkzaamheden',
    mileage: 'Kilometerstand bij aflevering',
    warranty: 'Garantie',
    returnedItems: 'Teruggegeven onderdelen',
    galleryConsent: 'Ik geef toestemming voor het gebruik van foto\'s in het portfolio van Colourking.',
    signHere: 'Tekenen',
    signerName: 'Uw naam',
    sign: 'Onderteken',
    clear: 'Wissen',
    cancel: 'Annuleren',
    signed: 'Getekend',
    signedBy: 'Getekend door',
    notFound: 'Afleverbon niet gevonden',
    expired: 'Deze link is verlopen',
    vehicle: 'Voertuig',
    date: 'Datum',
    print: 'Afdrukken',
    km: 'km',
    thankYou: 'Bedankt voor het tekenen!',
    alreadySigned: 'Dit document is al ondertekend.',
  },
  en: {
    title: 'Handover Note',
    workSummary: 'Work performed',
    mileage: 'Mileage at handover',
    warranty: 'Warranty',
    returnedItems: 'Items returned',
    galleryConsent: 'I give consent for use of photos in Colourking\'s portfolio.',
    signHere: 'Sign',
    signerName: 'Your name',
    sign: 'Sign',
    clear: 'Clear',
    cancel: 'Cancel',
    signed: 'Signed',
    signedBy: 'Signed by',
    notFound: 'Handover note not found',
    expired: 'This link has expired',
    vehicle: 'Vehicle',
    date: 'Date',
    print: 'Print',
    km: 'km',
    thankYou: 'Thank you for signing!',
    alreadySigned: 'This document has already been signed.',
  },
  tr: {
    title: 'Teslim Belgesi',
    workSummary: 'Yapılan işler',
    mileage: 'Teslim kilometre',
    warranty: 'Garanti',
    returnedItems: 'İade edilen parçalar',
    galleryConsent: 'Colourking portfolyosunda fotoğrafların kullanılmasına izin veriyorum.',
    signHere: 'İmzala',
    signerName: 'Adınız',
    sign: 'İmzala',
    clear: 'Temizle',
    cancel: 'İptal',
    signed: 'İmzalandı',
    signedBy: 'İmzalayan',
    notFound: 'Teslim belgesi bulunamadı',
    expired: 'Bu bağlantının süresi dolmuş',
    vehicle: 'Araç',
    date: 'Tarih',
    print: 'Yazdır',
    km: 'km',
    thankYou: 'İmzaladığınız için teşekkürler!',
    alreadySigned: 'Bu belge zaten imzalanmış.',
  },
};

function formatDate(iso: string, locale: string): string {
  const loc = locale === 'nl' ? 'nl-NL' : locale === 'tr' ? 'tr-TR' : 'en-GB';
  return new Date(iso).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PublicHandoverPage() {
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<HandoverPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSign, setShowSign] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [consent, setConsent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [justSigned, setJustSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const load = () => {
    fetch(`/api/public/handover/${token}`)
      .then(r => {
        if (r.status === 410) throw new Error('expired');
        if (!r.ok) throw new Error('not_found');
        return r.json();
      })
      .then(setDoc)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const locale = doc?.locale ?? 'nl';
  const t = LABELS[locale] ?? LABELS.nl;

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const startDraw = (x: number, y: number) => {
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => { isDrawing.current = false; };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (!signerName.trim() || !canvasRef.current) return;
    setSigning(true);

    const signatureData = canvasRef.current.toDataURL('image/png');

    const res = await fetch(`/api/public/handover/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sign',
        signer_name: signerName,
        signature_data: signatureData,
      }),
    });

    if (consent) {
      await fetch(`/api/public/handover/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'gallery_consent', consent: true }),
      });
    }

    if (res.ok) {
      setJustSigned(true);
      setShowSign(false);
      load();
    }
    setSigning(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">
            {error === 'expired' ? t.expired : t.notFound}
          </p>
        </div>
      </div>
    );
  }

  const p = doc.payload;
  const hasSig = doc.signatures.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Colourking</h1>
          <p className="mt-1 text-sm text-gray-500">Bodyshop & Repair</p>
        </div>

        {/* Signed confirmation */}
        {justSigned && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-600" />
            <h2 className="text-lg font-semibold text-emerald-900">{t.thankYou}</h2>
          </div>
        )}

        {/* Main card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Doc header */}
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{t.title}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                  {doc.doc_number ?? '—'}
                </p>
              </div>
              {hasSig && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle size={12} />
                  {t.signed}
                </span>
              )}
            </div>

            {doc.customers && (
              <p className="mt-3 text-sm text-gray-600">{doc.customers.name}</p>
            )}
            {doc.vehicles && (
              <p className="mt-1 text-sm text-gray-500">
                {t.vehicle}: {doc.vehicles.kenteken ?? `${doc.vehicles.make ?? ''} ${doc.vehicles.model ?? ''}`}
              </p>
            )}
            {doc.issued_at && (
              <p className="mt-1 text-xs text-gray-400">
                {t.date}: {formatDate(doc.issued_at, locale)}
              </p>
            )}
          </div>

          {/* Work summary */}
          <div className="border-b border-gray-100 p-6">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">{t.workSummary}</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{p.work_summary}</p>
          </div>

          {/* Mileage */}
          <div className="border-b border-gray-100 p-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">{t.mileage}</h3>
            <p className="font-mono text-base font-semibold text-gray-900">
              {p.mileage_out > 0 ? `${p.mileage_out.toLocaleString('nl-NL')} ${t.km}` : '—'}
            </p>
          </div>

          {/* Warranty */}
          {p.warranty_text && (
            <div className="border-b border-gray-100 p-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">{t.warranty}</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{p.warranty_text}</p>
            </div>
          )}

          {/* Items returned */}
          {p.items_returned.length > 0 && (
            <div className="border-b border-gray-100 p-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">{t.returnedItems}</h3>
              <ul className="space-y-2">
                {p.items_returned.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckSquare size={14} className="text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Existing signatures */}
          {hasSig && (
            <div className="border-b border-gray-100 p-6">
              {doc.signatures.map(sig => (
                <div key={sig.id} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                    <span>{t.signedBy}: {sig.signer_name}</span>
                    <span>{formatDate(sig.created_at, locale)}</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sig.signature_data}
                    alt={sig.signer_name}
                    className="h-16 rounded-lg border border-gray-200 bg-gray-50 object-contain"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Sign section */}
          {!hasSig && (
            <div className="p-6">
              {showSign ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">{t.signerName}</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <canvas
                      ref={canvasRef}
                      className="h-32 w-full cursor-crosshair rounded-lg border border-gray-300 bg-white touch-none"
                      onMouseDown={e => { initCanvas(); const p = getPos(e); startDraw(p.x, p.y); }}
                      onMouseMove={e => { const p = getPos(e); draw(p.x, p.y); }}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={e => { e.preventDefault(); initCanvas(); const p = getTouchPos(e); startDraw(p.x, p.y); }}
                      onTouchMove={e => { e.preventDefault(); const p = getTouchPos(e); draw(p.x, p.y); }}
                      onTouchEnd={endDraw}
                    />
                    <button
                      onClick={clearCanvas}
                      className="mt-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      {t.clear}
                    </button>
                  </div>

                  {/* Gallery consent */}
                  <button
                    onClick={() => setConsent(!consent)}
                    className="flex items-start gap-2 text-left text-sm text-gray-600"
                  >
                    {consent ? (
                      <CheckSquare size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                    ) : (
                      <Square size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    )}
                    {t.galleryConsent}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSign}
                      disabled={signing || !signerName.trim()}
                      className="flex-1 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                    >
                      {signing ? '...' : t.sign}
                    </button>
                    <button
                      onClick={() => setShowSign(false)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSign(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  <Pen size={18} />
                  {t.signHere}
                </button>
              )}
            </div>
          )}

          {/* Print button */}
          <div className="border-t border-gray-100 p-6 text-center">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <Printer size={14} />
              {t.print}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by Colourking
        </p>
      </div>
    </div>
  );
}
