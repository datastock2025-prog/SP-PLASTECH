import { Page, expect } from '@playwright/test';

export async function loginAndNavigate(page: Page, targetView: string = 'home') {
  await page.addInitScript((view) => {
    const session = {
      user: {
        id: 'USR-ADMIN-01',
        name: 'SP-PLASTECH Master Admin',
        email: 'admin@spplastech.com',
        role: 'Super Administrator',
        roleType: 'admin',
        department: 'Executive System Administration',
        plantId: 'PLANT-01',
        plantName: 'Plant 01 — Injection & Polymer Division',
        shift: 'Shift A (06:00 - 14:00)',
        badgeId: 'ADM-001',
        pin: '1234',
        avatarColor: 'from-teal-600 to-amber-600',
        initials: 'AD',
        permissions: ['all', 'admin', 'mfg', 'qc', 'wh', 'finance', 'sales', 'hr', 'scm', 'mep', 'analytics'],
      },
      plantId: 'PLANT-01',
      shiftId: 'SHIFT-A',
      lastActiveTimestamp: Date.now(),
    };
    localStorage.setItem('reboot_auth_session', JSON.stringify(session));
    localStorage.setItem('reboot_active_view', view);
  }, targetView);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
}
