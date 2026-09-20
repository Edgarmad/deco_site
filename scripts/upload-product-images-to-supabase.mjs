import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const loadLocalEnv = async () => {
  try {
    const envFile = await readFile(path.resolve('.env'), 'utf8');
    for (const line of envFile.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key]) process.env[key] = value;
    }
  } catch {
    // El entorno puede venir de la terminal/CI; .env local es opcional.
  }
};

await loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno local.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const safeSlug = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const seoImagePath = ({ productSlug, variantSlug, optionSlug, colorSlug, kind, index }) => {
  const nameParts = [productSlug, variantSlug === 'general' ? '' : variantSlug, colorSlug, kind]
    .filter(Boolean)
    .join('-');

  return `products/${productSlug}/${variantSlug}/${optionSlug}/${kind}/${String(index + 1).padStart(2, '0')}-${safeSlug(nameParts)}.webp`;
};

const sourcePathCandidates = (sourcePath) => [
  path.resolve(sourcePath),
  path.resolve(sourcePath.replace(/^src\/types\//, ''))
];

const findExistingSource = async (sourcePath) => {
  for (const candidate of sourcePathCandidates(sourcePath)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Prueba el siguiente candidato.
    }
  }

  return null;
};

const { data: rows, error } = await supabase
  .from('product_images')
  .select(`
    id,kind,sort_order,original_source_path,storage_bucket,storage_path,
    product_options(id,slug,color_slug,product_variants(slug,products(slug)))
  `)
  .order('sort_order', { ascending: true });

if (error) throw new Error(`product_images: ${error.message}`);

let uploaded = 0;
let missing = 0;
let failed = 0;
let processed = 0;
const total = rows?.length ?? 0;
const folderCounters = new Map();

for (const row of rows ?? []) {
  processed++;
  const option = row.product_options;
  const variant = option?.product_variants;
  const product = variant?.products;
  const sourcePath = row.original_source_path;

  if (!option || !variant || !product || !sourcePath) {
    failed++;
    console.warn(`Saltando ${row.id}: faltan relaciones o source_path.`);
    if (processed % 10 === 0 || processed === total) console.log(`Procesadas ${processed}/${total} imagenes...`);
    continue;
  }

  const existingSource = await findExistingSource(sourcePath);
  if (!existingSource) {
    missing++;
    console.warn(`No existe archivo local: ${sourcePath}`);
    if (processed % 10 === 0 || processed === total) console.log(`Procesadas ${processed}/${total} imagenes...`);
    continue;
  }

  const folderKey = `${product.slug}/${variant.slug}/${option.slug}/${row.kind}`;
  const folderIndex = folderCounters.get(folderKey) ?? 0;
  folderCounters.set(folderKey, folderIndex + 1);

  const finalPath = seoImagePath({
    productSlug: product.slug,
    variantSlug: variant.slug,
    optionSlug: option.slug,
    colorSlug: option.color_slug ?? option.slug,
    kind: row.kind,
    index: folderIndex
  });

  try {
    const image = sharp(existingSource).rotate();
    const metadata = await image.metadata();
    const webpBuffer = await image.webp({ quality: 82 }).toBuffer();

    const { error: uploadError } = await supabase.storage
      .from(row.storage_bucket || 'site-media')
      .upload(finalPath, webpBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from('product_images')
      .update({
        storage_bucket: row.storage_bucket || 'site-media',
        storage_path: finalPath,
        mime_type: 'image/webp',
        size_bytes: webpBuffer.byteLength,
        width: metadata.width ?? null,
        height: metadata.height ?? null
      })
      .eq('id', row.id);

    if (updateError) throw updateError;

    if (row.storage_path && row.storage_path !== finalPath) {
      await supabase.storage.from(row.storage_bucket || 'site-media').remove([row.storage_path]);
    }

    uploaded++;
  } catch (uploadError) {
    failed++;
    console.warn(`Error subiendo ${sourcePath}: ${uploadError.message}`);
  }

  if (processed % 10 === 0 || processed === total) console.log(`Procesadas ${processed}/${total} imagenes...`);
}

console.log(`Imagenes migradas: ${uploaded}. Faltantes: ${missing}. Fallidas: ${failed}.`);
