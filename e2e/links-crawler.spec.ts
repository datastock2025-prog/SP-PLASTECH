import { test, expect } from '@playwright/test';
import { loginAndNavigate } from './test-helpers';

const CORE_ERP_VIEWS = [
  { name: 'Commercial Command Center', view: 'salesDash' },
  { name: 'Sales Order Register', view: 'soList' },
  { name: 'Monthly Plan Orders', view: 'monthlyPlanOrders' },
  { name: 'Dispatch & Delivery Challans', view: 'deliverySchedule' },
  { name: 'Manufacturing Command Center', view: 'mfgDash' },
  { name: 'Warehouse Stock Overview', view: 'stockList' },
  { name: 'Quality Intelligence Center', view: 'qualityDash' },
  { name: 'System Administration', view: 'adminDash' },
];

test.describe('Global Navigation & Route Integrity Crawler', () => {
  for (const item of CORE_ERP_VIEWS) {
    test(`TC-CRAWL: Direct Route Navigation to [${item.name}] (${item.view})`, async ({ page }) => {
      await loginAndNavigate(page, item.view);

      // Verify no Error Boundary ("Display Interruption Recovered") triggered
      const errorRecoveryBanner = page.locator('text=Display Interruption Recovered');
      await expect(errorRecoveryBanner).not.toBeVisible();

      // Verify page content rendered
      await expect(page.locator('header')).toBeVisible();
    });
  }
});
