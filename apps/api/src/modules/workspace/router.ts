import { createRouter } from '../../core/router.js';

export function createWorkspaceRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'workspace', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
