import { readFile } from 'node:fs/promises';
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
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^[\'"]|[\'"]$/g, '');
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

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const thresholdArg = process.argv.find((arg) => arg.startsWith('--threshold='));
const threshold = thresholdArg ? Number(thresholdArg.split('=')[1]) : 34;
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

if (!Number.isFinite(threshold) || threshold < 0 || threshold > 255) {
  throw new Error('--threshold debe ser un numero entre 0 y 255.');
}

if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
  throw new Error('--limit debe ser un numero entero mayor a 0.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const makeBlackTransparent = async (inputBuffer) => {
  const image = sharp(inputBuffer).rotate().ensureAlpha();
  const metadata = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = info.width * info.height;
  const visited = new Uint8Array(pixels);
  const queue = [];

  const isBlack = (pixelIndex) => {
    const dataIndex = pixelIndex * info.channels;
    return data[dataIndex] <= threshold && data[dataIndex + 1] <= threshold && data[dataIndex + 2] <= threshold;
  };

  const enqueue = (pixelIndex) => {
    if (visited[pixelIndex] || !isBlack(pixelIndex)) return;
    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < info.width; x++) {
    enqueue(x);
    enqueue((info.height - 1) * info.width + x);
  }

  for (let y = 0; y < info.height; y++) {
    enqueue(y * info.width);
    enqueue(y * info.width + info.width - 1);
  }

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {
    const pixelIndex = queue[queueIndex];
    const x = pixelIndex % info.width;
    const y = Math.floor(pixelIndex / info.width);
    data[pixelIndex * info.channels + 3] = 0;

    if (x > 0) enqueue(pixelIndex - 1);
    if (x < info.width - 1) enqueue(pixelIndex + 1);
    if (y > 0) enqueue(pixelIndex - info.width);
    if (y < info.height - 1) enqueue(pixelIndex + info.width);
  }

  const webpBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  })
    .webp({ quality: 90 })
    .toBuffer();

  return {
    buffer: webpBuffer,
    width: metadata.width ?? info.width,
    height: metadata.height ?? info.height
  };
};

const { data: rows, error } = await supabase
  .from('product_images')
  .select('id,storage_bucket,storage_path')
  .not('storage_path', 'is', null)
  .order('storage_path', { ascending: true });

if (error) throw new Error(`product_images: ${error.message}`);

let processed = 0;
let skipped = 0;
let failed = 0;

for (const row of rows ?? []) {
  if (limit !== undefined && processed >= limit) break;

  const bucket = row.storage_bucket || 'site-media';
  const storagePath = row.storage_path;

  if (!storagePath) {
    skipped++;
    continue;
  }

  try {
    const { data: downloaded, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (downloadError) throw downloadError;

    const inputBuffer = Buffer.from(await downloaded.arrayBuffer());
    const result = await makeBlackTransparent(inputBuffer);

    if (apply) {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, result.buffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('product_images')
        .update({
          mime_type: 'image/webp',
          size_bytes: result.buffer.byteLength,
          width: result.width,
          height: result.height
        })
        .eq('id', row.id);

      if (updateError) throw updateError;
    }

    processed++;
    console.log(`${apply ? 'Reemplazada' : 'Lista'}: ${bucket}/${storagePath}`);
  } catch (rowError) {
    failed++;
    console.warn(`Error procesando ${bucket}/${storagePath}: ${rowError.message}`);
  }
}

console.log(
  `${apply ? 'Imagenes reemplazadas' : 'Imagenes listas para reemplazar'}: ${processed}. Saltadas: ${skipped}. Fallidas: ${failed}. Threshold: ${threshold}.`
);

if (!apply) {
  console.log('Modo prueba: no se modifico Supabase. Ejecuta con -- --apply para reemplazar en la misma ruta.');
}
