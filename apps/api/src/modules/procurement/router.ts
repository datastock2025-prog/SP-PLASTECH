import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { procurementService } from './service.js';

export function createProcurementRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'procurement', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
