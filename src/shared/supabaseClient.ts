import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT (SECURITY HARDENED)
// Connected to Local Podman Kong Gateway & PostgreSQL
// ============================================================================

// Default fallback tokens (matching containers/kong.yml credentials)
const DEFAULT_SUPABASE_URL = 'http://localhost:8000';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYm9vdC1kZXYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.reboot_dev_anon_secure_token_key_2026';

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
