/**
 * Browser-side photo redaction for the portfolio (PF10).
 *
 * The redacted image is produced here and is the only version ever uploaded.
 * Regions are pixelated into a few coarse blocks and then blurred — baked
 * into the pixels, so it cannot be undone. Re-encoding through canvas also
 * drops EXIF metadata (GPS location, camera serial, timestamps).
 */

import type { RedactionRegion } from './schema';

export const MAX_EDGE = 2000;
export const DETECT_EDGE = 1280;

/** Coarse grid so no character on a plate survives (≈6 blocks across). */
export function pixelGrid(regionW: number, regionH: number): { cols: number; rows: number } {
  const cols = 6;
  const rows = Math.max(2, Math.round((cols * regionH) / Math.max(1, regionW)));
  return { cols, rows: Math.min(rows, 12) };
}

export async function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    if (typeof src !== 'string') setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function fitSize(w: number, h: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

/** Draw the image with all regions redacted onto a new canvas. */
export function drawRedacted(img: HTMLImageElement, regions: RedactionRegion[], maxEdge = MAX_EDGE): HTMLCanvasElement {
  const { w, h } = fitSize(img.naturalWidth, img.naturalHeight, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  for (const r of regions) {
    const rx = Math.max(0, Math.floor(r.x * w));
    const ry = Math.max(0, Math.floor(r.y * h));
    const rw = Math.min(w - rx, Math.ceil(r.w * w));
    const rh = Math.min(h - ry, Math.ceil(r.h * h));
    if (rw < 2 || rh < 2) continue;

    // 1. Pixelate: shrink the region to a tiny grid, scale it back without smoothing
    const { cols, rows } = pixelGrid(rw, rh);
    const tiny = document.createElement('canvas');
    tiny.width = cols;
    tiny.height = rows;
    const tctx = tiny.getContext('2d')!;
    tctx.imageSmoothingEnabled = true;
    tctx.drawImage(canvas, rx, ry, rw, rh, 0, 0, cols, rows);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tiny, 0, 0, cols, rows, rx, ry, rw, rh);
    ctx.imageSmoothingEnabled = true;

    // 2. Blur the blocks so their edges don't hint at character shapes
    const blur = Math.max(4, Math.round(Math.min(rw, rh) / 4));
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(canvas, rx, ry, rw, rh, rx, ry, rw, rh);
    ctx.restore();
  }
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: 'image/webp' | 'image/jpeg' = 'image/webp', quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode failed'))), type, quality);
  });
}

/** Smaller JPEG (base64, no data: prefix) sent for AI plate detection. */
export function toDetectionBase64(img: HTMLImageElement): string {
  const { w, h } = fitSize(img.naturalWidth, img.naturalHeight, DETECT_EDGE);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}
