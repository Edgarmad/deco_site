import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

const parseCookieHeader = (cookieHeader: string | null) => {
  if (!cookieHeader) return [];

  return cookieHeader.split(';').map((cookie) => {
    const [name = '', ...valueParts] = cookie.trim().split('=');
    return {
      name,
      value: decodeURIComponent(valueParts.join('='))
    };
  }).filter((cookie) => cookie.name);
};

export const createSupabaseServerClient = (request: Request, cookies: AstroCookies) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie'));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options as CookieOptions);
        });
      }
    }
  });
};
