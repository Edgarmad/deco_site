import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: false }
    })
  : null;

export const getPublicStorageUrl = (bucket: string, path?: string | null) => {
  if (!supabase || !path) return undefined;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};
