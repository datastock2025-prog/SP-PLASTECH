import { createRouter } from '../../core/router.js';

export function createHrRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'hr', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
