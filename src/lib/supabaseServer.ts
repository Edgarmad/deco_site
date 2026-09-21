import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const requestClients = new WeakMap<Request, SupabaseClient>();

const parseCookieHeader = (cookieHeader: string | null) => {
  if (!cookieHeader) return [];

  return cookieHeader.split(';').map((cookie) => {
    const [name = '', ...valueParts] = cookie.trim().split('=');
    return {
      name,
      value: valueParts.join('=')
    };
  }).filter((cookie) => cookie.name);
};

export const createSupabaseServerClient = (request: Request, cookies: AstroCookies) => {
  const existing = requestClients.get(request);
  if (existing) return existing;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  const cookieValues = new Map(parseCookieHeader(request.headers.get('cookie')).map(cookie => [cookie.name, cookie.value]));
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax', path: '/' },
    cookies: {
      getAll() {
        return Array.from(cookieValues, ([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieValues.set(name, value);
          cookies.set(name, value, options as CookieOptions);
        });
      }
    }
  });
  requestClients.set(request, client);
  return client;
};
