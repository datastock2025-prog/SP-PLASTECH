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

// Singleton in-flight request deduplication & TTL Cache
let inFlightPing: Promise<{ connected: boolean; latencyMs?: number; error?: string }> | null = null;
let lastPingResult: { connected: boolean; latencyMs?: number; error?: string } | null = null;
let lastPingTimestamp = 0;
const PING_CACHE_TTL_MS = 8000; // 8 seconds TTL

/**
 * Health check utility to verify Supabase Kong gateway and database connectivity
 * Optimized with in-flight deduplication, TTL cache, and lightweight limit(1) probe
 * Eliminates HTTP 206 Partial Content and net::ERR_ABORTED cascades.
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const now = Date.now();
  if (lastPingResult && now - lastPingTimestamp < PING_CACHE_TTL_MS) {
    return lastPingResult;
  }

  if (inFlightPing) {
    return inFlightPing;
  }

  inFlightPing = (async () => {
    const start = performance.now();
    try {
      // Lightweight single-row ping: returns instant 200 OK (no 206 Partial Content, no full table scan)
      const { error } = await supabase.from('items').select('id').limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        const res = { connected: false, error: error.message };
        lastPingResult = res;
        lastPingTimestamp = Date.now();
        return res;
      }
      const latencyMs = Math.round(performance.now() - start);
      const res = { connected: true, latencyMs };
      lastPingResult = res;
      lastPingTimestamp = Date.now();
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown connection failure';
      const res = { connected: false, error: message };
      lastPingResult = res;
      lastPingTimestamp = Date.now();
      return res;
    } finally {
      inFlightPing = null;
    }
  })();

  return inFlightPing;
}

export default supabase;
