import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { config } from './config.js';
import { getGlobalPool } from './db.js';
import { closeNodeDatabase, initNodeDatabase, resolveDevSecret } from './localDb.js';
import { createAuth } from './auth.js';
import { buildApp } from './app.js';
import { verifySchemaVersion } from './migrate.js';
import { bootstrap } from './bootstrap.js';
import { getJobBoss, stopJobBoss } from './jobs.js';

async function main() {
  config.root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  config.secret = resolveDevSecret();
  await initNodeDatabase();
  const schemaVersion = await verifySchemaVersion();
  console.log(`[middleware] database schema verified at migration version: ${schemaVersion}`);
  await bootstrap();
  await getJobBoss();

  const app = buildApp();
  const server = serve({ fetch: app.fetch, port: config.port }, () => console.log(`[middleware] listening on :${config.port}`));
  const shutdown = async () => {
    server.close();
    await stopJobBoss();
    await closeNodeDatabase(getGlobalPool()!);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('uncaughtException', (err) => {
    console.error('[middleware uncaughtException]', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[middleware unhandledRejection]', reason);
  });
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
