import { defineMiddleware } from 'astro:middleware';
import { getAdminSession } from './lib/adminAuth';
import { applyAdminSecurityHeaders, isTrustedAdminPostOrigin } from './lib/adminSecurity';
import { serviceAvailability, temporaryUnavailableResponse } from './lib/serviceAvailability';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname.replace(/\/+$/, '') || '/';

  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
    return serviceAvailability.run({ unavailable: false, signal: AbortSignal.timeout(8000) }, async () => {
      try {
        const response = await next();
        if (serviceAvailability.getStore()?.unavailable) return temporaryUnavailableResponse();
        response.headers.set('Cache-Control', 'no-store');
        return response;
      } catch (error) {
        if (serviceAvailability.getStore()?.unavailable) return temporaryUnavailableResponse();
        throw error;
      }
    });
  }

  if (!isTrustedAdminPostOrigin(context.request, context.url)) return applyAdminSecurityHeaders(new Response('Origen no permitido', { status: 403 }));

  if (pathname === '/admin/login') {
    return applyAdminSecurityHeaders(await next());
  }

  const session = await getAdminSession(context.request, context.cookies);
  if (!session) {
    const loginUrl = new URL('/admin/login', context.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return applyAdminSecurityHeaders(Response.redirect(loginUrl, 302));
  }

  return applyAdminSecurityHeaders(await next());
});
