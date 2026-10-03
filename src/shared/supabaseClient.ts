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
      // Dynamic Gateway Root Probe: 0 table scans, 0 mock dependencies, instant 200 OK
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      const latencyMs = Math.round(performance.now() - start);
      const isOk = response.ok || response.status === 200 || response.status === 304;
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
