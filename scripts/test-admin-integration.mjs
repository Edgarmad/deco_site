// Prueba opt-in contra Supabase: crea un admin temporal y contenido aislado, y los retira en finally.
// Ejecutar: node --env-file=.env scripts/test-admin-integration.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { contentModules } from '../src/lib/adminContent.ts';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Se requiere SUPABASE_SERVICE_ROLE_KEY solo para preparar y retirar las pruebas.');
const service = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const port = 4397;
const origin = `http://localhost:${port}`;
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'dev', '--host', 'localhost', '--port', String(port)], { stdio: 'ignore' });
const prefix = `cms-smoke-${randomUUID()}`;
const email = `${prefix}@example.com`;
const password = `${randomUUID()}Aa1!`;
const cookies = new Map();
const records = new Map();
let userId;
let files = [];
async function request(path, body, authenticated = true) {
  const response = await fetch(`${origin}${path}`, {
    method: body ? 'POST' : 'GET', redirect: 'manual', body,
    headers: { ...(body ? { Origin: origin } : {}), ...(authenticated ? { Cookie: Array.from(cookies, ([name, value]) => `${name}=${value}`).join('; ') } : {}) }
  });
  if (authenticated) for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(';'); const index = pair.indexOf('='); cookies.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return response;
}
async function token(path) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path} must load`);
  const html = await response.text();
  const value = html.match(/name="csrf_token" value="([^"]+)"/)?.[1];
  assert.ok(value, `${path} CSRF missing`);
  return value;
}
function contentForm(section, values) {
  const form = new FormData();
  for (const field of contentModules[section].fields) {
    if (field.type === 'checkbox') { if (values[field.key]) form.set(field.key, 'on'); }
    else form.set(field.key, String(values[field.key] ?? (field.type === 'json' ? '{}' : field.key === 'sort_order' || field.key === 'price' ? '0' : field.key === 'status' ? 'draft' : '')));
  }
  form.set('intent', 'save');
  return form;
}
async function save(section, values, id) {
  const path = `/admin/${section}/${id ?? 'nuevo'}`;
  const form = contentForm(section, values);
  form.set('csrf_token', await token(path));
  const response = await request(path, form);
  assert.equal(response.status, 303, `${section} save failed: ${(await response.text()).match(/role="alert"[^>]*>([^<]+)/)?.[1] ?? response.status}`);
  const savedId = response.headers.get('location').match(/\/([\da-f-]+)\?saved/)?.[1];
  assert.ok(savedId);
  records.set(section, savedId);
  return savedId;
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try { if ((await request('/admin/login')).status === 200) { ready = true; break; } } catch {}
    await delay(500);
  }
  assert.ok(ready, 'El servidor de prueba no arrancó.');
  assert.equal((await request('/admin/proyectos', undefined, false)).status, 302);
  assert.equal((await request('/admin/login/', undefined, false)).status, 200);
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  userId = created.data.user.id;
  const profile = await service.from('profiles').insert({ id: userId, role: 'admin' });
  if (profile.error) throw profile.error;
  const login = new FormData();
  login.set('email', email); login.set('password', password); login.set('csrf_token', await token('/admin/login'));
  assert.equal((await request('/admin/login', login)).status, 302);
  for (const path of ['/admin', '/admin/productos', '/admin/categorias', '/admin/familias', '/admin/variantes', '/admin/proyectos', '/admin/ubicaciones', '/admin/configuracion']) assert.equal((await request(path)).status, 200, path);
  console.log('PASS login, sesión SSR, protección y módulos');

  const category = await save('categorias', { name: prefix, slug: prefix, status: 'published' });
  const family = await save('familias', { name: prefix, slug: prefix, category_id: category, status: 'published' });
  const variant = await save('variantes', { name: prefix, slug: prefix, product_id: family, status: 'published' });
  const productValues = { name: prefix, slug: prefix, variant_id: variant, status: 'draft', summary: 'CMS resumen', seo_title: `${prefix} SEO`, faq_items: '{"Pregunta de prueba":"Respuesta CMS"}', installation_notes: 'Paso CMS' };
  const product = await save('productos', productValues);
  assert.equal((await request(`/productos/${prefix}`, undefined, false)).status, 404);
  await save('productos', { ...productValues, status: 'published' }, product);
  let publicProduct = await request(`/productos/${prefix}`, undefined, false);
  assert.equal(publicProduct.status, 200);
  assert.match(await publicProduct.text(), /Respuesta CMS/);
  const invalid = contentForm('productos', { ...productValues, name: 'Must not save' });
  invalid.set('csrf_token', 'invalid');
  assert.equal((await request(`/admin/productos/${product}`, invalid)).status, 400);
  const unchanged = await service.from('product_options').select('name').eq('id', product).single();
  assert.equal(unchanged.data.name, prefix);
  await save('categorias', { name: prefix, slug: prefix, status: 'draft' }, category);
  assert.equal((await request(`/productos/${prefix}`, undefined, false)).status, 404);
  await save('categorias', { name: prefix, slug: prefix, status: 'published' }, category);
  console.log('PASS CRUD de jerarquía, publicación, borradores y CSRF');

  const projectValues = { title: prefix, slug: prefix, status: 'published', content: 'Contenido CMS', materials: 'Madera\nPiedra' };
  const project = await save('proyectos', projectValues);
  const location = await save('ubicaciones', { name: prefix, city: prefix, status: 'published', phone: '9991234567', maps_url: 'https://maps.google.com' });
  for (const [path, text] of [[`/proyectos/${prefix}`, 'Contenido CMS'], ['/ubicaciones', prefix], ['/', prefix]]) {
    const result = await request(path, undefined, false); assert.equal(result.status, 200); assert.ok((await result.text()).includes(text), path);
  }
  const png = await sharp({ create: { width: 10, height: 10, channels: 4, background: '#336699' } }).png().toBuffer();
  for (const [section, id, table, ownerKey] of [['productos', product, 'product_images', 'option_id'], ['proyectos', project, 'project_images', 'project_id']]) {
    const path = `/admin/${section}/${id}`;
    const upload = new FormData();
    upload.set('csrf_token', await token(path)); upload.set('intent', 'upload'); upload.set('file', new File([png], 'test.png', { type: 'image/png' }));
    upload.set('kind', 'main'); upload.set('sort_order', '0'); upload.set('alt_text', `${prefix} image`);
    assert.equal((await request(path, upload)).status, 303, 'upload');
    const first = await service.from(table).select('*').eq(ownerKey, id).single();
    assert.ok(first.data?.storage_path.endsWith('.webp')); files.push(first.data.storage_path);
    upload.set('replace_id', first.data.id);
    assert.equal((await request(path, upload)).status, 303, 'replace');
    const replaced = await service.from(table).select('*').eq(ownerKey, id).single();
    assert.notEqual(first.data.storage_path, replaced.data.storage_path); files.push(replaced.data.storage_path);
    const removed = await service.storage.from('site-media').download(first.data.storage_path);
    assert.ok(removed.error, 'Replaced file should be removed');
    const html = await (await request(`/${section}/${prefix}`, undefined, false)).text();
    assert.ok(html.includes(replaced.data.storage_path), 'Public page must show uploaded media');
    const remove = new FormData(); remove.set('csrf_token', await token(path)); remove.set('intent', 'image-delete'); remove.set('image_id', replaced.data.id); remove.set('confirm_delete', 'on');
    assert.equal((await request(path, remove)).status, 303);
  }
  console.log('PASS proyectos, ubicaciones, home, subida WebP, reemplazo y limpieza Storage');
  for (const section of ['productos', 'proyectos', 'ubicaciones', 'variantes', 'familias', 'categorias']) {
    const path = `/admin/${section}/${records.get(section)}`;
    const form = new FormData(); form.set('csrf_token', await token(path)); form.set('intent', 'delete'); form.set('confirm_delete', 'on');
    assert.equal((await request(path, form)).status, 303, `delete ${section}`);
  }
  assert.equal((await request(`/productos/${prefix}`, undefined, false)).status, 404);
  assert.equal((await request(`/proyectos/${prefix}`, undefined, false)).status, 404);
  const logout = new FormData(); logout.set('csrf_token', await token('/admin')); assert.equal((await request('/admin/logout', logout)).status, 302);
  assert.equal((await request('/admin')).status, 302);
  await service.from('profiles').update({ role: 'editor' }).eq('id', userId);
  login.set('csrf_token', await token('/admin/login'));
  const denied = await request('/admin/login', login); assert.match(await denied.text(), /no tiene permisos/);
  assert.equal((await request('/admin')).status, 302);
  console.log('PASS eliminación, logout y rechazo de usuario sin rol admin');
} finally {
  // Solo IDs creados por esta ejecución; ningún contenido preexistente se toca.
  for (const section of ['productos', 'proyectos', 'ubicaciones', 'variantes', 'familias', 'categorias']) {
    const id = records.get(section);
    if (!id) continue;
    const media = contentModules[section].media;
    if (media) {
      const rows = await service.from(media.table).select('storage_path').eq(media.key, id);
      files.push(...(rows.data ?? []).map(row => row.storage_path));
    }
    const result = await service.from(contentModules[section].table).delete().eq('id', id);
    if (result.error) console.error(`No se pudo retirar fixture ${section}: ${result.error.message}`);
  }
  if (files.length) {
    const removed = await service.storage.from('site-media').remove([...new Set(files)]);
    if (!removed.error) await service.from('media_cleanup_queue').delete().in('storage_path', files);
    else console.error('Quedó pendiente retirar archivos de prueba de Storage.');
  }
  if (userId) { const removed = await service.auth.admin.deleteUser(userId); if (removed.error) console.error('No se pudo retirar el usuario temporal.'); }
  server.kill();
}
