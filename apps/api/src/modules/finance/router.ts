import { createRouter } from '../../core/router.js';
import { requireSession, wrap } from '../../core/middleware.js';
import { financeService } from './service.js';

export function createFinanceRouter() {
  const router = createRouter();

  router.get('/health', (req, res) => {
    res.json({ module: 'finance', status: 'healthy', timestamp: new Date().toISOString() });
  });

  return router;
}
