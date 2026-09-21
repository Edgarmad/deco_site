import type { SupabaseClient } from '@supabase/supabase-js';

export type SupportFileRow = {
  id: string;
  title: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
};

export async function uploadSupportFile(client: SupabaseClient, variantId: string, form: FormData) {
  const file = form.get('support_file');
  if (!(file instanceof File) || !file.size) throw new Error('Selecciona un archivo de apoyo.');
  if (file.size > 15 * 1024 * 1024) throw new Error('El archivo debe pesar como máximo 15 MB.');
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Solo se permiten archivos PDF.');

  const title = String(form.get('support_title') ?? '').trim().slice(0, 160);
  if (!title) throw new Error('Escribe un título para el archivo.');
  const order = Number(form.get('support_sort_order') || 0);
  if (!Number.isInteger(order) || Math.abs(order) > 2147483647) throw new Error('El orden del archivo no es válido.');

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

export async function deleteSupportFile(client: SupabaseClient, id: string) {
  const file = await client.from('product_support_files').select('storage_bucket,storage_path').eq('id', id).maybeSingle();
  if (file.error || !file.data) throw new Error('El archivo de apoyo no existe.');
  const removed = await client.from('product_support_files').delete().eq('id', id).select('id').single();
  if (removed.error) throw new Error(removed.error.message);
  const storage = await client.storage.from(file.data.storage_bucket).remove([file.data.storage_path]);
  if (storage.error) throw new Error(storage.error.message);
}
