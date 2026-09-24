// Definiciones compartidas por los formularios y la validación en servidor.
export type Field = {
  key: string; label: string;
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'url' | 'json' | 'lines' | 'select';
  required?: boolean; min?: number; max?: number; step?: string;
  relation?: string; choices?: string[];
  hint?: string;
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
  familias: { table: 'products', label: 'Tipos de producto', titleKey: 'name', fields: [name, slug, { key: 'category_id', label: 'Categoría de uso (Interior / Exterior)', relation: 'categorias', required: true }, summary, description, status, featured, order, ...seo], child: { table: 'product_variants', key: 'product_id' } },
  variantes: { table: 'product_variants', label: 'Familias / subcategorías', titleKey: 'name', fields: [name, slug, { key: 'product_id', label: 'Tipo de producto', relation: 'familias', required: true }, { key: 'price_presentation', label: 'Tipo de presentación en el precio de mayoreo', type: 'select', choices: ['', 'Caja', 'Pieza'], hint: 'Aparecerá junto al precio de todos los acabados de esta familia: «por caja» o «por pieza». Déjalo sin especificar si aún no conoces la unidad.' }, summary, description, status, order], child: { table: 'product_options', key: 'variant_id' } },
  productos: {
    table: 'product_options', label: 'Acabados / colores', titleKey: 'name',
    fields: [{ ...name, label: 'Nombre del acabado / color', hint: 'Solo el acabado, por ejemplo Roble. No repitas el tipo ni la familia.' }, slug, { key: 'variant_id', label: 'Familia / subcategoría', relation: 'variantes', required: true, hint: 'El catálogo muestra una tarjeta por familia. Cada color conserva su URL y sus datos comerciales.' },
      { key: 'sku', label: 'SKU (opcional)' }, { key: 'price', label: 'Precio de mayoreo del acabado', type: 'number', min: 0, max: 9999999999.99, step: '0.01', required: true, hint: 'Se muestra como «Precio de mayoreo» en la ficha pública, con la unidad configurada en su familia. $1.00 es el precio temporal de la importación; captura el precio comercial real.' }, summary, description,
      ...[['color_name', 'Color'], ['color_slug', 'Slug del color'], ['color_hex', 'Color hexadecimal'], ['finish', 'Acabado'], ['dimensions', 'Dimensiones'], ['thickness', 'Espesor'], ['material', 'Material'], ['usage', 'Uso']].map(([key, label]): Field => ({ key, label })),
       { key: 'technical_specs', label: 'Especificaciones técnicas', type: 'json' },
      { key: 'faq_items', label: 'Preguntas frecuentes (JSON: {"Pregunta": "Respuesta"})', type: 'json' },
      { key: 'installation_notes', label: 'Instalación', type: 'textarea' }, { key: 'care_notes', label: 'Cuidados', type: 'textarea' },
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
    { key: 'whatsapp_url', label: 'Enlace WhatsApp', type: 'url' }, { key: 'maps_url', label: 'Enlace de mapa', type: 'url' }, { key: 'catalog_url', label: 'Link de catálogo', type: 'url' },
    { key: 'latitude', label: 'Latitud', type: 'number', min: -90, max: 90, step: 'any' }, { key: 'longitude', label: 'Longitud', type: 'number', min: -180, max: 180, step: 'any' }, status, order, ...seo] }
};
export const sectionLabels = { technical: 'Ficha técnica', support: 'Soporte', faq: 'Preguntas frecuentes', installation: 'Instalación' };
export const technicalFields = [
  { key: 'presentation', label: 'Presentación', example: 'Caja, Paquete o Placa' },
  { key: 'pieces_per_box', label: 'Piezas por presentación', example: '10 piezas o N/A' },
  { key: 'coverage', label: 'Cobertura comercial por presentación', example: '4.60 m²' },
  { key: 'weight', label: 'Peso', example: '2 kg' },
  { key: 'water_resistance', label: 'Resistencia al agua', example: '' },
  { key: 'fire_classification', label: 'Clasificación de fuego', example: '' }
];
export const productPlaceholderPath = 'products/_placeholder/product-placeholder.webp';
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const validWebUrl = (value: string) => { try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; } };
export function parseContentForm(module: ContentModule, form: FormData, existing: Record<string, unknown> = {}) {
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
    const specs = result.technical_specs as Record<string, unknown>;
    if (form.get('structured_specs') === '1') {
      for (const field of technicalFields) {
        const text = String(form.get(`spec_${field.key}`) ?? '').trim();
        if (text.length > 1000) throw new Error(`${field.label}: máximo 1000 caracteres.`);
        if (text) specs[field.key] = text;
        else delete specs[field.key];
      }
    }
    // No reinterpretar las unidades oficiales: el cálculo usa el rendimiento comercial, no el área geométrica.
    const previousSpecs = (existing.technical_specs ?? {}) as Record<string, unknown>;
    for (const [key, pattern, message] of [
      ['coverage', /^(?:\d+(?:\.\d+)? m²|N\/A)$/, 'Cobertura: usa un número positivo seguido de m², por ejemplo 4.60 m², o N/A.'],
      ['pieces_per_box', /^(?:[1-9]\d* piezas|N\/A)$/, 'Piezas: usa un entero seguido de piezas (10 piezas) o N/A.']
    ] as const) {
      const raw = specs[key];
      if (raw === previousSpecs[key]) continue;
      if (raw != null && raw !== '' && (typeof raw !== 'string' || !pattern.test(raw) || (key === 'coverage' && raw !== 'N/A' && Number.parseFloat(raw) <= 0))) throw new Error(message);
    }
    const dimensions = result.dimensions;
    // La sección transversal 10*5 del inventario se conserva como texto; nunca se multiplica para calcular longitud.
    if (dimensions && dimensions !== existing.dimensions && !/^[1-9]\d*(?:\.\d+)? x \d+(?:\.\d+)?(?:\*\d+(?:\.\d+)?)? cm$|^0\.\d*[1-9]\d* x \d+(?:\.\d+)? cm$/.test(String(dimensions))) throw new Error('Dimensiones: usa Alto x Ancho cm (290 x 10 cm). En vigas, el primer valor es el largo; 10*5 solo puede ser la sección transversal.');
    if (!existing.id) result.fallback_image_path = productPlaceholderPath;
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
