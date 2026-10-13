import { createRouter } from '../../core/router.js';

export function createCrmRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'crm', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
