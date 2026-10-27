import type { APIRoute } from 'astro';

// Panel de conversaciones del bot de WhatsApp (vive en n8n).
// La ruta está protegida por el middleware de /admin: solo entra quien inició sesión.
// La URL completa del panel (con su token) se guarda en la variable de entorno
// DECO_PANEL_URL de Vercel; nunca en el repositorio, porque es público.
export const prerender = false;

export const GET: APIRoute = () => {
  const panelUrl = (import.meta.env.DECO_PANEL_URL ?? process.env.DECO_PANEL_URL ?? '').trim();

  if (!/^https:\/\//.test(panelUrl)) {
    return new Response('El panel de conversaciones aún no está configurado (falta DECO_PANEL_URL).', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: panelUrl, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }
  });
};
