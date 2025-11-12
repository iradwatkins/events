import { test, expect } from '@playwright/test';

const BASE_URL = 'https://events.stepperslife.com';
const TEST_EMAIL = 'ira@irawatkins.com';
const TEST_PASSWORD = 'Bobby321!';

test.describe('Debug Login', () => {
  test('Full login flow with cookie inspection', async ({ page, context }) => {
    console.log('\n========================================');
    console.log('🔍 DEBUGGING LOGIN FLOW');
    console.log('========================================\n');

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigate to /login');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('   Current URL:', page.url());
    console.log('   ✅ Login page loaded');

    // Step 2: Check cookies before login
    const cookiesBefore = await context.cookies();
    console.log('\n🍪 Cookies BEFORE login:', cookiesBefore.length);
    cookiesBefore.forEach(c => console.log(`   - ${c.name}: ${c.value.substring(0, 20)}...`));

    // Step 3: Fill login form
    console.log('\n📝 Step 2: Fill login form');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    console.log('   ✅ Form filled');

    // Step 4: Submit and watch for response
    console.log('\n🚀 Step 3: Submit login form');
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );

    await page.click('button[type="submit"]');
    const loginResponse = await responsePromise;

    console.log('   Response status:', loginResponse.status());
    const responseBody = await loginResponse.json();
    console.log('   Response body:', JSON.stringify(responseBody, null, 2));

    // Step 5: Wait for navigation
    await page.waitForLoadState('networkidle');
    console.log('\n🔄 Step 4: After login redirect');
    console.log('   Current URL:', page.url());

    // Step 6: Check cookies after login
    const cookiesAfter = await context.cookies();
    console.log('\n🍪 Cookies AFTER login:', cookiesAfter.length);
    cookiesAfter.forEach(c => {
      console.log(`   - ${c.name}:`);
      console.log(`       value: ${c.value.substring(0, 50)}...`);
      console.log(`       domain: ${c.domain}`);
      console.log(`       path: ${c.path}`);
      console.log(`       secure: ${c.secure}`);
      console.log(`       httpOnly: ${c.httpOnly}`);
      console.log(`       sameSite: ${c.sameSite}`);
    });

    // Step 7: Try to access protected page
    console.log('\n🔐 Step 5: Try to access protected page');
    await page.goto(`${BASE_URL}/organizer/dashboard`);
    await page.waitForLoadState('networkidle');
    console.log('   Current URL:', page.url());

    if (page.url().includes('/login')) {
      console.log('   ❌ REDIRECTED TO LOGIN - Authentication failed!');

      // Check cookies again
      const cookiesProtected = await context.cookies();
      console.log('\n🍪 Cookies when accessing protected page:', cookiesProtected.length);
      cookiesProtected.forEach(c => console.log(`   - ${c.name}: ${c.value.substring(0, 20)}...`));

      expect(false).toBe(true); // Force test to fail with info
    } else {
      console.log('   ✅ SUCCESS - Dashboard loaded!');
      expect(page.url()).toContain('/organizer/dashboard');
    }

    console.log('\n========================================');
    console.log('🏁 DEBUG SESSION COMPLETE');
    console.log('========================================\n');
  });
});
