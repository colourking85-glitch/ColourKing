import React from 'react';
import { createHash } from 'crypto';
import { renderToBuffer } from '@react-pdf/renderer';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getCompanyInfo } from '@/lib/company';
import { INS_PHOTO_BUCKET } from './photos';
import { InspectionPdf, type PdfImage, type PdfImages } from './pdf';
import type { InspectionReportData } from './template';

/** Private bucket for report renditions (migration 0048). */
export const INS_PDF_BUCKET = 'ins-derivatives';
export const pdfStoragePath = (inspectionId: string) => `${inspectionId}/report.pdf`;

type AnyClient = SupabaseClient;

type PhotoRow = { id: string; storage_path: string; mime_type?: string | null };

function formatFor(path: string, mime?: string | null): PdfImage['format'] | null {
  const m = (mime ?? '').toLowerCase();
  if (m.includes('png') || /\.png$/i.test(path)) return 'png';
  if (m.includes('jpeg') || m.includes('jpg') || /\.jpe?g$/i.test(path)) return 'jpg';
  return null; // webp / heic are not supported by react-pdf
}

/** Downloads originals from the private bucket as image buffers (jpg/png only). */
export async function loadPhotoImages(db: AnyClient, photos: PhotoRow[]): Promise<PdfImages> {
  const out: PdfImages = new Map();
  await Promise.all(photos.map(async p => {
    const format = formatFor(p.storage_path, p.mime_type);
    if (!format) return;
    const { data } = await db.storage.from(INS_PHOTO_BUCKET).download(p.storage_path);
    if (!data) return;
    out.set(p.id, { data: Buffer.from(await data.arrayBuffer()), format });
  }));
  return out;
}

async function loadSignatures(db: AnyClient, approvals: { id: string; signature_path: string | null }[]) {
  const out = new Map<string, PdfImage>();
  await Promise.all(approvals.filter(a => a.signature_path).map(async a => {
    const { data } = await db.storage.from(INS_PHOTO_BUCKET).download(a.signature_path!);
    if (data) out.set(a.id, { data: Buffer.from(await data.arrayBuffer()), format: 'png' });
  }));
  return out;
}

async function loadComponentNames(db: AnyClient): Promise<Record<string, string>> {
  const { data } = await db.from('ins_components').select('key, name_nl');
  const names: Record<string, string> = {};
  (data ?? []).forEach((c: { key: string; name_nl: string }) => { names[c.key] = c.name_nl; });
  return names;
}

/**
 * Renders the report PDF for an inspection. `db` must be able to read the
 * originals bucket (service role, or a staff session).
 */
export async function renderInspectionPdf(db: AnyClient, data: InspectionReportData): Promise<Buffer> {
  const [company, images, signatures, componentNames] = await Promise.all([
    getCompanyInfo(),
    loadPhotoImages(db, (data.ins_photos ?? []) as unknown as PhotoRow[]),
    loadSignatures(db, (data.ins_approvals ?? []) as unknown as { id: string; signature_path: string | null }[]),
    loadComponentNames(db),
  ]);
  const element = React.createElement(InspectionPdf, { data, company, images, signatures, componentNames });
  // renderToBuffer expects a <Document/> element
  return Buffer.from(await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]));
}

/**
 * For a locked inspection the PDF is rendered once, stored in ins-derivatives
 * and its hash frozen on ins_snapshots (the guard allows exactly one PDF write).
 * Returns the stored bytes on later calls. Needs the service client because
 * staff have no update policy on ins_snapshots.
 */
export async function ensureStoredPdf(admin: AnyClient, data: InspectionReportData & { id: string }): Promise<Buffer> {
  const snapshot = data.ins_snapshots?.[0] as { id?: string; pdf_path?: string | null } | undefined;

  if (snapshot?.pdf_path) {
    const { data: file } = await admin.storage.from(INS_PDF_BUCKET).download(snapshot.pdf_path);
    if (file) return Buffer.from(await file.arrayBuffer());
  }

  const pdf = await renderInspectionPdf(admin, data);
  const path = pdfStoragePath(data.id);
  const hash = createHash('sha256').update(pdf).digest('hex');

  const { error: upErr } = await admin.storage
    .from(INS_PDF_BUCKET)
    .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (upErr) throw upErr;

  if (snapshot?.id) {
    const { error } = await admin
      .from('ins_snapshots')
      .update({ pdf_path: path, pdf_hash: hash })
      .eq('id', snapshot.id)
      .is('pdf_path', null);
    if (error) console.error('[ins] pdf_hash not stored:', error.message);
  }

  return pdf;
}
