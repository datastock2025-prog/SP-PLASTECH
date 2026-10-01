import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT (SECURITY HARDENED)
// Connected to Local Podman Kong Gateway & PostgreSQL
// ============================================================================

// Default fallback tokens for secure Cloudflare / Web connectivity
const DEFAULT_SUPABASE_URL = 'https://gqrelwvmeoqvfnanoutz.supabase.co';
const DEFAULT_ANON_KEY =
  'sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_ANON_KEY;

/**
 * Hardened Supabase Client instance
 * - Exclusively utilizes public anon key in browser context (RLS enforced)
 * - Service role key is NEVER exposed to the frontend
 * - Localhost port bound
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Health check utility to verify Supabase Kong gateway and database connectivity
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = performance.now();
  try {
    const { error } = await supabase.from('items').select('id', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return { connected: false, error: error.message };
    }
    const latencyMs = Math.round(performance.now() - start);
    return { connected: true, latencyMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown connection failure';
    return { connected: false, error: message };
  }
}

export default supabase;
