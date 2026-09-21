import type { AstroCookies } from 'astro';

const csrfCookieName = 'deco_admin_csrf';

export const isAdminSecurityRelaxed = () => {
  return import.meta.env.DEV;
};

const csrfCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: import.meta.env.PROD,
  path: '/admin',
  maxAge: 60 * 60 * 8
};

const secureCompare = (first: string, second: string) => {
  if (!first || !second || first.length !== second.length) return false;

  let mismatch = 0;
  for (let index = 0; index < first.length; index += 1) {
    mismatch |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }

  return mismatch === 0;
};

const createCsrfToken = () => crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');

export const getCsrfToken = (cookies: AstroCookies) => {
  const existingToken = cookies.get(csrfCookieName)?.value;
  if (existingToken) return existingToken;

  const token = createCsrfToken();
  cookies.set(csrfCookieName, token, csrfCookieOptions);
  return token;
};

export const validateCsrfToken = (cookies: AstroCookies, formData: FormData) => {
  const cookieToken = cookies.get(csrfCookieName)?.value ?? '';
  const formToken = String(formData.get('csrf_token') ?? '');
  return secureCompare(cookieToken, formToken);
};

export const getSafeAdminRedirectPath = (value: string | null) => {
  if (!value) return '/admin';

  try {
    const decoded = decodeURIComponent(value);
    if (decoded === '/admin' || decoded.startsWith('/admin/')) return decoded;
  } catch {
    return '/admin';
  }

  return '/admin';
};

export const isTrustedAdminPostOrigin = (request: Request, currentUrl: URL) => {
  if (isAdminSecurityRelaxed()) return true;
  if (request.method !== 'POST') return true;

  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? currentUrl.protocol.replace(':', '');
  const trustedOrigins = new Set([
    currentUrl.origin,
    host ? `${currentUrl.protocol}//${host}` : '',
    host ? `${forwardedProto}://${host}` : '',
    forwardedHost ? `${forwardedProto}://${forwardedHost}` : ''
  ].filter(Boolean));

  const origin = request.headers.get('origin');
  if (origin) return trustedOrigins.has(origin);

  const referer = request.headers.get('referer');
  if (!referer) return true;

  try {
    return trustedOrigins.has(new URL(referer).origin);
  } catch {
    return false;
  }
};

export const applyAdminSecurityHeaders = (response: Response) => {
  const securedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers)
  });
  const headers = securedResponse.headers;

  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co"
    ].join('; ')
  );

  return securedResponse;
};
