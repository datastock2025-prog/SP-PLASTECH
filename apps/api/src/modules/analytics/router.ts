import { createRouter } from '../../core/router.js';

export function createAnalyticsRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'analytics', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
