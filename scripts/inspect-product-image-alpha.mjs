import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const loadLocalEnv = async () => {
  const envFile = await readFile(path.resolve('.env'), 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^[\'"]|[\'"]$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
};

await loadLocalEnv();

const storagePath = process.argv[2] ?? 'products/deck/general/deck-caoba/main/01-deck-caoba-main.webp';
const usePublicUrl = process.argv.includes('--public');
const threshold = 34;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

let data;
if (usePublicUrl) {
  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/site-media/${storagePath}`;
  const response = await fetch(publicUrl);
  if (!response.ok) throw new Error(`GET ${publicUrl}: ${response.status}`);
  data = await response.blob();
} else {
  const response = await supabase.storage.from('site-media').download(storagePath);
  if (response.error) throw response.error;
  data = response.data;
}

const inputBuffer = Buffer.from(await data.arrayBuffer());
const image = sharp(inputBuffer).ensureAlpha();
const metadata = await image.metadata();
const raw = await image.raw().toBuffer();

let transparent = 0;
let blackOpaque = 0;
const total = (metadata.width ?? 0) * (metadata.height ?? 0);

for (let index = 0; index < raw.length; index += 4) {
  const red = raw[index];
  const green = raw[index + 1];
  const blue = raw[index + 2];
  const alpha = raw[index + 3];
  if (alpha === 0) transparent++;
  if (red <= threshold && green <= threshold && blue <= threshold && alpha > 0) blackOpaque++;
}

console.log(JSON.stringify({
  storagePath,
  source: usePublicUrl ? 'public-url' : 'storage-download',
  width: metadata.width,
  height: metadata.height,
  hasAlpha: metadata.hasAlpha,
  transparent,
  blackOpaque,
  transparentPercent: total ? Number((transparent / total * 100).toFixed(2)) : 0,
  blackOpaquePercent: total ? Number((blackOpaque / total * 100).toFixed(2)) : 0
}, null, 2));
