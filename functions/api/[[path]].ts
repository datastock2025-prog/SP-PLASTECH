/**
 * Cloudflare Pages Functions — Secure Server-Side Enterprise API Proxy
 * Intercepts /api/* requests and routes to the active backend / Hono API gateway
 */

import { handleIdentity, isIdentityPath, type IdentityEnv } from './_identity';

interface Env extends IdentityEnv {
  BACKEND_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Login, users, plants and profile are served directly on Cloudflare (Supabase Postgres).
  if (isIdentityPath(url.pathname)) return handleIdentity(request, env as IdentityEnv, context.waitUntil.bind(context));

  // Default backend URL or fallback
  const backendBase = env.BACKEND_URL || 'http://localhost:4000';

  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID, X-Correlation-ID',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  const targetUrl = new URL(url.pathname + url.search, backendBase);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    if (origin) {
      responseHeaders.set('Access-Control-Allow-Origin', origin);
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'API Gateway Proxy Error', message: error.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
