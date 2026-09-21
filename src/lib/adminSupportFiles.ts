import type { SupabaseClient } from '@supabase/supabase-js';
import { cleanMediaQueue } from './adminMedia';

export type SupportFileRow = {
  id: string;
  title: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
  upload_state: 'pending' | 'ready';
};

export const supportMaxBytes = 15 * 1024 * 1024;
export function supportMetadata(form: FormData) {
  const title = String(form.get('support_title') ?? '').trim();
  if (!title || title.length > 160) throw new Error('El título debe tener entre 1 y 160 caracteres.');
  const sort_order = Number(form.get('support_sort_order') || 0);
  if (!Number.isInteger(sort_order) || Math.abs(sort_order) > 2147483647) throw new Error('El orden del archivo no es válido.');
  return { title, sort_order };
}
async function verifyPdf(file: Blob) {
  if (!file.size || file.size > supportMaxBytes) throw new Error('El PDF debe pesar entre 1 byte y 15 MB.');
  if (await file.slice(0, 5).text() !== '%PDF-') throw new Error('El contenido del archivo no corresponde a un PDF.');
}

export async function prepareSupportUpload(client: SupabaseClient, variantId: string, form: FormData) {
  const metadata = supportMetadata(form);
  const size = Number(form.get('size_bytes'));
  const filename = String(form.get('original_filename') ?? '');
  if (!Number.isSafeInteger(size) || size <= 0 || size > supportMaxBytes || !filename.toLowerCase().endsWith('.pdf')) throw new Error('Selecciona un PDF de hasta 15 MB.');
  const variant = await client.from('product_variants').select('id').eq('id', variantId).single();
  if (variant.error) throw new Error('La familia no existe.');
  const path = `support/${variantId}/${crypto.randomUUID()}.pdf`;
  const signed = await client.storage.from('site-media').createSignedUploadUrl(path, { upsert: false });
  if (signed.error) throw new Error(signed.error.message);
  const saved = await client.from('product_support_files').insert({ ...metadata, variant_id: variantId, storage_bucket: 'site-media', storage_path: path, original_filename: filename.slice(0, 255), mime_type: 'application/pdf', size_bytes: size, upload_state: 'pending' }).select('id').single();
  if (saved.error) throw new Error(saved.error.message);
  return { id: saved.data.id, signedUrl: signed.data.signedUrl };
}
export async function finishSupportUpload(client: SupabaseClient, variantId: string, id: string) {
  const row = await client.from('product_support_files').select('*').eq('id', id).eq('variant_id', variantId).single();
  if (row.error) throw new Error('La subida no pertenece a esta familia.');
  if (row.data.upload_state === 'ready') return;
  const file = await client.storage.from(row.data.storage_bucket).download(row.data.storage_path);
  if (file.error) throw new Error('No se recibió el archivo en Storage. Reintenta la subida.');
  await verifyPdf(file.data);
  if (file.data.size !== row.data.size_bytes) throw new Error('El tamaño del archivo no coincide con el declarado.');
  const updated = await client.from('product_support_files').update({ upload_state: 'ready' }).eq('id', id).eq('variant_id', variantId);
  if (updated.error) throw new Error(updated.error.message);
}

export async function uploadSupportFile(client: SupabaseClient, variantId: string, form: FormData) {
  const file = form.get('support_file');
  if (!(file instanceof File) || !file.size) throw new Error('Selecciona un archivo de apoyo.');
  if (file.size > 4 * 1024 * 1024) throw new Error('Para PDF de más de 4 MB activa JavaScript: se suben directamente a Storage, hasta 15 MB.');
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Solo se permiten archivos PDF.');

  await verifyPdf(file);
  const { title, sort_order: order } = supportMetadata(form);

  const path = `support/${variantId}/${crypto.randomUUID()}.pdf`;
  const uploaded = await client.storage.from('site-media').upload(path, await file.arrayBuffer(), {
    contentType: 'application/pdf',
    upsert: false
  });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const saved = await client.from('product_support_files').insert({
    variant_id: variantId,
    title,
    storage_bucket: 'site-media',
    storage_path: path,
    original_filename: file.name.slice(0, 255),
    mime_type: 'application/pdf',
    size_bytes: file.size,
    sort_order: order
  }).select('id').single();
  if (saved.error) {
    await client.storage.from('site-media').remove([path]);
    throw new Error(saved.error.message);
  }
}

export async function deleteSupportFile(client: SupabaseClient, id: string, variantId: string) {
  const removed = await client.from('product_support_files').delete().eq('id', id).eq('variant_id', variantId).select('id,storage_path').single();
  if (removed.error) throw new Error(removed.error.message);
  await cleanMediaQueue(client, [removed.data.storage_path]).catch(() => undefined);
}
