import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentModule } from './adminContent';

export type MediaRow = { id: string; storage_bucket: string; storage_path: string; alt_text: string | null; kind: string; sort_order: number };

// La cola persistente permite reintentar Storage sin perder la referencia al archivo.
export async function cleanMediaQueue(client: SupabaseClient, paths?: string[]) {
  let query = client.from('media_cleanup_queue').select('id,storage_bucket,storage_path').order('created_at', { ascending: false }).order('id').limit(20);
  if (paths) query = query.in('storage_path', paths);
  const { data, error } = await query;
  if (error) throw new Error('Falta aplicar la migración del CMS (media_cleanup_queue) o no hay permisos.');
  for (const item of data ?? []) {
    const references = await Promise.all(['product_images', 'project_images', 'product_support_files'].map(table => client.from(table).select('id', { count: 'exact', head: true }).eq('storage_bucket', item.storage_bucket).eq('storage_path', item.storage_path)));
    const agentReferences = await client.from('location_agents').select('id', { count: 'exact', head: true }).eq('photo_bucket', item.storage_bucket).eq('photo_path', item.storage_path);
    if (!agentReferences.error) references.push(agentReferences);
    if (references.some(result => result.error)) continue;
    // Una importación puede reutilizar la ruta. La solicitud antigua queda resuelta;
    // su eventual eliminación volverá a encolarla mediante el trigger correspondiente.
    if (references.some(result => result.count) || (item.storage_bucket === 'site-media' && item.storage_path === 'products/_placeholder/product-placeholder.webp')) {
      await client.from('media_cleanup_queue').delete().eq('id', item.id);
      continue;
    }
    const removed = await client.storage.from(item.storage_bucket).remove([item.storage_path]);
    if (removed.error) continue;
    await client.from('media_cleanup_queue').delete().eq('id', item.id);
  }
  const remaining = await client.from('media_cleanup_queue').select('id', { count: 'exact', head: true });
  return remaining.count ?? 0;
}

export async function uploadMedia(client: SupabaseClient, module: ContentModule, ownerId: string, slug: string, form: FormData) {
  const media = module.media!;
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) throw new Error('Selecciona una imagen.');
  if (file.size > 4 * 1024 * 1024) throw new Error('La imagen debe pesar como máximo 4 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Solo se permiten JPEG, PNG y WebP.');
  const kind = String(form.get('kind') ?? 'gallery');
  const order = Number(form.get('sort_order') || 0);
  if (!media.kinds.includes(kind) || !Number.isInteger(order) || Math.abs(order) > 2147483647) throw new Error('Tipo u orden de imagen inválido.');
  const replacement = String(form.get('replace_id') ?? '');
  let previousPath: string | undefined;
  if (replacement) {
    const existing = await client.from(media.table).select('id,storage_path').eq('id', replacement).eq(media.key, ownerId).maybeSingle();
    if (existing.error || !existing.data) throw new Error('La imagen a reemplazar no pertenece a este registro.');
    previousPath = existing.data.storage_path;
  }
  let converted;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40000000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error();
    converted = await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
  } catch { throw new Error('No se pudo procesar la imagen. Verifica su formato y dimensiones.'); }
  const path = `${media.table === 'product_images' ? 'products' : 'projects'}/${slug}/${crypto.randomUUID()}.webp`;
  const uploaded = await client.storage.from('site-media').upload(path, converted.data, { contentType: 'image/webp', upsert: false });
  if (uploaded.error) throw new Error(uploaded.error.message);
  const row = {
    [media.key]: ownerId, storage_bucket: 'site-media', storage_path: path,
    alt_text: String(form.get('alt_text') ?? '').trim().slice(0, 1000), kind, sort_order: order,
    ...(media.table === 'product_images' ? { original_filename: file.name, mime_type: 'image/webp', size_bytes: converted.info.size, width: converted.info.width, height: converted.info.height } : {})
  };
  const saved = replacement
    ? await client.from(media.table).update(row).eq('id', replacement).eq(media.key, ownerId).select('id').single()
    : await client.from(media.table).insert(row).select('id').single();
  if (saved.error) {
    const cleanup = await client.storage.from('site-media').remove([path]);
    if (cleanup.error) await client.from('media_cleanup_queue').insert({ storage_bucket: 'site-media', storage_path: path });
    throw new Error(saved.error.message);
  }
  if (previousPath) await cleanMediaQueue(client, [previousPath]).catch(() => undefined);
}
