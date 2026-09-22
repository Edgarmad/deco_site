import type { Location } from '../types/locations';
import { supabase } from '../lib/supabase';
import { getPublicStorageUrl } from '../lib/supabase';

export const locationSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'ubicacion';

const locationFallbacks: Location[] = [
  {
    number: '01',
    slug: 'merida',
    name: 'Merida',
    city: 'Merida',
    type: 'Tienda',
    address: 'Bodega 10, C. 6, Chichi Suarez, 97306',
    schedule: 'Lun-Vie 9:00-18:00',
    phone: '+52 999 000 0000',
    mapsUrl: 'https://maps.app.goo.gl/FG9PJTLZq6gDspWSA?g_st=ic',
    catalogUrl: 'https://drive.google.com/drive/folders/12p5iAFIaNjnZSjPvLG4gPOmNUzrrt794?usp=drive_link',
    agents: []
  },
  {
    number: '02',
    slug: 'playa-del-carmen',
    name: 'Playa del Carmen',
    city: 'Playa del Carmen',
    type: 'Tienda',
    address: 'Carretera Federal Mz 2 Lt 22, Bodega 7',
    schedule: 'Lun-Sab 9:00-17:00',
    phone: '+52 984 000 0000',
    mapsUrl: 'https://maps.app.goo.gl/7WJnTuYAhmoqoA5QA?g_st=ic',
    catalogUrl: 'https://drive.google.com/drive/folders/12p5iAFIaNjnZSjPvLG4gPOmNUzrrt794?usp=drive_link',
    agents: []
  }
];

type SupabaseLocation = {
  id: string;
  name: string;
  city: string;
  type: string | null;
  address: string | null;
  schedule: string | null;
  phone: string | null;
  whatsapp_url: string | null;
  maps_url: string | null;
  catalog_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_agents?: SupabaseLocationAgent[] | null;
};

type SupabaseLocationAgent = {
  id: string;
  name: string;
  phone: string;
  photo_bucket: string | null;
  photo_path: string | null;
};

const locationSelect = 'id,name,city,type,address,schedule,phone,whatsapp_url,maps_url,catalog_url,latitude,longitude,location_agents(id,name,phone,photo_bucket,photo_path)';
const legacyLocationSelect = 'id,name,city,type,address,schedule,phone,whatsapp_url,maps_url,latitude,longitude';

const normalizeUrl = (value: string | null) => {
  try {
    const url = new URL(value ?? '');
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

const normalizeLocation = (location: SupabaseLocation, index: number): Location => ({
  id: location.id,
  number: String(index + 1).padStart(2, '0'),
  slug: locationSlug(location.city || location.name),
  name: location.name,
  city: location.city,
  type: location.type ?? 'Tienda',
  address: location.address ?? 'Direccion por confirmar',
  schedule: location.schedule ?? 'Horario por confirmar',
  phone: location.phone ?? undefined,
  whatsappUrl: location.whatsapp_url ?? undefined,
  catalogUrl: normalizeUrl(location.catalog_url),
  mapsUrl: location.maps_url ?? (location.latitude != null && location.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address ?? ''} ${location.city}`)}`),
  agents: (location.location_agents ?? []).map(agent => ({
    id: agent.id,
    name: agent.name,
    phone: agent.phone,
    photoUrl: getPublicStorageUrl(agent.photo_bucket ?? 'site-media', agent.photo_path)
  }))
});

export const getLocations = async (): Promise<Location[]> => {
  if (!supabase) return locationFallbacks;

  const { data, error } = await supabase
    .from('locations')
    .select(locationSelect)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('city', { ascending: true });

  if (error?.code === '42703' || error?.code === '42P01' || error?.code === 'PGRST200') {
    const fallback = await supabase
      .from('locations')
      .select(legacyLocationSelect)
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('city', { ascending: true });

    if (fallback.error) throw new Error(`No se pudieron cargar las ubicaciones: ${fallback.error.message}`);
    if (!fallback.data?.length) return locationFallbacks.map((location) => ({ ...location, catalogUrl: undefined }));
    return fallback.data.map((location, index) => normalizeLocation({ ...location, catalog_url: null, location_agents: [] }, index));
  }

  if (error) throw new Error(`No se pudieron cargar las ubicaciones: ${error.message}`);
  if (!data?.length) return locationFallbacks;
  return data.map(normalizeLocation);
};
