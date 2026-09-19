import type { AstroCookies } from 'astro';
import { createSupabaseServerClient } from './supabaseServer';

export type AdminSession = {
  user: {
    id: string;
    email?: string;
  };
};

export const getAdminSession = async (request: Request, cookies: AstroCookies): Promise<AdminSession | null> => {
  const supabase = createSupabaseServerClient(request, cookies);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || profile?.role !== 'admin') return null;

  return {
    user: {
      id: user.id,
      email: user.email ?? undefined
    }
  };
};
