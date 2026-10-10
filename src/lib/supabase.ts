import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { fetchWithAvailability } from './serviceAvailability';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const storageAssetVersion = 'transparent-bg-20260918';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: false },
      global: { fetch: fetchWithAvailability },
      realtime: { transport: WebSocket as never }
    })
  : null;

export const getPublicStorageUrl = (bucket: string, path?: string | null) => {
  if (!supabase || !path) return undefined;
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  const url = new URL(publicUrl);
  url.searchParams.set('v', storageAssetVersion);
  return url.toString();
};
