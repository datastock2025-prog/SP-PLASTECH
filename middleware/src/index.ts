import { buildApp } from './app.js';
import { configure } from './config.js';

const app = buildApp();

// pipe Cloudflare Workers env bindings into middleware config
app.use('/api/*', async (c, next) => {
  if (c.env) {
    const env = c.env as Record<string, any>;
    const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
    configure({
      databaseUrl: connectionString,
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      setupToken: env.SETUP_TOKEN,
    });
  }
  await next();
});

export default app;
