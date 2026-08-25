'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Send, Hash, Calendar,
  User, Car, Pen, Printer, AlertTriangle,
} from 'lucide-react';
import SignatureCanvas from '@/components/SignatureCanvas';
import type { DocStatus } from '@/types/database';

type Signature = {
  id: string;
  signer_name: string;
  signer_role: string;
  signature_data: string;
  created_at: string;
};

type RepairOrderDetail = {
  id: string;
  doc_type: 'repair_order';
  doc_number: string | null;
  status: DocStatus;
  job_id: string | null;
  customer_id: string;
  vehicle_id: string | null;
  locale: string;
  payload: {
    kenteken: string;
    make: string;
    model: string;
    year: number | null;
    colour: string | null;
    vin: string | null;
    mileage_in: number | null;
    existing_damage: string;
    work_description: string;
    estimated_total_cents: number;
    terms_accepted: boolean;
    customer_name: string;
    customer_address: string | null;
    customer_phone: string | null;
    customer_email: string | null;
  } | null;
  signed_at: string | null;
  signed_by_name: string | null;
  issued_at: string | null;
  created_at: string;
  updated_at: string;
  customers: { id: string; name: string; email: string | null } | null;
  vehicles: { id: string; kenteken: string | null; make: string | null; model: string | null } | null;
  staff: { id: string; name: string } | null;
  signatures: Signature[];
};

const STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Concept',
  issued: 'Uitgegeven',
  cancelled: 'Geannuleerd',
};

