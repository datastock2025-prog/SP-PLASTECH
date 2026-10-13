import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { salesService } from './service.js';

export function createSalesRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'sales', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
