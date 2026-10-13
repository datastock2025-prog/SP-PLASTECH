import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { qualityService } from './service.js';

export function createQualityRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'quality', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