const STATUS_COLORS: Record<DocStatus, string> = {
  draft: 'text-ck-text-muted bg-ck-surface-3',
  issued: 'text-emerald-400 bg-emerald-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RepairOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<RepairOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [showSign, setShowSign] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/repair-orders/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setDoc)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleIssue = async () => {
    if (!doc?.payload) return;
    setActing(true);
    const res = await fetch(`/api/repair-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'issue', payload: doc.payload }),
    });
    if (res.ok) load();
    setActing(false);
  };

  const handleSign = async (signatureData: string) => {
    if (!signerName.trim()) return;
    setActing(true);
    const res = await fetch(`/api/repair-orders/${id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signer_name: signerName,
        signer_role: 'customer',
        signature_data: signatureData,
      }),
    });
    if (res.ok) {
      setShowSign(false);
      setSignerName('');
      load();
    }
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  if (!doc || !doc.payload) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <FileText size={32} className="text-ck-text-faint" />
        <p className="text-sm text-ck-text-muted">Reparatieopdracht niet gevonden</p>
        <Link href="/app/documenten" className="text-sm text-ck-red hover:underline">
          Terug naar documenten
        </Link>
      </div>
    );
  }

  const p = doc.payload;
  const isDraft = doc.status === 'draft';
  const hasSig = doc.signatures && doc.signatures.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href="/app/documenten" className="mt-1 text-ck-text-muted hover:text-ck-text transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-lg font-medium tabular-nums text-ck-text">
                {doc.doc_number ?? 'CONCEPT'}
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[doc.status]}`}>
                {STATUS_LABELS[doc.status]}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-ck-text-muted">Reparatieopdracht</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <button
              onClick={handleIssue}
              disabled={acting}
              className="flex items-center gap-1.5 rounded-[10px] bg-ck-red px-4 py-2 text-sm font-medium text-white hover:bg-ck-red-hover transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              Uitgeven
            </button>
          )}
          <button
            disabled
            className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 opacity-50 cursor-not-allowed"
          >
            <Printer size={14} />
            PDF
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Vehicle info */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Voertuig</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Car} label="Kenteken" value={p.kenteken} mono />
              <InfoRow icon={Car} label="Merk / Model" value={`${p.make} ${p.model}`} />
              {p.year && <InfoRow icon={Calendar} label="Bouwjaar" value={String(p.year)} />}
              {p.colour && <InfoRow icon={Car} label="Kleur" value={p.colour} />}
              {p.vin && <InfoRow icon={Hash} label="VIN" value={p.vin} mono />}
              {p.mileage_in != null && <InfoRow icon={Car} label="Kilometerstand in" value={`${p.mileage_in.toLocaleString('nl-NL')} km`} />}
            </div>
          </div>

          {/* Existing damage */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Bestaande schade</h2>
            {p.existing_damage ? (
              <p className="text-sm text-ck-text-2 whitespace-pre-wrap">{p.existing_damage}</p>
            ) : (
              <p className="text-sm text-ck-text-muted italic">Geen bestaande schade genoteerd</p>
            )}
          </div>

          {/* Work description */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Werkzaamheden</h2>
            <p className="text-sm text-ck-text-2 whitespace-pre-wrap">{p.work_description}</p>
            <div className="mt-4 border-t border-ck-divider pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ck-text-muted">Geschat totaal</span>
                <span className="font-mono text-sm font-medium tabular-nums text-ck-text">
                  {formatCents(p.estimated_total_cents)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Voorwaarden</h2>
            <div className="flex items-center gap-2">
              {p.terms_accepted ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Voorwaarden geaccepteerd
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-ck-text-muted">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Voorwaarden nog niet geaccepteerd
                </span>
              )}
            </div>
          </div>

          {/* Signature section */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Handtekening</h2>

            {hasSig ? (
              <div className="space-y-4">
                {doc.signatures.map(sig => (
                  <div key={sig.id} className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-bg p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ck-text">{sig.signer_name}</p>
                        <p className="text-[11px] text-ck-text-muted">{sig.signer_role === 'customer' ? 'Klant' : 'Medewerker'}</p>
                      </div>
                      <p className="text-[11px] text-ck-text-muted">{fmtDate(sig.created_at)}</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sig.signature_data}
                      alt={`Handtekening ${sig.signer_name}`}
                      className="h-20 rounded-lg border-[0.5px] border-ck-border bg-ck-surface-3 object-contain"
                    />
                  </div>
                ))}
              </div>
            ) : showSign ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] text-ck-text-muted">Naam ondertekenaar</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder="Volledige naam..."
                    className="w-full max-w-xs rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-3 py-2 text-sm text-ck-text placeholder:text-ck-text-muted focus:border-ck-red focus:outline-none"
                  />
                </div>
                <SignatureCanvas onSign={handleSign} disabled={acting || !signerName.trim()} />
                <button
                  onClick={() => { setShowSign(false); setSignerName(''); }}
                  className="rounded-[10px] border-[0.5px] border-ck-border px-4 py-1.5 text-sm text-ck-text-3 hover:bg-ck-surface-2"
                >
                  Annuleren
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSign(true)}
                disabled={acting}
                className="flex items-center gap-1.5 rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface px-4 py-2 text-sm text-ck-text-3 hover:border-ck-red hover:text-ck-red transition-colors disabled:opacity-50"
              >
                <Pen size={14} />
                Handtekening plaatsen
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Klant</h2>
            <div className="space-y-2">
              <InfoRow icon={User} label="Naam" value={p.customer_name} />
              {p.customer_address && <InfoRow icon={User} label="Adres" value={p.customer_address} />}
              {p.customer_phone && <InfoRow icon={User} label="Telefoon" value={p.customer_phone} />}
              {p.customer_email && <InfoRow icon={User} label="E-mail" value={p.customer_email} />}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-[10px] border-[0.5px] border-ck-border bg-ck-surface p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ck-text-muted">Gegevens</h2>
            <div className="space-y-2">
              <InfoRow icon={Hash} label="Documentnummer" value={doc.doc_number ?? 'Nog niet uitgegeven'} mono />
              <InfoRow icon={Calendar} label="Aangemaakt" value={fmtDate(doc.created_at)} />
              {doc.issued_at && <InfoRow icon={Calendar} label="Uitgegeven" value={fmtDate(doc.issued_at)} />}
              {doc.signed_at && <InfoRow icon={Pen} label="Getekend" value={fmtDate(doc.signed_at)} />}
              {doc.signed_by_name && <InfoRow icon={User} label="Getekend door" value={doc.signed_by_name} />}
              {doc.job_id && (
                <div className="pt-2">
                  <Link
                    href={`/app/jobs/${doc.job_id}`}
                    className="text-sm text-ck-red hover:underline"
                  >
                    Naar opdracht
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: IconComp, label, value, mono }: { icon: typeof FileText; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <IconComp size={14} className="mt-0.5 text-ck-text-faint" />
      <div>
        <p className="text-[11px] text-ck-text-muted">{label}</p>
        <p className={`text-sm text-ck-text-2 ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
