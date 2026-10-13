import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { planningService } from './service.js';

export function createPlanningRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'planning', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
