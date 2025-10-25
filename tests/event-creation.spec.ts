import { test } from "@playwright/test";

test.describe("Event Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto("http://localhost:3004");

    // Login with test credentials
    await page.click("text=Sign In");
    await page.waitForURL("**/login");

    // Fill in test credentials
    await page.fill('input[type="email"]', "bobbygwatkins@gmail.com");
    await page.fill('input[type="password"]', "pass");
    await page.click('button[type="submit"]');

    // Wait for redirect back to home
    await page.waitForURL("http://localhost:3004", { timeout: 10000 });
  });

  test("Test 1: Create Ticketed Event", async ({ page }) => {
    console.log("\n=== TEST 1: Creating Ticketed Event ===");

    // Click Create button
    await page.click("text=Create");

    // Wait for create page
    await page.waitForURL("**/organizer/events/create");

    // Step 1: Basic Information
    console.log("Step 1: Filling basic information...");
    await page.fill('input[placeholder*="Chicago Summer"]', "Test Ticketed Event 1");
    await page.click('button:has-text("Ticketed Event")');
    await page.fill(
      'textarea[placeholder*="Describe your event"]',
      "This is a test ticketed event for testing purposes."
    );
    await page.click('button:has-text("Steppers Set")');

    // Click Next
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 2: Date & Time
    console.log("Step 2: Filling date and time...");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateString = futureDate.toISOString().slice(0, 16); // Format: 2025-01-24T19:00

    const startDateInput = page.locator('input[type="datetime-local"]').first();
    await startDateInput.fill(dateString);

    console.log(`  - Start date filled: ${dateString}`);

    // Click Next
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 3: Location
    console.log("Step 3: Filling location...");
    await page.fill('input[placeholder*="Grand Ballroom"]', "Test Venue");
    await page.fill('input[placeholder*="123 Main"]', "123 Test Street");
    await page.fill('input[placeholder="Chicago"]', "Chicago");
    await page.fill('input[placeholder="IL"]', "IL");
    await page.fill('input[placeholder="60601"]', "60601");

    // Click Next
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 4: Additional Details
    console.log("Step 4: Filling additional details...");
    await page.fill('input[placeholder="500"]', "300");

    // Click Create Event
    console.log("Submitting event...");
    await page.click('button:has-text("Create Event")');

    // Wait for response - either success or error
    await page.waitForTimeout(3000);

    // Check if there's an alert or error
    page.on("dialog", async (dialog) => {
      console.log(`  - Alert: ${dialog.message()}`);
      await dialog.accept();
    });

    // Take screenshot
    await page.screenshot({
      path: "/root/websites/events-stepperslife/test-results/test1-ticketed.png",
      fullPage: true,
    });

    console.log("Test 1 completed - screenshot saved\n");
  });

  test("Test 2: Create Free Event", async ({ page }) => {
    console.log("\n=== TEST 2: Creating Free Event ===");

    await page.click("text=Create");
    await page.waitForURL("**/organizer/events/create");

    // Step 1
    console.log("Step 1: Basic information...");
    await page.fill('input[placeholder*="Chicago Summer"]', "Test Free Event 2");
    await page.click('button:has-text("Free Event")');
    await page.fill('textarea[placeholder*="Describe your event"]', "This is a test free event.");
    await page.click('button:has-text("Social")');
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 2
    console.log("Step 2: Date and time...");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const dateString = futureDate.toISOString().slice(0, 16);
    await page.locator('input[type="datetime-local"]').first().fill(dateString);
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 3
    console.log("Step 3: Location...");
    await page.fill('input[placeholder="Chicago"]', "Atlanta");
    await page.fill('input[placeholder="IL"]', "GA");
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 4
    console.log("Step 4: Submit...");
    await page.click('button:has-text("Create Event")');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: "/root/websites/events-stepperslife/test-results/test2-free.png",
      fullPage: true,
    });
    console.log("Test 2 completed - screenshot saved\n");
  });

  test("Test 3: Create Save the Date Event", async ({ page }) => {
    console.log("\n=== TEST 3: Creating Save the Date Event ===");

    await page.click("text=Create");
    await page.waitForURL("**/organizer/events/create");

    // Step 1
    console.log("Step 1: Basic information...");
    await page.fill('input[placeholder*="Chicago Summer"]', "Test Save The Date Event 3");
    await page.click('button:has-text("Save the Date")');
    await page.fill('textarea[placeholder*="Describe your event"]', "Coming soon event.");
    await page.click('button:has-text("Festival")');
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 2
    console.log("Step 2: Date and time...");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const dateString = futureDate.toISOString().slice(0, 16);
    await page.locator('input[type="datetime-local"]').first().fill(dateString);
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 3
    console.log("Step 3: Location...");
    await page.fill('input[placeholder="Chicago"]', "Detroit");
    await page.fill('input[placeholder="IL"]', "MI");
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 4
    console.log("Step 4: Submit...");
    await page.click('button:has-text("Create Event")');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: "/root/websites/events-stepperslife/test-results/test3-savethedate.png",
      fullPage: true,
    });
    console.log("Test 3 completed - screenshot saved\n");
  });

  test("Test 4: Missing Required Field Test", async ({ page }) => {
    console.log("\n=== TEST 4: Testing Missing Required Fields ===");

    await page.click("text=Create");
    await page.waitForURL("**/organizer/events/create");

    // Step 1
    console.log("Step 1: Filling only name...");
    await page.fill('input[placeholder*="Chicago Summer"]', "Test Missing Fields Event");
    await page.fill('textarea[placeholder*="Describe your event"]', "Testing validation.");
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 2 - SKIP filling date
    console.log("Step 2: SKIPPING date (intentional)...");
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 3
    console.log("Step 3: Filling location...");
    await page.fill('input[placeholder="Chicago"]', "New York");
    await page.fill('input[placeholder="IL"]', "NY");
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Step 4 - Try to submit
    console.log("Step 4: Attempting to submit WITHOUT start date...");

    // Listen for alerts
    let alertMessage = "";
    page.on("dialog", async (dialog) => {
      alertMessage = dialog.message();
      console.log(`  - ALERT RECEIVED: "${alertMessage}"`);
      await dialog.accept();
    });

    await page.click('button:has-text("Create Event")');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: "/root/websites/events-stepperslife/test-results/test4-validation.png",
      fullPage: true,
    });
    console.log(`Test 4 completed - Alert message: "${alertMessage}"\n`);
  });
});
