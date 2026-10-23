import { test as base, expect, type Page, type Request, type Response } from '@playwright/test';

export interface ApiCall {
  method: string;
  url: string;
  status: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  postData?: string | null;
  timing?: number;
}

export interface CallsTrafficInspector {
  records: ApiCall[];
  find: (predicate: (call: ApiCall) => boolean) => ApiCall | undefined;
  filter: (predicate: (call: ApiCall) => boolean) => ApiCall[];
  clear: () => void;
}

export function uniq(prefix = 'E2E'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}_${ts}_${rand}`;
}

export type EnterpriseFixtures = {
  calls: CallsTrafficInspector;
  consoleGuard: { errors: string[]; assertClean: () => void };
  uniq: (prefix?: string) => string;
};

export const test = base.extend<EnterpriseFixtures>({
  // Unique data generator fixture
  uniq: async ({}, use) => {
    await use(uniq);
  },

  // Traffic Inspector fixture: monitors all network interactions
  calls: async ({ page }, use) => {
    const records: ApiCall[] = [];

    const requestTimings = new Map<Request, number>();

    const onRequest = (req: Request) => {
      requestTimings.set(req, Date.now());
    };

    const onResponse = (res: Response) => {
      const req = res.request();
      const startTime = requestTimings.get(req) || Date.now();
      const duration = Date.now() - startTime;

      records.push({
        method: req.method(),
        url: req.url(),
        status: res.status(),
        requestHeaders: req.headers(),
        responseHeaders: res.headers(),
        postData: req.postData(),
        timing: duration,
      });
    };

    page.on('request', onRequest);
    page.on('response', onResponse);

    const inspector: CallsTrafficInspector = {
      records,
      find: (predicate) => records.find(predicate),
      filter: (predicate) => records.filter(predicate),
      clear: () => {
        records.length = 0;
      },
    };

    await use(inspector);

    page.off('request', onRequest);
    page.off('response', onResponse);
  },

  // Console Guard fixture: auto-fails tests if unhandled page errors or console errors occur
  consoleGuard: async ({ page }, use) => {
    const errorLogs: string[] = [];

    const onConsole = (msg: any) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless telemetry or network noise
        if (!text.includes('Failed to load resource: net::ERR_CONNECTION_REFUSED') &&
            !text.includes('ERR_ABORTED')) {
          errorLogs.push(`[Console Error] ${text}`);
        }
      }
    };

    const onPageError = (err: Error) => {
      errorLogs.push(`[Page Error] ${err.message}\n${err.stack}`);
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    const guard = {
      errors: errorLogs,
      assertClean: () => {
        if (errorLogs.length > 0) {
          throw new Error(`ConsoleGuard detected unhandled client errors:\n${errorLogs.join('\n')}`);
        }
      },
    };

    await use(guard);

    page.off('console', onConsole);
    page.off('pageerror', onPageError);

    // Assert clean console at test teardown
    guard.assertClean();
  },
});

export { expect };
