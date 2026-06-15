const { test, expect } = require('@playwright/test');

test.describe('Portfolio Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
    await page.fill('input[placeholder="Password"]', 'Abhi@5361');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Portfolio CRUD Lifecycle', async ({ page }) => {
    await page.goto('/portfolios');
    await expect(page.locator('h1')).toContainText('Your Portfolios');

    // Create
    await page.click('text=Add Portfolio');
    await page.fill('input[required]', 'Playwright Test Portfolio');
    await page.fill('textarea', 'Created by automated e2e testing runner');
    await page.click('button[type="submit"]');

    // Confirm it exists
    await page.waitForTimeout(2000); // Wait for modal reload
    await expect(page.locator('body')).toContainText('Playwright Test Portfolio');

    // Edit
    await page.click('text=Playwright Test Portfolio >> xpath=../.. >> text=Edit');
    await page.fill('input[required]', 'Playwright Edited Portfolio');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText('Playwright Edited Portfolio');

    // Delete
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('delete this portfolio');
      await dialog.accept();
    });
    await page.click('text=Playwright Edited Portfolio >> xpath=../.. >> text=Delete');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Playwright Edited Portfolio');
  });
});
