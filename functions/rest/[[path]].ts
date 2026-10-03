/**
 * Cloudflare Pages Functions — Secure Server-Side Supabase & API Proxy
 * Intercepts /rest/v1/* requests and securely injects API credentials server-side
 * Prevents exposing Supabase anon/service_role keys in client-side bundles.
 */

interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  BACKEND_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const supabaseUrl =
    env.VITE_SUPABASE_URL || 'https://gqrelwvmeoqvfnanoutz.supabase.co';
  const supabaseKey =
    env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R';

  // Rewrite destination to target Supabase PostgREST
  const targetPath = url.pathname.replace(/^\/rest/, '/rest');
  const targetUrl = new URL(targetPath + url.search, supabaseUrl);

  const modifiedHeaders = new Headers(request.headers);
  modifiedHeaders.set('apikey', supabaseKey);
  if (!modifiedHeaders.has('Authorization')) {
    modifiedHeaders.set('Authorization', `Bearer ${supabaseKey}`);
  }
  modifiedHeaders.set('X-Forwarded-Host', url.hostname);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: modifiedHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Proxy Gateway Error', message: error.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
