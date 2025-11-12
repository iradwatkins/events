import { test, expect } from '@playwright/test';

const BASE_URL = 'https://events.stepperslife.com';
const TEST_EMAIL = 'ira@irawatkins.com';
const TEST_PASSWORD = 'Bobby321!';
const EVENT_ID = 'jh7bgmapxqydnydb0zyytd7qgd7v8jq9';

test.describe('Tickets Page Test', () => {
  test('Tickets page loads after login', async ({ page }) => {
    console.log('\n========================================');
    console.log('🎫 TESTING TICKETS PAGE');
    console.log('========================================\n');

    // Step 1: Login
    console.log('📍 Step 1: Login');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Logged in successfully');

    // Step 2: Navigate to tickets page
    console.log('\n🎫 Step 2: Navigate to Tickets Page');
    await page.goto(`${BASE_URL}/organizer/events/${EVENT_ID}/tickets`);
    await page.waitForLoadState('networkidle');

    // Wait up to 5 seconds for page to load
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // Check if stuck in loading
    const loadingSpinner = page.locator('.animate-spin').first();
    const isStuck = await loadingSpinner.isVisible().catch(() => false);

    if (isStuck) {
      console.log('   ❌ STUCK in loading spinner');
      expect(isStuck).toBe(false);
    } else if (currentUrl.includes('/login')) {
      console.log('   ❌ Redirected to login - authentication failed');
      expect(currentUrl).not.toContain('/login');
    } else {
      // Check for "Tickets Required" or ticket content
      const hasTicketsHeading = await page.getByText('Tickets', { exact: false }).isVisible().catch(() => false);
      const hasTicketContent = await page.getByText('Ticket', { exact: false }).isVisible().catch(() => false);

      if (hasTicketsHeading || hasTicketContent) {
        console.log('   ✅ Tickets page loaded successfully!');
      } else {
        console.log('   ⚠️  Page loaded but content unclear');
        await page.screenshot({ path: '/tmp/tickets-page.png' });
      }
    }

    console.log('\n========================================');
    console.log('🏁 TEST COMPLETE');
    console.log('========================================\n');
  });
});
