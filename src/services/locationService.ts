import type { Location } from '../types/locations';
import { supabase } from '../lib/supabase';

const locationFallbacks: Location[] = [
  {
    number: '01',
    name: 'Merida',
    city: 'Merida',
    type: 'Tienda',
    address: 'Bodega 10, C. 6, Chichi Suarez, 97306',
    schedule: 'Lun-Vie 9:00-18:00',
    mapsUrl: 'https://maps.app.goo.gl/FG9PJTLZq6gDspWSA?g_st=ic'
  },
  {
    number: '02',
    name: 'Playa del Carmen',
    city: 'Playa del Carmen',
    type: 'Tienda',
    address: 'Carretera Federal Mz 2 Lt 22, Bodega 7',
    schedule: 'Lun-Sab 9:00-17:00',
    mapsUrl: 'https://maps.app.goo.gl/7WJnTuYAhmoqoA5QA?g_st=ic'
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
  latitude: number | null;
  longitude: number | null;
};

const normalizeLocation = (location: SupabaseLocation, index: number): Location => ({
  id: location.id,
  number: String(index + 1).padStart(2, '0'),
  name: location.name,
  city: location.city,
  type: location.type ?? 'Tienda',
  address: location.address ?? 'Direccion por confirmar',
  schedule: location.schedule ?? 'Horario por confirmar',
  phone: location.phone ?? undefined,
  whatsappUrl: location.whatsapp_url ?? undefined,
  mapsUrl: location.maps_url ?? (location.latitude != null && location.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.address ?? ''} ${location.city}`)}`)
});

export const getLocations = async (): Promise<Location[]> => {
  if (!supabase) return locationFallbacks;

  const { data, error } = await supabase
    .from('locations')
    .select('id,name,city,type,address,schedule,phone,whatsapp_url,maps_url,latitude,longitude')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('city', { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las ubicaciones: ${error.message}`);
  if (!data?.length) return locationFallbacks;
  return data.map(normalizeLocation);
};
