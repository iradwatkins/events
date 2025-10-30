import { test } from "@playwright/test";

test.describe("Event Creation", () => {
  test("should capture error when creating event", async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    const errorMessages: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);

      if (
        text.includes("[CREATE EVENT]") ||
        text.includes("[createEvent]") ||
        text.includes("CONVEX")
      ) {
        console.log(`🔍 ${msg.type().toUpperCase()}: ${text}`);
      }
    });

    page.on("pageerror", (error) => {
      const errorText = error.toString();
      errorMessages.push(errorText);
      console.log(` PAGE ERROR: ${errorText}`);
    });

    // Intercept network requests to Convex
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("convex.cloud")) {
        const status = response.status();
        console.log(`🌐 Convex API: ${status} ${url}`);

        try {
          const body = await response.text();
          if (body.includes("error") || status >= 400) {
            console.log(`📦 Response body: ${body.substring(0, 500)}`);
          }
        } catch {
          // Ignore if we can't read the body
        }
      }
    });

    console.log(" Starting test: navigating to events page...");

    // Navigate to the site
    await page.goto("https://events.stepperslife.com/organizer/events/create");

    console.log("📍 Waiting for page to load...");

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");

    console.log("🔍 Checking authentication status...");

    // Check if we're redirected to login or if we see the create form
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Take a screenshot
    await page.screenshot({ path: "test-results/page-state.png", fullPage: true });
    console.log("📸 Screenshot saved to test-results/page-state.png");

    // Check if Test Auth button exists
    const testAuthButton = page.locator('button:has-text("Test Auth")');
    if (await testAuthButton.isVisible()) {
      console.log("🔧 Test Auth button found, clicking it...");
      await testAuthButton.click();

      // Wait for alert
      page.once("dialog", async (dialog) => {
        console.log(`📢 Alert message: ${dialog.message()}`);
        await dialog.accept();
      });

      await page.waitForTimeout(2000);
    } else {
      console.log(" Test Auth button not found");
    }

    // Print all captured console messages
    console.log("\n📋 All Console Messages:");
    consoleMessages.forEach((msg) => console.log(msg));

    // Print errors
    if (errorMessages.length > 0) {
      console.log("\n Errors Found:");
      errorMessages.forEach((msg) => console.log(msg));
    }
  });
});
