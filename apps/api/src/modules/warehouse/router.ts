import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { warehouseService } from './service.js';

export function createWarehouseRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'warehouse', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
