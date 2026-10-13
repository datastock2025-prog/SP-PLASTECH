import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { manufacturingService } from './service.js';

export function createManufacturingRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'manufacturing', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
