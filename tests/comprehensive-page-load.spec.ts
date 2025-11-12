import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://events.stepperslife.com';
const TEST_EMAIL = 'ira@irawatkins.com';
const TEST_PASSWORD = 'Bobby321!';

// Helper to check if page loaded (not stuck in infinite loading)
async function checkPageLoaded(page: Page, pageName: string, expectedUrl: string) {
  console.log(`\n🔍 Testing: ${pageName}`);

  // Wait up to 10 seconds for page to load
  try {
    // Check for loading spinner
    const loadingSpinner = page.locator('.animate-spin').first();

    // Wait a bit to see if content appears
    await page.waitForTimeout(3000);

    // If loading spinner is still visible after 3 seconds, it's stuck
    const isStuck = await loadingSpinner.isVisible().catch(() => false);

    if (isStuck) {
      console.log(`  ❌ STUCK in loading spinner`);
      return false;
    }

    // Check for common error messages
    const hasError = await page.getByText('error', { exact: false }).isVisible().catch(() => false);
    if (hasError) {
      console.log(`  ⚠️  Has error message`);
    }

    // Check if redirected to login (only if we didn't expect to be on login page)
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const expectedToBeOnLogin = expectedUrl.includes('/login');

    if (isLoginPage && !expectedToBeOnLogin) {
      console.log(`  🔐 Redirected to login (expected for protected pages)`);
      return 'redirect';
    }

    console.log(`  ✅ Page loaded successfully`);
    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

// Run test 3 times as requested
for (let run = 1; run <= 3; run++) {
  test.describe(`Comprehensive Page Load Test - Run ${run}/3`, () => {

    test.describe('Public Pages (No Auth Required)', () => {
      test('Homepage loads', async ({ page }) => {
        await page.goto(BASE_URL);
        const result = await checkPageLoaded(page, 'Homepage', BASE_URL);
        expect(result).toBe(true);
      });

      test('Events list page loads', async ({ page }) => {
        await page.goto(`${BASE_URL}/events`);
        const result = await checkPageLoaded(page, 'Events List', `${BASE_URL}/events`);
        expect(result).toBe(true);
      });

      test('Pricing page loads', async ({ page }) => {
        await page.goto(`${BASE_URL}/pricing`);
        const result = await checkPageLoaded(page, 'Pricing', `${BASE_URL}/pricing`);
        expect(result).toBe(true);
      });

      test('Login page loads', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        const result = await checkPageLoaded(page, 'Login', `${BASE_URL}/login`);
        expect(result).toBe(true);
      });

      test('Shop page loads', async ({ page }) => {
        await page.goto(`${BASE_URL}/shop`);
        const result = await checkPageLoaded(page, 'Shop', `${BASE_URL}/shop`);
        expect(result).toBe(true);
      });
    });

    test.describe('Protected Pages - Should Redirect to Login', () => {
      test('Organizer dashboard redirects to login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/dashboard`);
        const result = await checkPageLoaded(page, 'Organizer Dashboard (no auth)', `${BASE_URL}/organizer/dashboard`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });

      test('Organizer events redirects to login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/events`);
        const result = await checkPageLoaded(page, 'Organizer Events (no auth)', `${BASE_URL}/organizer/events`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });

      test('Organizer analytics redirects to login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/analytics`);
        const result = await checkPageLoaded(page, 'Organizer Analytics (no auth)', `${BASE_URL}/organizer/analytics`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });

      test('Organizer settings redirects to login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/settings`);
        const result = await checkPageLoaded(page, 'Organizer Settings (no auth)', `${BASE_URL}/organizer/settings`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });

      test('Admin page redirects to login', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin`);
        const result = await checkPageLoaded(page, 'Admin Dashboard (no auth)', `${BASE_URL}/admin`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });

      test('My tickets redirects to login', async ({ page }) => {
        await page.goto(`${BASE_URL}/my-tickets`);
        const result = await checkPageLoaded(page, 'My Tickets (no auth)', `${BASE_URL}/my-tickets`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });
    });

    test.describe('Authenticated Pages - Admin User', () => {
      test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for login to complete
        await page.waitForTimeout(2000);
      });

      test('Organizer dashboard loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/dashboard`);
        const result = await checkPageLoaded(page, 'Organizer Dashboard (logged in)', `${BASE_URL}/organizer/dashboard`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Organizer events loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/events`);
        const result = await checkPageLoaded(page, 'Organizer Events (logged in)', `${BASE_URL}/organizer/events`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Organizer create event loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/events/create`);
        const result = await checkPageLoaded(page, 'Create Event (logged in)', `${BASE_URL}/organizer/events/create`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Organizer analytics loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/analytics`);
        const result = await checkPageLoaded(page, 'Organizer Analytics (logged in)', `${BASE_URL}/organizer/analytics`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Organizer settings loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/settings`);
        const result = await checkPageLoaded(page, 'Organizer Settings (logged in)', `${BASE_URL}/organizer/settings`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Admin dashboard loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin`);
        const result = await checkPageLoaded(page, 'Admin Dashboard (logged in)', `${BASE_URL}/admin`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Admin users page loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/users`);
        const result = await checkPageLoaded(page, 'Admin Users (logged in)', `${BASE_URL}/admin/users`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Admin events page loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/events`);
        const result = await checkPageLoaded(page, 'Admin Events (logged in)', `${BASE_URL}/admin/events`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('Admin products page loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/products`);
        const result = await checkPageLoaded(page, 'Admin Products (logged in)', `${BASE_URL}/admin/products`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });

      test('My tickets loads after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/my-tickets`);
        const result = await checkPageLoaded(page, 'My Tickets (logged in)', `${BASE_URL}/my-tickets`);
        expect(result).toBe(true);
        expect(page.url()).not.toContain('/login');
      });
    });

    test.describe('Specific Event Pages', () => {
      const EVENT_ID = 'jh7bgmapxqydnydb0zyytd7qgd7v8jq9';

      test('Event edit page redirects to login when not authenticated', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/events/${EVENT_ID}/edit`);
        const result = await checkPageLoaded(page, 'Event Edit (no auth)', `${BASE_URL}/organizer/events/${EVENT_ID}/edit`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });

      test('Event tickets page redirects to login when not authenticated', async ({ page }) => {
        await page.goto(`${BASE_URL}/organizer/events/${EVENT_ID}/tickets`);
        const result = await checkPageLoaded(page, 'Event Tickets (no auth)', `${BASE_URL}/organizer/events/${EVENT_ID}/tickets`);
        expect(result).toBe('redirect');
        expect(page.url()).toContain('/login');
      });
    });
  });
}

test.describe('Summary', () => {
  test('Print test summary', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPREHENSIVE PAGE LOAD TEST COMPLETED');
    console.log('='.repeat(80));
    console.log('\nAll pages tested 3 times for:');
    console.log('  • Public pages accessibility');
    console.log('  • Protected pages redirect to login');
    console.log('  • Authenticated pages load correctly');
    console.log('  • No infinite loading spinners');
    console.log('\n' + '='.repeat(80) + '\n');
  });
});
