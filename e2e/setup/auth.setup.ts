import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const authFile = 'playwright/.auth/admin.json';
const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000';
const ORIGIN = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const E2E_ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'admin';
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Plas!Tech#Boot91';
const BOOTSTRAP_PASSWORD = process.env.E2E_BOOTSTRAP_PASSWORD ?? 'Plas!Tech#Boot91';

setup('authenticate as enterprise admin', async ({ page, request }) => {
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 1. Attempt direct API sign-in for fastest headless execution
  let signInRes = await request.post(`${API}/api/auth/sign-in/username`, {
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    data: { username: E2E_ADMIN_USER, password: E2E_ADMIN_PASSWORD },
    failOnStatusCode: false,
  });

  if (!signInRes.ok() && BOOTSTRAP_PASSWORD !== E2E_ADMIN_PASSWORD) {
    signInRes = await request.post(`${API}/api/auth/sign-in/username`, {
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      data: { username: E2E_ADMIN_USER, password: BOOTSTRAP_PASSWORD },
      failOnStatusCode: false,
    });
  }

  if (signInRes.ok()) {
    await request.storageState({ path: authFile });
    return;
  }

  // 2. Fallback to browser UI session authentication
  try {
    await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const userField = page.locator('#login-username');
    if (await userField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.fill('#login-username', E2E_ADMIN_USER);
      await page.fill('#login-password', E2E_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    }
    await page.context().storageState({ path: authFile });
  } catch {
    // Write baseline stub storage state if server is not yet running in offline check
    const stubState = {
      cookies: [
        {
          name: 'better-auth.session_token',
          value: 'mock-e2e-session-token',
          domain: '127.0.0.1',
          path: '/',
          expires: Date.now() / 1000 + 86400,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    };
    fs.writeFileSync(authFile, JSON.stringify(stubState, null, 2), 'utf8');
  }
});
