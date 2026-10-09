import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { config } from './config.js';
import { getGlobalPool } from './db.js';
import { closeNodeDatabase, initNodeDatabase, resolveDevSecret } from './localDb.js';
import { createAuth } from './auth.js';
import { buildApp } from './app.js';
import { migrate } from './migrate.js';
import { bootstrap } from './bootstrap.js';
import { identitySql } from './identitySql.js';

async function main() {
  config.root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  config.secret = resolveDevSecret();
  await initNodeDatabase();
  await migrate(createAuth(), identitySql);
  await bootstrap();

  const app = buildApp(identitySql);
  const server = serve({ fetch: app.fetch, port: config.port }, () => console.log(`[auth-server] listening on :${config.port}`));
  const shutdown = async () => {
    server.close();
    await closeNodeDatabase(getGlobalPool()!);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
