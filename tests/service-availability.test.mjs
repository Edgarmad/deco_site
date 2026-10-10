import test from 'node:test';
import assert from 'node:assert/strict';
import { serviceAvailability, fetchWithAvailability, temporaryUnavailableResponse } from '../src/lib/serviceAvailability.ts';

test('detecta cuota, errores remotos y conexión sin contaminar otras visitas', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [200, 400, 401, 402, 403, 429, 503]) {
      globalThis.fetch = async () => new Response('', { status });
      const state = { unavailable: false, signal: AbortSignal.timeout(8000) };
      await serviceAvailability.run(state, () => fetchWithAvailability('https://example.com'));
      assert.equal(state.unavailable, ![200, 400].includes(status));
    }
    globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
    const failed = { unavailable: false, signal: AbortSignal.timeout(8000) };
    await assert.rejects(serviceAvailability.run(failed, () => fetchWithAvailability('https://example.com')));
    assert.equal(failed.unavailable, true);
    assert.equal(serviceAvailability.getStore(), undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('el aviso responde 503 sin caché y permite reintentar la misma URL', async () => {
  const response = temporaryUnavailableResponse();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Retry-After'), '60');
  const html = await response.text();
  assert.match(html, /lang="es"/);
  assert.match(html, /href=""/);
  assert.match(html, /Volvemos pronto/);
});
