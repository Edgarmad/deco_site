import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

const inventoryPath = path.resolve('inventario_final.json');
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));

const safeSlug = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const seoImagePath = ({ product, variant, optionSlug, color, kind, index }) => {
  const nameParts = [product.slug, variant.slug === 'general' ? '' : variant.slug, color.slug, kind]
    .filter(Boolean)
    .join('-');

  return `products/${product.slug}/${variant.slug}/${optionSlug}/${kind}/${String(index + 1).padStart(2, '0')}-${safeSlug(nameParts)}.webp`;
};

const optionSlugFor = (product, variant, color) => {
  if (variant.slug === 'general') return `${product.slug}-${color.slug}`;
  return `${product.slug}-${variant.slug}-${color.slug}`;
};

const upsertOne = async (table, row, onConflict) => {
  const { data, error } = await supabase.from(table).upsert(row, { onConflict }).select('id').single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data.id;
};

let categorySort = 0;
let productSort = 0;
let variantSort = 0;
let optionSort = 0;
let imageSort = 0;

for (const category of inventory.categories ?? []) {
  const categoryId = await upsertOne(
    'categories',
    {
      name: category.name,
      slug: category.slug,
      status: 'published',
      sort_order: categorySort++
    },
    'slug'
  );

  for (const product of category.products ?? []) {
    const productId = await upsertOne(
      'products',
      {
        category_id: categoryId,
        name: product.name,
        slug: product.slug,
        status: 'published',
        sort_order: productSort++
      },
      'slug'
    );

    for (const variant of product.variants ?? []) {
      const variantId = await upsertOne(
        'product_variants',
        {
          product_id: productId,
          name: variant.name,
          slug: variant.slug,
          status: 'published',
          sort_order: variantSort++
        },
        'product_id,slug'
      );

      for (const color of variant.colors ?? []) {
        const optionSlug = optionSlugFor(product, variant, color);
        const optionId = await upsertOne(
          'product_options',
          {
            variant_id: variantId,
            name: color.name,
            slug: optionSlug,
            color_name: color.name,
            color_slug: color.slug,
            status: 'published',
            sort_order: optionSort++,
            canonical_path: `/productos/${optionSlug}`,
            source_path: color.sourcePath ?? null,
            seo_title: `${product.name} ${color.name} | Deco ABC`
          },
          'slug'
        );

        const imageGroups = [
          ['main', color.images?.main ?? []],
          ['secondary', color.images?.secondary ?? []],
          ['extra', color.images?.extras ?? []]
        ];

        for (const [kind, images] of imageGroups) {
          let slotSort = 0;
          for (const image of images) {
            const storagePath = seoImagePath({ product, variant, optionSlug, color, kind, index: slotSort });
            const { error } = await supabase.from('product_images').upsert(
              {
                product_id: productId,
                variant_id: variantId,
                option_id: optionId,
                storage_bucket: 'site-media',
                storage_path: storagePath,
                original_source_path: image.path,
                original_filename: image.title,
                alt_text: `${product.name} ${color.name}`,
                kind,
                sort_order: imageSort++
              },
              { onConflict: 'storage_bucket,storage_path' }
            );
            if (error) throw new Error(`product_images: ${error.message}`);
            slotSort++;
          }
        }
      }
    }
  }
}

console.log('Inventario base publicado en Supabase.');
