import test from 'node:test';
import assert from 'node:assert/strict';
import { contentModules, parseContentForm } from '../src/lib/adminContent.ts';

function productForm(overrides = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: 'Roble', slug: 'panel-roble', variant_id: '00000000-0000-4000-8000-000000000001', price: '10.50', status: 'draft', sort_order: '0', technical_specs: '{"weight":"2 kg"}', ...overrides })) form.set(key, value);
  return form;
}
test('rechaza JSON malformado sin convertirlo silenciosamente en datos vacíos', () => {
  assert.throws(() => parseContentForm(contentModules.productos, productForm({ technical_specs: '{invalid' })), /JSON inválido/);
  assert.throws(() => parseContentForm(contentModules.productos, productForm({ technical_specs: '{"weight":[]}' })), /textos o números/);
});
test('valida en servidor URLs, identificadores, slugs, precios y estados manipulados', () => {
  for (const invalid of [{ technical_sheet_url: 'javascript:alert(1)' }, { variant_id: 'invalid' }, { slug: '../test' }, { price: '-1' }, { price: 'NaN' }, { status: 'private' }, { sort_order: '1.5' }, { canonical_path: '//external.test' }]) {
    assert.throws(() => parseContentForm(contentModules.productos, productForm(invalid)));
  }
});
test('la herencia de secciones no se convierte en una anulación global al guardar', () => {
  const values = parseContentForm(contentModules.productos, productForm({ section_support: 'false', section_faq: 'true' }));
  assert.deepEqual(values.section_visibility, { support: false, faq: true });
  assert.equal(values.price, 10.5);
  assert.deepEqual(values.technical_specs, { weight: '2 kg' });
});
test('limita coordenadas y exige datos mínimos de ubicaciones', () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: 'Sucursal', city: 'Mérida', status: 'draft', latitude: '91' })) form.set(key, value);
  assert.throws(() => parseContentForm(contentModules.ubicaciones, form), /Latitud/);
  form.set('latitude', '20.97');
  assert.equal(parseContentForm(contentModules.ubicaciones, form).latitude, 20.97);
  form.delete('city');
  assert.throws(() => parseContentForm(contentModules.ubicaciones, form), /obligatorio/);
});
