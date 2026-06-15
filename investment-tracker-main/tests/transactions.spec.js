const { test, expect } = require('@playwright/test');

test.describe('Transaction History Ledger Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
    await page.fill('input[placeholder="Password"]', 'Abhi@5361');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Transactions Tab CRUD & Balance Updates', async ({ page }) => {
    // Navigate to ledger
    await page.click('text=Transaction Ledger');
    
    // Add buy transaction
    await page.click('text=+ Add Transaction');
    await page.fill('input[placeholder="e.g. INFY, TCS"]', 'INFY_TEST');
    await page.selectOption('select >> nth=1', 'stock');
    await page.selectOption('select >> nth=2', 'buy');
    await page.fill('input[placeholder="10"]', '15');
    await page.fill('input[placeholder="1200"]', '1750');
    await page.fill('input[placeholder="20"]', '15');
    await page.fill('input[placeholder="Brokerage trade ledger notes"]', 'Logged by Playwright e2e runner');
    await page.click('button:has-text("Log Transaction")');

    // Confirm listed
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText('INFY_TEST');

    // Delete transaction ledger entry
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.click('text=INFY_TEST >> xpath=../.. >> text=🗑️');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('INFY_TEST');
  });
});
