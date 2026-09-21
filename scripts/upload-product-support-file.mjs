import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envText = await fs.readFile('.env', 'utf8');
const env = Object.fromEntries([...envText.matchAll(/^([A-Z0-9_]+)=(.*)$/gm)].map(([, key, value]) => [key, value]));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const filePath = process.argv[2] ?? 'FICHA TECNICA LAMBRIN PREMIUM 4.pdf';
const variantName = process.argv[3] ?? 'Premium 4';
const file = await fs.readFile(filePath);
const filename = path.basename(filePath);

const { data: variants, error: variantError } = await supabase
  .from('product_variants')
  .select('id,name,products(name)');
if (variantError) throw variantError;
const matches = (variants ?? []).filter((item) => `${item.name} ${item.products?.name ?? ''}`.toLowerCase().includes(variantName.toLowerCase()));
if (!matches.length) throw new Error(`No se encontró la variante: ${variantName}. Disponibles: ${(variants ?? []).map((item) => `${item.products?.name ?? ''} / ${item.name}`).join(', ')}`);
if (matches.length > 1) throw new Error(`Hay varias variantes con el nombre: ${variantName}`);

const variant = matches[0];
const pathName = `support/${variant.id}/${crypto.randomUUID()}.pdf`;
const uploaded = await supabase.storage.from('site-media').upload(pathName, file, { contentType: 'application/pdf', upsert: false });
if (uploaded.error) throw uploaded.error;

const saved = await supabase.from('product_support_files').insert({
  variant_id: variant.id,
  title: 'Ficha técnica',
  storage_bucket: 'site-media',
  storage_path: pathName,
  original_filename: filename,
  mime_type: 'application/pdf',
  size_bytes: file.byteLength,
  sort_order: 0
}).select('id,variant_id,storage_path').single();
if (saved.error) {
  await supabase.storage.from('site-media').remove([pathName]);
  throw saved.error;
}
console.log(JSON.stringify({ variant: variant.name, product: variant.products?.name, ...saved.data }, null, 2));
