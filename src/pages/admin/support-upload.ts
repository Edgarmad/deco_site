import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabaseServer';
import { validateCsrfToken } from '../../lib/adminSecurity';
import { getAdminSession } from '../../lib/adminAuth';
import { isUuid } from '../../lib/adminContent';
import { prepareSupportUpload, finishSupportUpload } from '../../lib/adminSupportFiles';

export const prerender = false;
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!await getAdminSession(request, cookies)) return Response.json({ error: 'Sesión expirada.' }, { status: 401 });
  try {
    const form = await request.formData();
    if (!validateCsrfToken(cookies, form)) return Response.json({ error: 'El formulario expiró. Recarga la página.' }, { status: 403 });
    const variant = String(form.get('variant_id') ?? '');
    if (!isUuid(variant)) throw new Error('Familia inválida.');
    const client = createSupabaseServerClient(request, cookies);
    if (form.get('intent') === 'prepare') return Response.json(await prepareSupportUpload(client, variant, form));
    if (form.get('intent') === 'finish' && isUuid(String(form.get('support_id')))) {
      await finishSupportUpload(client, variant, String(form.get('support_id')));
      return Response.json({ ok: true });
    }
    throw new Error('Acción inválida.');
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'No se pudo subir el PDF.' }, { status: 400 }); }
};
