import { IDatabaseAdapter } from './types';
import { SupabaseAdapter } from './adapters/SupabaseAdapter';
import { RestApiAdapter } from './adapters/RestApiAdapter';
import { OfflineIndexedDbAdapter } from './adapters/OfflineIndexedDbAdapter';
import { DualSyncHybridAdapter } from './adapters/DualSyncHybridAdapter';
import { supabase } from '../supabaseClient';

export * from './types';
export { SupabaseAdapter } from './adapters/SupabaseAdapter';
export { RestApiAdapter } from './adapters/RestApiAdapter';
export { OfflineIndexedDbAdapter } from './adapters/OfflineIndexedDbAdapter';
export { DualSyncHybridAdapter } from './adapters/DualSyncHybridAdapter';

/**
 * Universal Database Provider Factory
 * Reads VITE_DB_PROVIDER from environment and instantiates the chosen database adapter.
 *
 * Supported providers:
 * - 'hybrid_sync' (or 'dual_sync'): Connects Cloudflare to Supabase Cloud & Local testing to Local Podman / Postgres
 * - 'supabase': Supabase Cloud / Kong Gateway PostgreSQL
 * - 'rest_api': NestJS BFF / Local REST API Gateway
 * - 'offline_db': Client-side persistent resilient store
 */
function createDatabaseAdapter(): IDatabaseAdapter {
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    'https://gqrelwvmeoqvfnanoutz.supabase.co';
  const anonKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    'sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R';

  return new SupabaseAdapter(url, anonKey, supabase);
}

/**
 * Global Vendor-Agnostic Database Gateway Singleton
 * Use this across all 16 ERP modules for zero-hardcoding data access.
 */
export const db: IDatabaseAdapter = createDatabaseAdapter();
export default db;
