import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cleanMediaQueue } from './adminMedia';

export type LocationAgentRow = {
  id: string;
  location_id: string;
  name: string;
  phone: string;
  photo_bucket: string | null;
  photo_path: string | null;
  sort_order: number;
  status: string;
};

const parseAgentValues = (form: FormData) => {
  const name = String(form.get('agent_name') ?? '').trim();
  const phone = String(form.get('agent_phone') ?? '').trim();
  const status = String(form.get('agent_status') ?? 'published');
  const sort_order = Number(form.get('agent_sort_order') || 0);
  if (!name) throw new Error('Nombre del agente: es obligatorio.');
  if (!phone) throw new Error('Telefono del agente: es obligatorio.');
  if (name.length > 160 || phone.length > 60) throw new Error('Los datos del agente son demasiado largos.');
  if (!['draft', 'published'].includes(status)) throw new Error('Estado del agente invalido.');
  if (!Number.isInteger(sort_order) || Math.abs(sort_order) > 2147483647) throw new Error('Orden del agente invalido.');
  return { name, phone, status, sort_order };
};

const processAgentPhoto = async (file: File) => {
  if (!file.size) return undefined;
  if (file.size > 4 * 1024 * 1024) throw new Error('La foto del agente debe pesar como maximo 4 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('La foto debe ser JPEG, PNG o WebP.');
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 20000000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error();
    return await image.rotate().resize({ width: 900, height: 900, fit: 'cover' }).webp({ quality: 84 }).toBuffer();
  } catch {
    throw new Error('No se pudo procesar la foto del agente.');
  }
};

export async function saveLocationAgent(client: SupabaseClient, locationId: string, form: FormData) {
  const agentId = String(form.get('agent_id') ?? '');
  const values = parseAgentValues(form);
  const file = form.get('agent_photo');
  const photo = file instanceof File ? await processAgentPhoto(file) : undefined;
  let previousPath: string | undefined;
  let photoFields = {};

  if (agentId) {
    const existing = await client.from('location_agents').select('id,photo_path').eq('id', agentId).eq('location_id', locationId).maybeSingle();
    if (existing.error || !existing.data) throw new Error('El agente no pertenece a esta ubicacion.');
    previousPath = existing.data.photo_path ?? undefined;
  } else if (!photo) throw new Error('Selecciona una foto para el agente.');

  if (photo) {
    const path = `locations/agents/${locationId}/${crypto.randomUUID()}.webp`;
    const uploaded = await client.storage.from('site-media').upload(path, photo, { contentType: 'image/webp', upsert: false });
    if (uploaded.error) throw new Error(uploaded.error.message);
    photoFields = { photo_bucket: 'site-media', photo_path: path };
  }

  const saved = agentId
    ? await client.from('location_agents').update({ ...values, ...photoFields }).eq('id', agentId).eq('location_id', locationId).select('id').single()
    : await client.from('location_agents').insert({ ...values, ...photoFields, location_id: locationId }).select('id').single();
  if (saved.error) throw new Error(saved.error.message);
  if (photo && previousPath) await cleanMediaQueue(client, [previousPath]).catch(() => undefined);
}

export async function deleteLocationAgent(client: SupabaseClient, locationId: string, agentId: string) {
  const removed = await client.from('location_agents').delete().eq('id', agentId).eq('location_id', locationId).select('id,photo_path').single();
  if (removed.error) throw new Error(removed.error.message);
  if (removed.data.photo_path) await cleanMediaQueue(client, [removed.data.photo_path]).catch(() => undefined);
}
