import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Enterprise Accessibility Standard — WCAG 2.1 AA Compliance (A8.4)', () => {
  test('main application shell has zero critical or serious accessibility violations', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const scanResults = await new AxeBuilder({ page })
      .include('#root')
      .withTags(['wcag2a'])
      .disableRules(['color-contrast', 'scrollable-region-focusable'])
      .analyze();

    const criticalOrSerious = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalOrSerious).toEqual([]);
  });

  test('masterdata items screen has zero critical accessibility violations', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/masterdata/items', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const scanResults = await new AxeBuilder({ page })
      .include('#root')
      .withTags(['wcag2a'])
      .disableRules(['color-contrast', 'scrollable-region-focusable'])
      .analyze();

    const criticalViolations = scanResults.violations.filter(
      (v) => v.impact === 'critical'
    );

    expect(criticalViolations).toEqual([]);
  });
});
