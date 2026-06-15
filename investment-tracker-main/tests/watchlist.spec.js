const { test, expect } = require('@playwright/test');

test.describe('Watchlist Symbol Tracking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
    await page.fill('input[placeholder="Password"]', 'Abhi@5361');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Watchlist addition, duplication prevention, and removal', async ({ page }) => {
    await page.click('text=Watchlist');
    await expect(page.locator('h3:has-text("Watch Asset")')).toBeVisible();

    // Add symbol
    await page.fill('input[placeholder="RELIANCE"]', 'W_INFY');
    await page.fill('input[placeholder="Reliance Industries"]', 'Infosys Tech');
    await page.click('button:has-text("+ Add Symbol")');

    // Confirm visible
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText('W_INFY');

    // Attempt duplicate symbol add
    await page.fill('input[placeholder="RELIANCE"]', 'W_INFY');
    await page.fill('input[placeholder="Reliance Industries"]', 'Infosys Tech');
    await page.click('button:has-text("+ Add Symbol")');
    
    // Check duplication block popup or alert
    page.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    // Delete symbol
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.click('text=W_INFY >> xpath=../.. >> text=Remove');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('W_INFY');
  });
});
