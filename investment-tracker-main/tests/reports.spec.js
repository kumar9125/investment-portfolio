const { test, expect } = require('@playwright/test');

test.describe('Reports & File Exports Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
    await page.fill('input[placeholder="Password"]', 'Abhi@5361');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('PDF and Excel downloads options verification', async ({ page }) => {
    // Check if Download button is present (only if holdings exist, let's make sure it handles conditional checks)
    const downloadBtn = page.locator('text=Download Report');
    const btnCount = await downloadBtn.count();

    if (btnCount > 0) {
      await downloadBtn.click();
      await expect(page.locator('h3')).toContainText('Generate Reports');
      
      // Verify download trigger for PDF
      const [pdfDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text=Download PDF Report')
      ]);
      expect(pdfDownload.suggestedFilename()).toContain('.pdf');

      // Re-trigger and verify Excel download
      await page.click('text=Download Report');
      const [excelDownload] = await Promise.all([
        page.waitForEvent('download'),
        page.click('text=Excel Document')
      ]);
      expect(excelDownload.suggestedFilename()).toContain('.xlsx');
    }
  });
});
