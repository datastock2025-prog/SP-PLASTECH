import { buildApp } from './app.js';
import { configure } from './config.js';

const app = buildApp();

// shortcut: pipe Cloudflare Workers env bindings into middleware config
app.use('/api/*', async (c, next) => {
  if (c.env) {
    const env = c.env as Record<string, string | undefined>;
    configure({
      databaseUrl: env.DATABASE_URL,
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      setupToken: env.SETUP_TOKEN,
    });
  }
  await next();
});

export { createResourceRouter } from './crud.js';
export default app;
