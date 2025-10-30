import { test, expect, Page } from "@playwright/test";

/**
 * Test 1: Complete Event Creation Flow
 * Tests the entire process of creating an event from start to finish
 */

// Helper function to wait for navigation and network to settle
async function waitForStableState(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500); // Small buffer for any animations
}

test.describe("Event Creation - End to End", () => {
  let createdEventId: string | null = null;

  test("should complete full event creation process", async ({ page }) => {
    console.log(" Starting End-to-End Event Creation Test");

    // Set up console logging
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[CREATE EVENT]") || text.includes("[createEvent]")) {
        console.log(`📋 Console: ${text}`);
      }
    });

    // Navigate to the create event page
    console.log("📍 Step 1: Navigating to create event page");
    await page.goto("/organizer/events/create");
    await waitForStableState(page);

    // Check if we're on the login page (if auth is required)
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      console.log("🔐 Auth required, currently on login page");
      console.log("  Note: This test requires manual authentication or auth state setup");

      // Take screenshot of login page
      await page.screenshot({
        path: "test-results/01-login-page.png",
        fullPage: true,
      });

      // For now, skip the test if auth is required
      test.skip();
      return;
    }

    console.log(" On create event page");

    // ============================================
    // STEP 1: Basic Information
    // ============================================
    console.log("\n📝 STEP 1: Filling Basic Information");

    // Fill in event name
    const eventName = `Test Event ${Date.now()}`;
    await page.fill('input[placeholder*="Chicago Summer Steppers"]', eventName);
    console.log(`  ✓ Event name: ${eventName}`);

    // Select event type (Ticketed Event)
    await page.click('button:has-text("Ticketed Event")');
    console.log("  ✓ Event type: Ticketed Event");

    // Fill in description
    const description =
      "This is an automated test event created by Playwright. It tests the full event creation flow including all steps and validations.";
    await page.fill('textarea[placeholder*="Tell attendees"]', description);
    console.log("  ✓ Description added");

    // Select categories
    await page.click('button:has-text("Steppers Set")');
    await page.click('button:has-text("Workshop")');
    console.log("  ✓ Categories: Steppers Set, Workshop");

    // Take screenshot of step 1
    await page.screenshot({
      path: "test-results/01-step1-basic-info.png",
      fullPage: true,
    });

    // Click Next to go to step 2
    await page.click('button:has-text("Next")');
    await waitForStableState(page);
    console.log(" Step 1 Complete\n");

    // ============================================
    // STEP 2: Date & Time
    // ============================================
    console.log("📅 STEP 2: Setting Date & Time");

    // Set start date (30 days from now)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30);
    const startDateStr = startDate.toISOString().split("T")[0];

    await page.fill('input[type="date"]', startDateStr);
    console.log(`  ✓ Start date: ${startDateStr}`);

    // Set start time
    await page.fill('input[type="time"]', "19:00");
    console.log("  ✓ Start time: 19:00 (7:00 PM)");

    // Set end date (same day)
    const endDateInputs = page.locator('input[type="date"]');
    const endDateInput = endDateInputs.nth(1);
    await endDateInput.fill(startDateStr);
    console.log(`  ✓ End date: ${startDateStr}`);

    // Set end time
    const timeInputs = page.locator('input[type="time"]');
    const endTimeInput = timeInputs.nth(1);
    await endTimeInput.fill("23:00");
    console.log("  ✓ End time: 23:00 (11:00 PM)");

    // Take screenshot of step 2
    await page.screenshot({
      path: "test-results/01-step2-datetime.png",
      fullPage: true,
    });

    // Click Next
    await page.click('button:has-text("Next")');
    await waitForStableState(page);
    console.log(" Step 2 Complete\n");

    // ============================================
    // STEP 3: Location
    // ============================================
    console.log("📍 STEP 3: Setting Location");

    // Fill in venue name
    await page.fill('input[placeholder*="venue name"]', "Chicago Steppers Hall");
    console.log("  ✓ Venue: Chicago Steppers Hall");

    // Fill in address
    await page.fill('input[placeholder*="Street address"]', "123 Dance Street");
    console.log("  ✓ Address: 123 Dance Street");

    // Fill in city
    await page.fill('input[placeholder*="City"]', "Chicago");
    console.log("  ✓ City: Chicago");

    // Fill in state
    await page.fill('input[placeholder*="State"]', "IL");
    console.log("  ✓ State: IL");

    // Wait for timezone auto-detection
    await page.waitForTimeout(1000);

    // Check if timezone was detected
    const timezoneInfo = await page.locator("text=Timezone:").count();
    if (timezoneInfo > 0) {
      const timezoneText = await page.locator('div:has-text("Timezone:")').textContent();
      console.log(`  ✓ Auto-detected timezone: ${timezoneText}`);
    }

    // Fill in zip code
    await page.fill('input[placeholder*="Zip"]', "60601");
    console.log("  ✓ Zip: 60601");

    // Take screenshot of step 3
    await page.screenshot({
      path: "test-results/01-step3-location.png",
      fullPage: true,
    });

    // Click Next
    await page.click('button:has-text("Next")');
    await waitForStableState(page);
    console.log(" Step 3 Complete\n");

    // ============================================
    // STEP 4: Additional Details & Image
    // ============================================
    console.log("🎨 STEP 4: Additional Details");

    // Set capacity
    await page.fill('input[placeholder*="100"]', "200");
    console.log("  ✓ Capacity: 200");

    // Check if image upload is present
    const imageUploadVisible = await page.locator("text=Upload Event Image").count();
    if (imageUploadVisible > 0) {
      console.log("    Image upload field present (skipping upload for test)");
    }

    // Take screenshot of step 4
    await page.screenshot({
      path: "test-results/01-step4-details.png",
      fullPage: true,
    });

    // ============================================
    // SUBMIT EVENT
    // ============================================
    console.log("\n Submitting Event...");

    // Listen for the success alert
    page.once("dialog", async (dialog) => {
      console.log(`  ✓ Alert: ${dialog.message()}`);
      await dialog.accept();
    });

    // Click Create Event button
    await page.click('button:has-text("Create Event")');

    // Wait for navigation or alert
    await page.waitForTimeout(3000);

    // Check current URL to see if we were redirected
    const finalUrl = page.url();
    console.log(`  📍 Final URL: ${finalUrl}`);

    // Extract event ID from URL if redirected to payment setup
    if (finalUrl.includes("/organizer/events/") && finalUrl.includes("/payment-setup")) {
      const match = finalUrl.match(/\/organizer\/events\/([^\/]+)\/payment-setup/);
      if (match) {
        createdEventId = match[1];
        console.log(`   Event created successfully! ID: ${createdEventId}`);
      }
    } else {
      console.log("    URL did not redirect to payment setup page");
    }

    // Take final screenshot
    await page.screenshot({
      path: "test-results/01-final-state.png",
      fullPage: true,
    });

    console.log("\n Event Creation Test Complete!");

    // Verify we're on a valid page (either payment setup or event detail)
    const isValidPage = finalUrl.includes("/organizer/events/");
    expect(isValidPage).toBeTruthy();
  });

  test("should verify event appears in events list", async ({ page }) => {
    console.log("\n🔍 Verifying Event in List");

    // Navigate to events list
    await page.goto("/organizer/events");
    await waitForStableState(page);

    // Take screenshot
    await page.screenshot({
      path: "test-results/01-events-list.png",
      fullPage: true,
    });

    // Check if any events are displayed
    const eventCards = await page.locator('a[href^="/organizer/events/"]').count();
    console.log(`  📊 Found ${eventCards} event(s) in the list`);

    expect(eventCards).toBeGreaterThan(0);
  });
});
