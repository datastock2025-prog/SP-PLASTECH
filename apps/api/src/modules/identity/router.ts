import { createRouter } from '../../core/router.js';
import { requireSession, can, enforcePasswordChange, wrap } from '../../core/middleware.js';
import { identityService } from './service.js';

export function createIdentityRouter() {
  const router = createRouter();

  // Root identity info
  router.get('/health', (req, res) => {
    res.json({ module: 'identity', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
