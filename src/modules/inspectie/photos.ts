import type { SupabaseClient } from '@supabase/supabase-js';

/** Private bucket created in migration 0048. Served through signed URLs only. */
export const INS_PHOTO_BUCKET = 'ins-originals';

/** Signed URL lifetime in seconds. */
export const INS_SIGNED_URL_TTL = 60 * 60;

type WithPath = { storage_path: string };

/**
 * Adds a short-lived `url` to each photo row. Rows whose URL could not be
 * signed get `url: null` so callers can fall back to a placeholder.
 */
export async function signInsPhotoUrls<T extends WithPath>(
  supabase: SupabaseClient,
  photos: T[]
): Promise<(T & { url: string | null })[]> {
  if (photos.length === 0) return [];

  const { data, error } = await supabase.storage
    .from(INS_PHOTO_BUCKET)
    .createSignedUrls(photos.map(p => p.storage_path), INS_SIGNED_URL_TTL);

  if (error || !data) {
    return photos.map(p => ({ ...p, url: null }));
  }

  const byPath = new Map<string, string | null>();
  data.forEach((d, i) => byPath.set(photos[i].storage_path, d.signedUrl ?? null));

  return photos.map(p => ({ ...p, url: byPath.get(p.storage_path) ?? null }));
}
