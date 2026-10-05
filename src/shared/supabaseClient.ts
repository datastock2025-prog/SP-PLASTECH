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

// Singleton in-flight request deduplication & Session/Memory TTL Cache
const SESSION_HEALTH_KEY = 'sp_supabase_health_ok';
const SESSION_HEALTH_TS_KEY = 'sp_supabase_health_ts';
const PING_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory TTL
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes session storage TTL

let inFlightPing: Promise<{ connected: boolean; latencyMs?: number; error?: string }> | null = null;
let lastPingResult: { connected: boolean; latencyMs?: number; error?: string } | null = null;
let lastPingTimestamp = 0;

/**
 * Optimized Supabase Health Check Utility
 * - Session-level caching prevents redundant HTTP requests on component remounts / tab switches.
 * - In-flight deduplication ensures multiple simultaneous callers share a single request.
 * - Fully non-blocking for application startup & authentication.
 */
export async function checkSupabaseConnection(
  forceRefresh = false
): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const now = Date.now();

  // 1. In-memory TTL check (Fast path: 0ms)
  if (!forceRefresh && lastPingResult && now - lastPingTimestamp < PING_CACHE_TTL_MS) {
    return lastPingResult;
  }

  // 2. Browser sessionStorage check (Prevents redundant HTTP on navigation/remount)
  if (!forceRefresh && typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    try {
      const isHealthy = sessionStorage.getItem(SESSION_HEALTH_KEY);
      const storedTs = parseInt(sessionStorage.getItem(SESSION_HEALTH_TS_KEY) || '0', 10);
      if (isHealthy === 'true' && now - storedTs < SESSION_TTL_MS) {
        lastPingResult = { connected: true, latencyMs: 1 };
        lastPingTimestamp = now;
        return lastPingResult;
      }
    } catch {
      // Session storage unavailable; proceed to network check
    }
  }

  // 3. Deduplicate in-flight network requests
  if (inFlightPing) {
    return inFlightPing;
  }

  inFlightPing = (async () => {
    const start = performance.now();
    try {
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
        // Non-blocking fallback to internal client session ping
        const { error } = await supabase.auth.getSession();
        isOk = !error;
      }

      const latencyMs = Math.max(1, Math.round(performance.now() - start));
      const res = { connected: isOk, latencyMs };
      lastPingResult = res;
      lastPingTimestamp = Date.now();

      // Store in session storage if healthy
      if (isOk && typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem(SESSION_HEALTH_KEY, 'true');
          sessionStorage.setItem(SESSION_HEALTH_TS_KEY, String(lastPingTimestamp));
        } catch {}
      }

      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection probe failed';
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
