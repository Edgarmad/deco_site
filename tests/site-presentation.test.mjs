import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHomeCovers, getCatalogAreas } from '../src/lib/sitePresentation.ts';

test('portadas aceptan solo un mapa de tipos a slugs, sin URLs ni estructuras arbitrarias', () => {
  assert.deepEqual(parseHomeCovers('{"lambrin":"roble","bad":"https://example.com","nested":{},"invalid key":"roble"}'), { lambrin: 'roble' });
  for (const value of ['null', '[]', 'false', '{broken']) assert.deepEqual(parseHomeCovers(value), {});
});

test('accesorios se encuentran desde ambos catálogos sin cambiar el área de otros tipos', () => {
  assert.deepEqual(getCatalogAreas('accesorios', 'exterior'), ['interior', 'exterior']);
  assert.deepEqual(getCatalogAreas('vigas-wpc', 'interior'), ['interior']);
  assert.deepEqual(getCatalogAreas('deck-coextruido', 'exterior'), ['exterior']);
});
