import { defineMiddleware } from 'astro:middleware';
import { getAdminSession } from './lib/adminAuth';
import { applyAdminSecurityHeaders, isTrustedAdminPostOrigin } from './lib/adminSecurity';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  if (!pathname.startsWith('/admin')) {
    return next();
  }

  if (!isTrustedAdminPostOrigin(context.request, context.url)) {
    return applyAdminSecurityHeaders(new Response('Forbidden', { status: 403 }));
  }

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
