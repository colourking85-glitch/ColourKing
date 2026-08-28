'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, FileDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  InspectionReportTemplate,
  type InspectionReportData,
} from '@/modules/inspectie/template';

export default function InspectionReportPage() {
  const { id } = useParams<{ id: string }>();
  const tCommon = useTranslations('common');
  const [data, setData] = useState<InspectionReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/inspections/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ck-border border-t-ck-red" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-ck-muted">Inspectie niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between rounded-[10px] border-[0.5px] border-ck-dark-border bg-ck-dark-card p-3">
        <Link
          href={`/app/inspecties/${id}`}
          className="flex items-center gap-1.5 text-sm text-ck-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Terug naar inspectie
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-ck-dark-border px-3 py-1.5 text-sm text-ck-muted-light hover:bg-ck-dark-surface hover:text-white"
          >
            <Printer size={14} />
            Printen
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-ck-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-ck-red-hover"
          >
            <FileDown size={14} />
            PDF downloaden
          </button>
        </div>
      </div>

      {/* Report */}
      <div className="mx-auto overflow-hidden rounded-[10px] border-[0.5px] border-ck-dark-border shadow-xl">
        <InspectionReportTemplate data={data} />
      </div>
    </div>
  );
}
