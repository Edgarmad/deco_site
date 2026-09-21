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
test('valida los formatos oficiales de la calculadora sin inventar rendimiento', () => {
  for (const specs of [{ coverage: '4.60' }, { coverage: '-4.60 m²' }, { coverage: '0 m²' }, { pieces_per_box: '10*5' }, { pieces_per_box: '1.5 piezas' }]) {
    assert.throws(() => parseContentForm(contentModules.productos, productForm({ technical_specs: JSON.stringify(specs) })));
  }
  const valid = parseContentForm(contentModules.productos, productForm({ technical_specs: '{"coverage":"4.35 m²","pieces_per_box":"N/A"}', dimensions: '290 x 10*5 cm' }));
  assert.equal(valid.technical_specs.coverage, '4.35 m²');
  assert.equal(valid.dimensions, '290 x 10*5 cm');
  assert.throws(() => parseContentForm(contentModules.productos, productForm({ dimensions: '10*5 x 290 cm' })), /Dimensiones/);
});
test('los campos guiados conservan claves adicionales y permiten quitar un rendimiento', () => {
  const form = productForm({ structured_specs: '1', technical_specs: '{"custom":"conservar"}', spec_coverage: '4.60 m²', spec_pieces_per_box: '10 piezas', spec_presentation: 'Caja' });
  const values = parseContentForm(contentModules.productos, form);
  assert.deepEqual(values.technical_specs, { custom: 'conservar', coverage: '4.60 m²', pieces_per_box: '10 piezas', presentation: 'Caja' });
  form.set('spec_coverage', '');
  assert.equal(parseContentForm(contentModules.productos, form).technical_specs.coverage, undefined);
  assert.equal(values.fallback_image_path, 'products/_placeholder/product-placeholder.webp');
});
test('guardar otro campo no destruye ni bloquea formatos heredados del inventario', () => {
  const form = productForm({ technical_specs: '{"pieces_per_box":"N/A piezas"}' });
  const values = parseContentForm(contentModules.productos, form, { id: 'existing', technical_specs: { pieces_per_box: 'N/A piezas' } });
  assert.equal(values.technical_specs.pieces_per_box, 'N/A piezas');
  assert.equal('fallback_image_path' in values, false);
});
