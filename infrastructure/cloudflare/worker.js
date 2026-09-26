/**
 * SP-PLASTECH CLOUDFLARE EDGE WORKER — API GATEWAY & SECURITY PROXY
 * Features: Edge JWT Verification, X-Tenant-ID Validation, KV Rate Limiting, 5-Min Cache
 */

const PUBLIC_ROUTES = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/health', '/api/docs'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight Handling
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(request);
    }

    // 2. Health & Public Route Bypass
    const isPublic = PUBLIC_ROUTES.some((route) => url.pathname.startsWith(route));
    if (isPublic) {
      return forwardToOrigin(request, env);
    }

    // 3. Multi-Tenancy Header Verification (X-Tenant-ID)
    const tenantId = request.headers.get('X-Tenant-ID');
    if (!tenantId || tenantId.trim() === '') {
      return jsonError('Missing mandatory X-Tenant-ID header', 400, 'TENANT_HEADER_REQUIRED');
    }

    // 4. Edge-Level JWT Verification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Authorization token required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const jwtValid = await verifyJwtEdge(token, env.JWT_SECRET);
    if (!jwtValid.valid) {
      return jsonError(`Invalid or expired token: ${jwtValid.reason}`, 401, 'TOKEN_INVALID');
    }

    // 5. Distributed KV Rate Limiting per Tenant & IP (100 req/min)
    const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const rateLimitKey = `rl:${tenantId}:${clientIp}:${Math.floor(Date.now() / 60000)}`;

    if (env.RATE_LIMIT_KV) {
      const currentCount = parseInt((await env.RATE_LIMIT_KV.get(rateLimitKey)) || '0', 10);
      if (currentCount > 100) {
        return jsonError('Rate limit exceeded. Max 100 requests per minute.', 429, 'RATE_LIMIT_EXCEEDED');
      }
      await env.RATE_LIMIT_KV.put(rateLimitKey, (currentCount + 1).toString(), { expirationTtl: 120 });
    }

    // 6. Edge Response Caching for GET Requests (5 Minutes)
    if (request.method === 'GET' && env.CACHE_KV && !url.pathname.includes('/auth/')) {
      const cacheKey = `cache:${tenantId}:${url.pathname}${url.search}`;
      const cachedResponse = await env.CACHE_KV.get(cacheKey, { type: 'json' });

      if (cachedResponse) {
        const response = new Response(JSON.stringify(cachedResponse.body), {
          status: cachedResponse.status || 200,
          headers: {
            ...cachedResponse.headers,
            'Content-Type': 'application/json',
            'X-Edge-Cache': 'HIT',
          },
        });
        return applyCorsHeaders(response, request);
      }

      // Fetch from origin VPS
      const originRes = await forwardToOrigin(request, env);
      if (originRes.ok) {
        const cloned = originRes.clone();
        const jsonBody = await cloned.json().catch(() => null);
        if (jsonBody) {
          ctx.waitUntil(
            env.CACHE_KV.put(
              cacheKey,
              JSON.stringify({
                body: jsonBody,
                status: originRes.status,
                headers: Object.fromEntries(originRes.headers.entries()),
              }),
              { expirationTtl: 300 } // 5 minutes TTL
            )
          );
        }
      }
      return applyCorsHeaders(originRes, request);
    }

    // Forward mutating or non-cached requests
    const res = await forwardToOrigin(request, env);
    return applyCorsHeaders(res, request);
  },
};

/**
 * Edge JWT verification using Web Crypto API (HMAC-SHA256)
 */
async function verifyJwtEdge(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'Malformed JWT' };

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret || 'sp_plastech_super_jwt_secret_key_at_least_32_chars_long_2026');

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/_/g, '/').replace(/-/g, '+')), (c) => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, signature, data);
    if (!isValid) return { valid: false, reason: 'Signature verification failed' };

    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false, reason: 'Token has expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

async function forwardToOrigin(request, env) {
  const backendUrl = env.BACKEND_ORIGIN_URL || 'https://api.spplastech.com';
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, backendUrl);

  const newHeaders = new Headers(request.headers);
  newHeaders.set('X-Forwarded-Host', url.hostname);

  return fetch(targetUrl.toString(), {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    redirect: 'follow',
  });
}

function handleCorsPreflight(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Tenant-ID, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function applyCorsHeaders(response, request) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
  headers.set('Access-Control-Allow-Credentials', 'true');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonError(message, status, code) {
  return new Response(
    JSON.stringify({
      success: false,
      error: { code, message },
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
