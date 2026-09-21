// Definiciones compartidas por los formularios y la validación en servidor.
export type Field = {
  key: string; label: string;
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'url' | 'json' | 'lines' | 'select';
  required?: boolean; min?: number; max?: number; step?: string;
  relation?: string; choices?: string[];
};
export type ContentModule = {
  table: string; label: string; titleKey: string; fields: Field[];
  child?: { table: string; key: string };
  media?: { table: 'product_images' | 'project_images'; key: 'option_id' | 'project_id'; kinds: string[] };
};
const name: Field = { key: 'name', label: 'Nombre', required: true };
const slug: Field = { key: 'slug', label: 'Slug (URL)', required: true };
const description: Field = { key: 'description', label: 'Descripción', type: 'textarea' };
const summary: Field = { key: 'summary', label: 'Resumen', type: 'textarea' };
const status: Field = { key: 'status', label: 'Estado', type: 'select', choices: ['draft', 'published'], required: true };
const order: Field = { key: 'sort_order', label: 'Orden', type: 'number', step: '1' };
const featured: Field = { key: 'featured', label: 'Destacado', type: 'checkbox' };
const seo: Field[] = [{ key: 'seo_title', label: 'Título SEO' }, { key: 'seo_description', label: 'Descripción SEO', type: 'textarea' }];
export const contentModules: Record<string, ContentModule> = {
  categorias: { table: 'categories', label: 'Categorías', titleKey: 'name', fields: [name, slug, description, status, order, ...seo], child: { table: 'products', key: 'category_id' } },
  familias: { table: 'products', label: 'Familias', titleKey: 'name', fields: [name, slug, { key: 'category_id', label: 'Categoría', relation: 'categorias', required: true }, summary, description, status, featured, order, ...seo], child: { table: 'product_variants', key: 'product_id' } },
  variantes: { table: 'product_variants', label: 'Variantes', titleKey: 'name', fields: [name, slug, { key: 'product_id', label: 'Familia', relation: 'familias', required: true }, summary, description, status, order], child: { table: 'product_options', key: 'variant_id' } },
  productos: {
    table: 'product_options', label: 'Productos / acabados', titleKey: 'name',
    fields: [name, slug, { key: 'variant_id', label: 'Variante / familia', relation: 'variantes', required: true },
      { key: 'sku', label: 'SKU' }, { key: 'price', label: 'Precio', type: 'number', min: 0, max: 9999999999.99, step: '0.01', required: true }, summary, description,
      ...[['color_name', 'Color'], ['color_slug', 'Slug del color'], ['color_hex', 'Color hexadecimal'], ['finish', 'Acabado'], ['dimensions', 'Dimensiones'], ['thickness', 'Espesor'], ['material', 'Material'], ['usage', 'Uso']].map(([key, label]): Field => ({ key, label })),
      { key: 'technical_specs', label: 'Especificaciones técnicas (objeto JSON)', type: 'json' },
      { key: 'faq_items', label: 'Preguntas frecuentes (JSON: {"Pregunta": "Respuesta"})', type: 'json' },
      { key: 'installation_notes', label: 'Instalación', type: 'textarea' }, { key: 'care_notes', label: 'Cuidados', type: 'textarea' },
      { key: 'technical_sheet_url', label: 'Enlace a ficha técnica', type: 'url' }, { key: 'installation_guide_url', label: 'Enlace a guía de instalación', type: 'url' },
      status, featured, order, ...seo, { key: 'canonical_path', label: 'Canonical (vacío = URL actual)' }],
    media: { table: 'product_images', key: 'option_id', kinds: ['main', 'secondary', 'gallery', 'extra', 'technical'] }
  },
  proyectos: {
    table: 'projects', label: 'Proyectos', titleKey: 'title',
    fields: [{ key: 'title', label: 'Título', required: true }, slug, summary, { key: 'content', label: 'Contenido', type: 'textarea' },
      ...[['category', 'Categoría'], ['location', 'Ubicación'], ['year', 'Año'], ['surface', 'Superficie / aplicación']].map(([key, label]): Field => ({ key, label })),
      { key: 'materials', label: 'Materiales (uno por línea)', type: 'lines' }, { key: 'challenge', label: 'Reto', type: 'textarea' }, { key: 'result', label: 'Resultado', type: 'textarea' }, status, featured, order, ...seo],
    media: { table: 'project_images', key: 'project_id', kinds: ['main', 'gallery', 'before', 'after'] }
  },
  ubicaciones: { table: 'locations', label: 'Ubicaciones', titleKey: 'name', fields: [name, { key: 'city', label: 'Ciudad', required: true },
    ...[['type', 'Tipo de sucursal'], ['address', 'Dirección'], ['schedule', 'Horario'], ['phone', 'Teléfono']].map(([key, label]): Field => ({ key, label })),
    { key: 'whatsapp_url', label: 'Enlace WhatsApp', type: 'url' }, { key: 'maps_url', label: 'Enlace de mapa', type: 'url' },
    { key: 'latitude', label: 'Latitud', type: 'number', min: -90, max: 90, step: 'any' }, { key: 'longitude', label: 'Longitud', type: 'number', min: -180, max: 180, step: 'any' }, status, order, ...seo] }
};
export const sectionLabels = { technical: 'Ficha técnica', support: 'Soporte', faq: 'Preguntas frecuentes', installation: 'Instalación' };
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const validWebUrl = (value: string) => { try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; } };
export function parseContentForm(module: ContentModule, form: FormData) {
  const result: Record<string, unknown> = {};
  for (const field of module.fields) {
    const value = String(form.get(field.key) ?? '').trim();
    if (field.required && !value) throw new Error(`${field.label}: es obligatorio.`);
    if (value.length > 30000) throw new Error(`${field.label}: el texto es demasiado largo.`);
    if (field.relation && !isUuid(value)) throw new Error(`${field.label}: selecciona una opción válida.`);
    if ((field.key === 'slug' || field.key === 'color_slug') && value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error(`${field.label}: usa minúsculas, números y guiones.`);
    if (field.key === 'color_hex' && value && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error('El color debe tener formato #RRGGBB.');
    if (field.key === 'canonical_path' && value && !/^\/productos\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) throw new Error('Canonical debe ser una ruta /productos/slug.');
    if (field.type === 'url' && value && !validWebUrl(value)) throw new Error(`${field.label}: usa una URL http o https.`);
    if (field.choices && !field.choices.includes(value)) throw new Error(`${field.label}: valor inválido.`);
    if (field.type === 'checkbox') result[field.key] = form.get(field.key) === 'on';
    else if (field.type === 'number') {
      const number = value ? Number(value) : field.key === 'sort_order' ? 0 : null;
      if (number !== null && (!Number.isFinite(number) || (field.step === '1' && (!Number.isInteger(number) || Math.abs(number) > 2147483647)) || (field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max))) throw new Error(`${field.label}: número inválido.`);
      result[field.key] = number;
    } else if (field.type === 'json') {
      let parsed: unknown;
      try { parsed = JSON.parse(value || '{}'); } catch { throw new Error(`${field.label}: JSON inválido. No se guardó ningún cambio.`); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${field.label}: debe ser un objeto JSON.`);
      if (Object.values(parsed).some(item => item !== null && !['string', 'number'].includes(typeof item))) throw new Error(`${field.label}: los valores deben ser textos o números.`);
      result[field.key] = parsed;
    } else if (field.type === 'lines') result[field.key] = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    else result[field.key] = value || null;
  }
  if (module.table === 'product_options') {
    const visibility: Record<string, boolean> = {};
    for (const key of Object.keys(sectionLabels)) {
      const value = String(form.get(`section_${key}`) ?? 'inherit');
      if (!['inherit', 'true', 'false'].includes(value)) throw new Error('Visibilidad inválida.');
      if (value !== 'inherit') visibility[key] = value === 'true';
    }
    result.section_visibility = visibility;
  }
  return result;
}
export const contentError = (error: { code?: string; message: string }) => {
  if (error.code === '23505') return 'Ese slug ya existe. Elige uno distinto.';
  if (error.code === '23503') return 'El registro está relacionado con otro contenido. Revisa sus relaciones antes de eliminarlo.';
  return error.message;
};
