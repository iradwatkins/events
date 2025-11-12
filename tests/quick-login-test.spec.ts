import { test, expect } from '@playwright/test';

const BASE_URL = 'https://events.stepperslife.com';
const TEST_EMAIL = 'ira@irawatkins.com';
const TEST_PASSWORD = 'Bobby321!';

test.describe('Quick Login Test', () => {
  test('Login page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check we're on login page, not redirected
    expect(page.url()).toBe(`${BASE_URL}/login`);

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    console.log('✅ Login page loads correctly');
  });

  test('Can login and access organizer dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for login to complete (should redirect)
    await page.waitForTimeout(3000);

    // Should be redirected away from login
    expect(page.url()).not.toContain('/login');

    console.log('✅ Login successful, redirected to:', page.url());

    // Now try to access organizer dashboard
    await page.goto(`${BASE_URL}/organizer/dashboard`);

    // Wait for page load
    await page.waitForTimeout(3000);

    // Should NOT redirect to login
    expect(page.url()).toBe(`${BASE_URL}/organizer/dashboard`);

    // Should NOT have loading spinner
    const loadingSpinner = page.locator('.animate-spin').first();
    const isStuck = await loadingSpinner.isVisible().catch(() => false);
    expect(isStuck).toBe(false);

    console.log('✅ Organizer dashboard loads successfully after login');
  });

  test('Protected pages redirect to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/organizer/analytics`);

    // Wait for redirect
    await page.waitForTimeout(2000);

    // Should be on login page
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirect=%2Forganizer%2Fanalytics');

    console.log('✅ Protected pages redirect to login correctly');
  });
});
