import { IDatabaseAdapter } from './types';
import { SupabaseAdapter } from './adapters/SupabaseAdapter';
import { RestApiAdapter } from './adapters/RestApiAdapter';
import { supabase } from '../supabaseClient';

export * from './types';
export { SupabaseAdapter } from './adapters/SupabaseAdapter';
export { RestApiAdapter } from './adapters/RestApiAdapter';

/**
 * Universal Database Provider Factory
 * Reads VITE_DB_PROVIDER from environment and instantiates the chosen database adapter.
 * TanStack Query v5 cache is the Single Source of Truth (SSOT).
 *
 * Supported providers:
 * - 'supabase': Supabase Cloud / PostgreSQL
 * - 'rest_api': Unified Hono API Gateway
 */
function createDatabaseAdapter(): IDatabaseAdapter {
  const provider = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DB_PROVIDER) || 'rest_api';

  if (provider === 'supabase') {
    const url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
    const anonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
    if (url && anonKey) {
      return new SupabaseAdapter(url, anonKey, supabase);
    }
  }

  // Default: RestApiAdapter calling authoritative backend at /api/v1
  return new RestApiAdapter();
}

/**
 * Global Vendor-Agnostic Database Gateway Singleton
 * Use this across all 16 ERP modules for zero-hardcoding data access.
 */
export const db: IDatabaseAdapter = createDatabaseAdapter();
export default db;
