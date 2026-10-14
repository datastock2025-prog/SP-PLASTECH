/**
 * Application Runtime Configuration Helper
 * Ensures correct API Base URLs across Local Dev, Cloudflare Workers, and Production VPS
 * Prevents 'http://localhost:3000' leaks when running in production browsers.
 */

export function getApiBaseUrl(suffix = '/api'): string {
  // 1. Explicit environment override
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    const custom = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    if (!suffix) return custom;
    return suffix.startsWith('/') ? `${custom}${suffix}` : `${custom}/${suffix}`;
  }

  // 2. Production / Cloudflare context
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalhost) {
      // In production (Cloudflare Pages/Workers/Domain), route via relative path
      return suffix || '/api';
    }
  }

  // 3. Localhost development fallback
  const base = 'http://localhost:3000';
  if (!suffix) return base;
  return suffix.startsWith('/') ? `${base}${suffix}` : `${base}/${suffix}`;
}

export default getApiBaseUrl;
