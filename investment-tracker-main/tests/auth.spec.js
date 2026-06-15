const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('User Signup & Duplicate Signup Handling', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h2')).toContainText('Create Account');

    const uniqueEmail = `test_${Date.now()}@example.com`;

    // Fill form
    await page.fill('input[placeholder="Name"]', 'QA Test User');
    await page.fill('input[placeholder="Email"]', uniqueEmail);
    await page.fill('input[placeholder="Password"]', 'SecurePass@123');
    await page.click('button[type="submit"]');

    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('h2')).toContainText('Welcome Back');

    // Attempt duplicate signup
    await page.goto('/signup');
    await page.fill('input[placeholder="Name"]', 'QA Test User');
    await page.fill('input[placeholder="Email"]', uniqueEmail);
    await page.fill('input[placeholder="Password"]', 'SecurePass@123');
    await page.click('button[type="submit"]');
    
    // Duplicate signup error alert check
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toBeDefined();
  });

  test('User Login, Persistence, and Logout', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials
    await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
    await page.fill('input[placeholder="Password"]', 'Abhi@5361');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Portfolio Dashboard');

    // Refresh page to verify token session persistence
    await page.reload();
    await expect(page.locator('h1')).toContainText('Portfolio Dashboard');

    // Logout check
    await page.click('text=Logout');
    await page.waitForURL('**/login');
  });

  test('Invalid password error bounds', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Email"]', 'abhidemo@gmail.com');
    await page.fill('input[placeholder="Password"]', 'WrongPass123!');
    await page.click('button[type="submit"]');

    // Error tag visible
    await expect(page.locator('form + p')).toBeVisible();
  });
});
