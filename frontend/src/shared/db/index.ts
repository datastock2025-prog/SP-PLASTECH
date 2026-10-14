import { IDatabaseAdapter } from './types';
import { RestApiAdapter } from './adapters/RestApiAdapter';

export * from './types';
export { RestApiAdapter } from './adapters/RestApiAdapter';

/**
 * Global Authoritative Database Gateway Singleton
 * Use this across all 16 ERP modules for zero-hardcoding data access.
 * Communicates with the backend API at /api/v1 via RestApiAdapter.
 */
export const db: IDatabaseAdapter = new RestApiAdapter();
export default db;
