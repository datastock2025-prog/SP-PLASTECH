import { createRouter } from '../../core/router.js';

export function createIntegrationsRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'integrations', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
