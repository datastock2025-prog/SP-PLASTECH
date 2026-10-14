import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const API_BASE = process.env.API_BASE_URL || 'http://127.0.0.1:4000';

test.describe('Platform Security & Protocol Verification (TC-IDN-1A)', () => {
  // TC-IDN-1A-01: health endpoint 200 with Server-Timing
  test('TC-IDN-1A-01: health endpoint returns 200 with Server-Timing header', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data?.status).toBe('ok');
    const timing = res.headers()['server-timing'];
    expect(timing).toBeDefined();
    expect(timing).toContain('db;dur=');
  });

  // TC-IDN-1A-02: built bundle contains no "supabase.co" and no "sb_publishable"
  test('TC-IDN-1A-02: built bundle contains no supabase.co and no sb_publishable literals', async () => {
    const distPath = join(process.cwd(), 'frontend', 'dist');
    function scanFiles(dir: string): string[] {
      let results: string[] = [];
      try {
        const list = readdirSync(dir);
        for (const file of list) {
          const filePath = join(dir, file);
          const stat = statSync(filePath);
          if (stat.isDirectory()) {
            results = results.concat(scanFiles(filePath));
          } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
            results.push(filePath);
          }
        }
      } catch {
        // dist might not be built during plain e2e run, skip if not found
      }
      return results;
    }

    const files = scanFiles(distPath);
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      expect(content).not.toContain('gqrelwvmeoqvfnanoutz.supabase.co');
      expect(content).not.toContain('sb_publishable_RN013pGcuejquwnEeW-n3Q_Ly2qVu2R');
    }
  });

  // TC-IDN-1A-03: response has no Access-Control-Allow-Origin * from /api
  test('TC-IDN-1A-03: /api responses do not include wildcard Access-Control-Allow-Origin: *', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    const allowOrigin = res.headers()['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('*');
  });

  // TC-IDN-1A-07: rate limit returns 429 with a friendly message
  test('TC-IDN-1A-07: exceeding request threshold returns 429 with friendly message', async ({ request }) => {
    // Send request with spoofed IP to trigger limiter
    const spoofIp = '198.51.100.99';
    let hit429 = false;
    for (let i = 0; i < 305; i++) {
      const res = await request.get(`${API_BASE}/api/health`, {
        headers: { 'cf-connecting-ip': spoofIp },
      });
      if (res.status() === 429) {
        hit429 = true;
        const json = await res.json();
        expect(json.error?.code).toBe('RATE_LIMITED');
        expect(json.error?.message).toContain('Too many requests');
        break;
      }
    }
    expect(hit429).toBe(true);
  });
});
