import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { engineeringService } from './service.js';

export function createEngineeringRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'engineering', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
