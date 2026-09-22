import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Se requieren SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const locations = [
  {
    name: 'Mérida',
    city: 'Mérida',
    type: 'Tienda',
    address: 'Bodega 10, C. 6, Chichí Suárez, 97306',
    schedule: 'Lun-Vie 9:00-18:00',
    phone: '+52 999 000 0000',
    maps_url: 'https://maps.app.goo.gl/FG9PJTLZq6gDspWSA?g_st=ic',
    catalog_url: 'https://drive.google.com/drive/folders/12p5iAFIaNjnZSjPvLG4gPOmNUzrrt794?usp=drive_link',
    status: 'published',
    sort_order: 1
  },
  {
    name: 'Playa del Carmen',
    city: 'Playa del Carmen',
    type: 'Tienda',
    address: 'Carretera Federal Mz 2 Lt 22, Bodega 7, entre calle 80 Norte y 88 Norte',
    schedule: 'Lun-Sab 9:00-17:00',
    phone: '+52 984 000 0000',
    maps_url: 'https://maps.app.goo.gl/7WJnTuYAhmoqoA5QA?g_st=ic',
    catalog_url: 'https://drive.google.com/drive/folders/12p5iAFIaNjnZSjPvLG4gPOmNUzrrt794?usp=drive_link',
    status: 'published',
    sort_order: 2
  }
];

const projects = [
  {
    title: 'Residencia Norte',
    slug: 'residencia-norte',
    summary: 'Una fachada contemporánea construida con lambrín exterior, piedra tecnológica y acentos cálidos.',
    category: 'Residencial',
    location: 'Mérida, Yucatán',
    year: '2026',
    surface: 'Fachada exterior',
    materials: ['Lambrín exterior', 'Piedra tecnológica', 'Perfiles decorativos'],
    challenge: 'Resolver una fachada expuesta al clima con una lectura cálida, contemporánea y de bajo mantenimiento.',
    result: 'Se combinaron líneas verticales con tonos madera para dar ritmo a la fachada y enfatizar los accesos principales.',
    status: 'published',
    featured: true,
    sort_order: 1
  },
  {
    title: 'Lobby Hotel Boutique',
    slug: 'lobby-hotel-boutique',
    summary: 'Un lobby compacto con superficies claras, textura lineal y una atmósfera cálida de bienvenida.',
    category: 'Hospitalidad',
    location: 'Playa del Carmen, Quintana Roo',
    year: '2026',
    surface: 'Muros interiores',
    materials: ['Panel decorativo', 'Lambrín interior', 'Acabado claro'],
    challenge: 'Aportar textura sin saturar el espacio de recepción ni competir con el mobiliario existente.',
    result: 'El patrón lineal ordena visualmente el lobby y mantiene una base neutra para iluminación y señalética.',
    status: 'published',
    featured: false,
    sort_order: 2
  }
];

for (const location of locations) {
  const existing = await supabase
    .from('locations')
    .select('id')
    .eq('city', location.city)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const result = existing.data
    ? await supabase.from('locations').update(location).eq('id', existing.data.id).select('id').single()
    : await supabase.from('locations').insert(location).select('id').single();
  if (result.error) throw result.error;
}

const projectResult = await supabase
  .from('projects')
  .upsert(projects, { onConflict: 'slug' })
  .select('id,slug,status');
if (projectResult.error) throw projectResult.error;

const locationResult = await supabase
  .from('locations')
  .select('id,name,city,phone,catalog_url,status,sort_order')
  .in('city', locations.map((location) => location.city))
  .order('sort_order', { ascending: true });
if (locationResult.error) throw locationResult.error;

console.log(JSON.stringify({ locations: locationResult.data, projects: projectResult.data }, null, 2));
