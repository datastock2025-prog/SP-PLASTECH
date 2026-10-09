import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { config } from './config.js';
import { closeDatabase, initDatabase } from './db.js';
import { createAuth } from './auth.js';
import { migrate } from './migrate.js';
import { bootstrap } from './bootstrap.js';
import { buildRouter } from './routes.js';
import { errorHandler } from './middleware.js';

async function main() {
  await initDatabase();
  const auth = createAuth();
  await migrate(auth);
  await bootstrap();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.isProd ? 1 : false);
  app.use(helmet());
  app.use(cors({ origin: config.trustedOrigins, credentials: true }));
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
  });
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

  // CSRF defence-in-depth (cookies are already SameSite=Lax): refuse state-changing calls from untrusted origins.
  const allowedOrigins = new Set([...config.trustedOrigins, config.baseURL]);
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Cross-origin request refused' } });
      return;
    }
    next();
  });
  app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.all('/api/auth/*', toNodeHandler(auth));

  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1', buildRouter(auth));
  app.use(errorHandler);

  const server = app.listen(config.port, () => console.log(`[auth-server] listening on :${config.port}`));
  const shutdown = async () => {
    server.close();
    await closeDatabase();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
