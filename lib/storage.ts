// lib/storage.ts
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type Driver = 'local' | 'supabase';

const isVercel = !!process.env.VERCEL;
// Par défaut : supabase sur Vercel, local en dev
const DRIVER: Driver = (
  process.env.STORAGE_DRIVER ??
  (isVercel ? 'supabase' : 'local')
).toLowerCase() as Driver;

const BUCKET = process.env.SUPABASE_BUCKET ?? 'evidences';

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

function sanitizeName(name: string) {
  return name.replace(/[^\w.\-\/]/g, '_');
}

export async function saveBufferToStorage(
  filename: string,
  buffer: Buffer,
  contentType = 'application/octet-stream',
): Promise<string> {
  // ⚠️ Sécurité : interdit d’utiliser local sur Vercel
  if (isVercel && DRIVER === 'local') {
    throw new Error('STORAGE_DRIVER=local est interdit sur Vercel. Utilise STORAGE_DRIVER=supabase.');
  }

  if (DRIVER === 'local') {
    // DEV uniquement
    const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
    fs.mkdirSync(uploadDir, { recursive: true });
    const safe = sanitizeName(filename);
    const full = path.join(uploadDir, safe);
    fs.writeFileSync(full, buffer);
    return `/uploads/${safe}`;
  }

  // ---- SUPABASE (prod)
  if (!supabase) {
    throw new Error('Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }

  const key = `${Date.now()}-${Math.random().toString(36).slice(2)}/${sanitizeName(filename)}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType, upsert: false });
  if (uploadErr) throw uploadErr;

  // Choisis public vs signé :
  const isPublicBucket = false; // mets true si ton bucket Supabase est Public
  if (isPublicBucket) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  const seconds = Number(process.env.SUPABASE_STORAGE_SIGNED_URL_SECONDS ?? '3600');
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(key, seconds);
  if (error || !data?.signedUrl) throw error ?? new Error('Impossible de créer l’URL signée');
  return data.signedUrl;
}
