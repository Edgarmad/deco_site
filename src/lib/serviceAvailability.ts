import { AsyncLocalStorage } from 'node:async_hooks';

type Availability = { unavailable: boolean; signal: AbortSignal };
export const serviceAvailability = new AsyncLocalStorage<Availability>();

// Each visit owns its state: one failed request must not affect other visitors.
export const fetchWithAvailability: typeof fetch = async (input, init) => {
  const state = serviceAvailability.getStore();
  const signals = [state?.signal, init?.signal, input instanceof Request ? input.signal : undefined]
    .filter((signal): signal is AbortSignal => Boolean(signal));
  try {
    const response = await fetch(input, {
      ...init,
      signal: signals.length ? AbortSignal.any(signals) : AbortSignal.timeout(8000)
    });
    if (state && (response.status >= 500 || [401, 402, 403, 429].includes(response.status))) {
      state.unavailable = true;
    }
    return response;
  } catch (error) {
    if (state) state.unavailable = true;
    throw error;
  }
};

export const temporaryUnavailableResponse = () => new Response(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Volvemos pronto | DECO ABC</title>
  <link rel="icon" href="/assets/favicon.ico">
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f4f6f8;color:#171b24;font-family:Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}
    main{width:100%;max-width:620px;background:white;border:1px solid #e0e5eb;border-radius:24px;padding:56px 40px;text-align:center;box-shadow:0 20px 70px #142b4610}
    img{width:180px;max-width:100%;height:auto;margin-bottom:36px}.label{font-size:12px;letter-spacing:2px;font-weight:700;color:#25643e;text-transform:uppercase}
    h1{font-size:clamp(30px,6vw,44px);line-height:1.1;margin:18px 0}p{font-size:17px;line-height:1.7;color:#535d6c;margin:0 auto 28px;max-width:440px}
    a{display:inline-block;padding:15px 26px;background:#164da0;color:white;border-radius:8px;text-decoration:none;font-weight:700}a:hover{background:#103a79}a:focus-visible{outline:3px solid #25643e;outline-offset:5px}
    .note{font-size:13px;margin:24px 0 0}@media(max-width:480px){main{padding:36px 22px;border-radius:16px}}
  </style>
</head>
<body><main>
  <img src="/assets/photos/deco_abc_logo.png" alt="DECO ABC">
  <div class="label">Servicio temporalmente no disponible</div>
  <h1>Volvemos pronto</h1>
  <p>En este momento no podemos cargar la información del sitio. Por favor, intenta nuevamente en unos minutos.</p>
  <a href="">Volver a intentar</a>
  <p class="note">Gracias por tu paciencia.</p>
</main></body></html>`, {
  status: 503,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Retry-After': '60'
  }
});
