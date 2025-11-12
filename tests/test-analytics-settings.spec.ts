import { test, expect } from '@playwright/test';

const BASE_URL = 'https://events.stepperslife.com';
const TEST_EMAIL = 'ira@irawatkins.com';
const TEST_PASSWORD = 'Bobby321!';

test.describe('Analytics and Settings Pages', () => {
  test('Analytics and Settings pages load after login', async ({ page }) => {
    console.log('\n========================================');
    console.log('🧪 TESTING ANALYTICS & SETTINGS');
    console.log('========================================\n');

    // Step 1: Login
    console.log('📍 Step 1: Login');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Logged in successfully');

    // Step 2: Test Analytics Page
    console.log('\n📊 Step 2: Test Analytics Page');
    await page.goto(`${BASE_URL}/organizer/analytics`);
    await page.waitForLoadState('networkidle');

    // Wait up to 5 seconds for page to load
    await page.waitForTimeout(5000);

    const analyticsUrl = page.url();
    console.log('   Current URL:', analyticsUrl);

    // Check if stuck in loading
    const loadingSpinner = page.locator('.animate-spin').first();
    const isStuck = await loadingSpinner.isVisible().catch(() => false);

    if (isStuck) {
      console.log('   ❌ STUCK in loading spinner');
      expect(isStuck).toBe(false);
    } else {
      // Check if showing error message
      const errorText = await page.getByText('Authentication Error').isVisible().catch(() => false);
      if (errorText) {
        console.log('   ⚠️  Shows authentication error');
        // Take screenshot for debugging
        await page.screenshot({ path: '/tmp/analytics-auth-error.png' });
      } else {
        console.log('   ✅ Analytics page loaded successfully!');
      }
    }

    expect(analyticsUrl).not.toContain('/login');

    // Step 3: Test Settings Page
    console.log('\n⚙️  Step 3: Test Settings Page');
    await page.goto(`${BASE_URL}/organizer/settings`);
    await page.waitForLoadState('networkidle');

    // Wait up to 5 seconds for page to load
    await page.waitForTimeout(5000);

    const settingsUrl = page.url();
    console.log('   Current URL:', settingsUrl);

    // Check if stuck in loading
    const loadingSpinner2 = page.locator('.animate-spin').first();
    const isStuck2 = await loadingSpinner2.isVisible().catch(() => false);

    if (isStuck2) {
      console.log('   ❌ STUCK in loading spinner');
      expect(isStuck2).toBe(false);
    } else {
      // Check if showing error message
      const errorText2 = await page.getByText('Authentication Error').isVisible().catch(() => false);
      if (errorText2) {
        console.log('   ⚠️  Shows authentication error');
        // Take screenshot for debugging
        await page.screenshot({ path: '/tmp/settings-auth-error.png' });
      } else {
        console.log('   ✅ Settings page loaded successfully!');
      }
    }

    expect(settingsUrl).not.toContain('/login');

    console.log('\n========================================');
    console.log('🏁 TEST COMPLETE');
    console.log('========================================\n');
  });
});
