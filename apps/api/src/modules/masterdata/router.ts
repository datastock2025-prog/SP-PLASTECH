import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { masterDataService } from './service.js';

export function createMasterDataRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'masterdata', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
