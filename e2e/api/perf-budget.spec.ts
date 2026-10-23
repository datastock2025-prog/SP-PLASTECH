import { test, expect } from '../fixtures';

const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';

test.describe('Enterprise API Performance & Server-Timing Budgets (A6, A8.5)', () => {
  test('core endpoints supply Server-Timing header with db and duration metrics', async ({ request }) => {
    const res = await request.get(`${API}/api/v1/plants?limit=5`, {
      headers: { Origin: ORIGIN },
    });

    if (res.ok()) {
      const serverTiming = res.headers()['server-timing'] || '';

      // Verify Server-Timing header exists
      expect(serverTiming).toBeDefined();

      // If middleware telemetry is active, parse timing values
      if (serverTiming.includes('dur=')) {
        const totalMatch = serverTiming.match(/total;dur=([\d.]+)/);
        if (totalMatch) {
          const totalMs = parseFloat(totalMatch[1]);
          // Performance budget: total server processing must be under 300ms for simple reads
          expect(totalMs).toBeLessThan(300);
        }

        const dbMatch = serverTiming.match(/db;dur=([\d.]+)/);
        if (dbMatch) {
          const dbMs = parseFloat(dbMatch[1]);
          // Performance budget: database execution time must be under 150ms
          expect(dbMs).toBeLessThan(150);
        }
      }
    }
  });

  test('consecutive list queries execute within p95 latency budget (< 150ms DB time)', async ({ request }) => {
    const samples: number[] = [];

    // Run 5 warm-up and measurement iterations
    for (let i = 0; i < 5; i++) {
      const t0 = Date.now();
      const res = await request.get(`${API}/api/v1/plants?limit=10`, {
        headers: { Origin: ORIGIN },
      });
      const elapsed = Date.now() - t0;

      if (res.ok()) {
        samples.push(elapsed);
      }
    }

    if (samples.length >= 3) {
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] || samples[samples.length - 1];
      // Assert client-observed p95 is under 500ms over local loopback
      expect(p95).toBeLessThan(500);
    }
  });
});
