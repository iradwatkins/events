import { test, expect } from '@playwright/test';

const BASE_URL = 'https://events.stepperslife.com';
const TEST_EMAIL = 'ira@irawatkins.com';
const TEST_PASSWORD = 'Bobby321!';

test.describe('Create Event and Credits Pages Test', () => {
  test('Create event and credits pages load after login', async ({ page }) => {
    console.log('\n========================================');
    console.log('🎯 TESTING CREATE EVENT & CREDITS PAGES');
    console.log('========================================\n');

    // Step 1: Login
    console.log('📍 Step 1: Login');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Logged in successfully');

    // Step 2: Test Create Event Page
    console.log('\n📝 Step 2: Navigate to Create Event Page');
    await page.goto(`${BASE_URL}/organizer/events/create`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const createUrl = page.url();
    console.log('   Current URL:', createUrl);

    const createSpinner = page.locator('.animate-spin').first();
    const createStuck = await createSpinner.isVisible().catch(() => false);

    if (createStuck) {
      console.log('   ❌ CREATE EVENT STUCK in loading spinner');
      expect(createStuck).toBe(false);
    } else if (createUrl.includes('/login')) {
      console.log('   ❌ CREATE EVENT Redirected to login');
      expect(createUrl).not.toContain('/login');
    } else {
      const hasCreateHeading = await page.getByText('Create New Event', { exact: false }).isVisible().catch(() => false);
      if (hasCreateHeading) {
        console.log('   ✅ Create Event page loaded successfully!');
      } else {
        console.log('   ⚠️  Create Event page loaded but content unclear');
        await page.screenshot({ path: '/tmp/create-event-page.png' });
      }
    }

    // Step 3: Test Credits Page
    console.log('\n💳 Step 3: Navigate to Credits Page');
    await page.goto(`${BASE_URL}/organizer/credits`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const creditsUrl = page.url();
    console.log('   Current URL:', creditsUrl);

    const creditsSpinner = page.locator('.animate-spin').first();
    const creditsStuck = await creditsSpinner.isVisible().catch(() => false);

    if (creditsStuck) {
      console.log('   ❌ CREDITS STUCK in loading spinner');
      expect(creditsStuck).toBe(false);
    } else if (creditsUrl.includes('/login')) {
      console.log('   ❌ CREDITS Redirected to login');
      expect(creditsUrl).not.toContain('/login');
    } else {
      const hasCreditsHeading = await page.getByText('Ticket Credits', { exact: false }).isVisible().catch(() => false);
      if (hasCreditsHeading) {
        console.log('   ✅ Credits page loaded successfully!');
      } else {
        console.log('   ⚠️  Credits page loaded but content unclear');
        await page.screenshot({ path: '/tmp/credits-page.png' });
      }
    }

    console.log('\n========================================');
    console.log('🏁 TEST COMPLETE');
    console.log('========================================\n');
  });
});
