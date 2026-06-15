const { test, expect } = require('@playwright/test');

test.describe('Asset Holdings Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
    await page.fill('input[placeholder="Password"]', 'Abhi@5361');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Holding creation, validations, and deletion', async ({ page }) => {
    // Check if portfolio selector is present
    await expect(page.locator('select')).toBeVisible();

    // Add asset
    await page.click('text=+ Add Asset');
    
    // Type Stock
    await page.selectOption('select[name="type"]', 'stock');
    await page.fill('input[name="name"]', 'TATA_E2E_TEST');
    await page.fill('input[name="quantity"]', '10.5');
    await page.fill('input[name="purchasePrice"]', '1250');
    await page.click('button[type="submit"]');

    // Confirm addition
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText('TATA_E2E_TEST');

    // Attempt negative value check (handled by frontend validators)
    await page.click('text=+ Add Asset');
    await page.fill('input[name="name"]', 'BAD_VAL_TEST');
    await page.fill('input[name="quantity"]', '-5');
    await page.fill('input[name="purchasePrice"]', '100');
    await page.click('button[type="submit"]');
    
    // Validate negative alert message
    await expect(page.locator('body')).toContainText('Quantity must be greater than 0');
    await page.click('text=Cancel');

    // Delete holding
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.click('text=TATA_E2E_TEST >> xpath=../.. >> text=❌');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('TATA_E2E_TEST');
  });
});
