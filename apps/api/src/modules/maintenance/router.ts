import { createRouter } from '../../core/router.js';

export function createMaintenanceRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'maintenance', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
