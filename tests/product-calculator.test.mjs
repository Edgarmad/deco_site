import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateArea, calculateLinear, getProductCalculator } from '../src/lib/productCalculator.ts';

const product = (overrides = {}) => ({
  name: 'Lambrin Premium WPC Roble',
  slug: 'lambrin-premium-wpc-roble',
  categorySlug: 'panel-lambrin-wpc',
  categoryName: 'Lambrin Premium WPC',
  macroCategory: 'interior',
  variants: [{ name: 'Lambrin Premium 4', slug: 'lambrin-premium-wpc', colors: [] }],
  technicalSpecs: {
    presentation: 'Caja',
    pieces_per_box: '10 piezas',
    coverage: '4.60 m²'
  },
  ...overrides
});

test('normaliza el formato técnico usado por Supabase para área', () => {
  const config = getProductCalculator(product());
  assert.deepEqual(config, {
    mode: 'area', coverage: 4.6, coverageUnit: 'm²', piecesPerPresentation: 10, presentationLabel: 'Caja'
  });
  assert.deepEqual(calculateArea(15, config), { requested: 15, presentations: 4, units: 40, covered: 18.4 });
});

test('calcula placas con piezas por presentación N/A como unidades', () => {
  const config = getProductCalculator(product({
    name: 'Placas Mármol Naturales',
    categorySlug: 'placas-marmol-pvc',
    categoryName: 'Placas Mármol PVC',
    technicalSpecs: { presentation: 'Placa', pieces_per_box: 'N/A', coverage: '3.48 m²' }
  }));
  assert.equal(config?.mode, 'area');
  assert.deepEqual(calculateArea(10, config), { requested: 10, presentations: 3, units: 3, covered: 10.44 });
});

test('normaliza y calcula familias lineales desde dimensions', () => {
  const config = getProductCalculator(product({
    name: 'Viga Coextruida Roble',
    slug: 'viga-exterior-roble',
    categorySlug: 'viga-exterior',
    categoryName: 'Viga Exterior',
    dimensions: '300 x 10 cm',
    technicalSpecs: { presentation: 'Caja', pieces_per_box: '4 piezas' }
  }));
  assert.deepEqual(config, { mode: 'linear', pieceLengthMeters: 3, piecesPerPresentation: 4, presentationLabel: 'Caja' });
  assert.deepEqual(calculateLinear(14, config), { requested: 14, presentations: 2, units: 8, covered: 24 });
});

test('oculta accesorios y datos que no cumplen el formato de cobertura', () => {
  assert.equal(getProductCalculator(product({ categorySlug: 'accesorios', categoryName: 'Accesorios' })), undefined);
  assert.equal(getProductCalculator(product({ technicalSpecs: { coverage: '4.60' } })), undefined);
  assert.equal(calculateArea(0, { mode: 'area', coverage: 4.6, coverageUnit: 'm²' }), undefined);
});
