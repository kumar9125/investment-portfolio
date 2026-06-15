const { test, expect } = require('@playwright/test');

test.describe('Responsive Viewports Layout Validation', () => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile_SE' },
    { width: 375, height: 812, name: 'Mobile_12' },
    { width: 768, height: 1024, name: 'Tablet_iPad' },
    { width: 1024, height: 768, name: 'Desktop_Small' },
    { width: 1440, height: 900, name: 'Desktop_Large' }
  ];

  for (const vp of viewports) {
    test(`Viewport layout checks on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      // Login form must fit
      await expect(page.locator('form')).toBeVisible();

      // Perform login to see dashboard response
      await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
      await page.fill('input[placeholder="Password"]', 'Abhi@5361');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Sidebar overlay visibility checks on mobile vs desktop
      if (vp.width < 768) {
        // Mobile topbar visible
        await expect(page.locator('text=💹 Tracker')).toBeVisible();
      } else {
        // Desktop sidebar visible
        await expect(page.locator('aside')).toBeVisible();
      }

      // Check main grid/dashboard metric cards are visible
      await expect(page.locator('text=Portfolio Net Worth')).toBeVisible();
    });
  }
});
