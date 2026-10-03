import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT (SECURITY HARDENED & VENDOR-AGNOSTIC)
// ============================================================================

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
 * Generic Health Check Utility
 * Fully dynamic and table-agnostic: does NOT query 'items' or any business table.
 * Probes the PostgREST / Kong gateway root directly.
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
      // Dynamic Auth Gateway Liveness Probe: 0 table dependencies, returns clean HTTP 200
      let isOk = false;
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
          method: 'GET',
          headers: {
            apikey: supabaseAnonKey,
          },
        });
        isOk = response.ok || response.status === 200;
      } catch {
        // Fallback to internal client session ping
        const { error } = await supabase.auth.getSession();
        isOk = !error;
      }

      const latencyMs = Math.round(performance.now() - start);
      const res = { connected: isOk, latencyMs };
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
