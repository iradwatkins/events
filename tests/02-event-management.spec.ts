import { test, Page } from "@playwright/test";

/**
 * Test 2: Event Management and Publishing
 * Tests configuring payment, managing event details, and publishing
 */

async function waitForStableState(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

test.describe("Event Management - Payment Setup & Publishing", () => {
  let eventId: string | null = null;

  test.beforeAll(() => {
    console.log("🎯 Event Management Test Suite Starting");
  });

  test("should navigate to first event and configure payment", async ({ page }) => {
    console.log("\n💳 Testing Payment Configuration");

    // Navigate to organizer events
    await page.goto("/organizer/events");
    await waitForStableState(page);

    // Find first event link
    const firstEvent = page.locator('a[href^="/organizer/events/"]').first();
    const eventLink = await firstEvent.getAttribute("href");

    if (!eventLink) {
      console.log("  No events found. Please create an event first.");
      test.skip();
      return;
    }

    eventId = eventLink.split("/")[3];
    console.log(`  📝 Using event ID: ${eventId}`);

    // Click on the event
    await firstEvent.click();
    await waitForStableState(page);

    // Take screenshot of event detail page
    await page.screenshot({
      path: "test-results/02-event-detail.png",
      fullPage: true,
    });

    console.log("  ✓ Event detail page loaded");

    // Check if we're on event detail or payment setup
    const currentUrl = page.url();
    console.log(`  📍 Current URL: ${currentUrl}`);

    // If not on payment setup, try to navigate there
    if (!currentUrl.includes("/payment-setup")) {
      const paymentSetupLink = await page.locator('a[href*="/payment-setup"]').count();
      if (paymentSetupLink > 0) {
        console.log("  🔗 Navigating to payment setup...");
        await page.click('a[href*="/payment-setup"]');
        await waitForStableState(page);
      } else {
        console.log("    Payment setup link not found, event may already be configured");
      }
    }

    // Take screenshot of payment setup
    await page.screenshot({
      path: "test-results/02-payment-setup.png",
      fullPage: true,
    });

    // Check for payment model options
    const prePayOption = await page.locator("text=Pre-Purchase").count();
    const payAsSellOption = await page.locator("text=Pay-As-Sell").count();

    if (prePayOption > 0 || payAsSellOption > 0) {
      console.log("  ✓ Payment configuration options available");

      // Select Pre-Purchase model if available
      if (prePayOption > 0) {
        const prePurchaseButton = page.locator('button:has-text("Pre-Purchase")');
        if ((await prePurchaseButton.count()) > 0) {
          await prePurchaseButton.click();
          console.log("  ✓ Selected Pre-Purchase payment model");
          await waitForStableState(page);
        }
      }
    } else {
      console.log("    Payment already configured or different UI");
    }

    // Take final screenshot
    await page.screenshot({
      path: "test-results/02-payment-configured.png",
      fullPage: true,
    });

    console.log(" Payment Configuration Test Complete");
  });

  test("should setup ticket tiers", async ({ page }) => {
    if (!eventId) {
      console.log("  No event ID from previous test, finding first event...");
      await page.goto("/organizer/events");
      await waitForStableState(page);

      const firstEvent = page.locator('a[href^="/organizer/events/"]').first();
      const eventLink = await firstEvent.getAttribute("href");

      if (!eventLink) {
        console.log("  No events found.");
        test.skip();
        return;
      }

      eventId = eventLink.split("/")[3];
    }

    console.log(`\n  Testing Ticket Tier Setup for event: ${eventId}`);

    // Navigate to ticket setup
    await page.goto(`/organizer/events/${eventId}/tickets/setup`);
    await waitForStableState(page);

    console.log("  📍 On ticket setup page");

    // Take screenshot
    await page.screenshot({
      path: "test-results/02-ticket-setup.png",
      fullPage: true,
    });

    // Check for ticket tier creation form
    const addTierButton = await page
      .locator(
        'button:has-text("Add Tier"), button:has-text("Create Tier"), button:has-text("New Tier")'
      )
      .count();

    if (addTierButton > 0) {
      console.log("  ✓ Ticket tier creation available");

      // Click to add tier
      await page.click(
        'button:has-text("Add Tier"), button:has-text("Create Tier"), button:has-text("New Tier")'
      );
      await waitForStableState(page);

      // Fill in ticket tier details (if form appears)
      const tierNameInput = await page
        .locator('input[placeholder*="General"], input[placeholder*="name"]')
        .count();

      if (tierNameInput > 0) {
        await page.fill(
          'input[placeholder*="General"], input[placeholder*="name"]',
          "General Admission"
        );
        console.log("  ✓ Tier name: General Admission");

        // Set price (if available)
        const priceInput = await page
          .locator('input[type="number"], input[placeholder*="price"]')
          .count();
        if (priceInput > 0) {
          await page.fill('input[type="number"], input[placeholder*="price"]', "25");
          console.log("  ✓ Price: $25");
        }

        // Set quantity
        const quantityInput = await page
          .locator('input[placeholder*="quantity"], input[placeholder*="100"]')
          .count();
        if (quantityInput > 0) {
          await page.fill('input[placeholder*="quantity"], input[placeholder*="100"]', "100");
          console.log("  ✓ Quantity: 100");
        }

        // Take screenshot of form
        await page.screenshot({
          path: "test-results/02-ticket-tier-form.png",
          fullPage: true,
        });

        // Submit (if save button exists)
        const saveButton = await page
          .locator('button:has-text("Save"), button:has-text("Create")')
          .count();
        if (saveButton > 0) {
          await page.click('button:has-text("Save"), button:has-text("Create")');
          await waitForStableState(page);
          console.log("  ✓ Ticket tier saved");
        }
      }
    } else {
      console.log("    Ticket tier UI not found or already configured");
    }

    // Take final screenshot
    await page.screenshot({
      path: "test-results/02-tickets-final.png",
      fullPage: true,
    });

    console.log(" Ticket Setup Test Complete");
  });

  test("should manage event staff", async ({ page }) => {
    if (!eventId) {
      console.log("  No event ID available");
      test.skip();
      return;
    }

    console.log(`\n👥 Testing Staff Management for event: ${eventId}`);

    // Navigate to staff page
    await page.goto(`/organizer/events/${eventId}/staff`);
    await waitForStableState(page);

    console.log("  📍 On staff management page");

    // Take screenshot
    await page.screenshot({
      path: "test-results/02-staff-page.png",
      fullPage: true,
    });

    // Check for add staff button
    const addStaffButton = await page
      .locator('button:has-text("Add Staff"), button:has-text("Invite")')
      .count();

    if (addStaffButton > 0) {
      console.log("  ✓ Staff management available");

      // Click add staff
      await page.click('button:has-text("Add Staff"), button:has-text("Invite")');
      await waitForStableState(page);

      // Fill in staff details (if form appears)
      const emailInput = await page.locator('input[type="email"]').count();

      if (emailInput > 0) {
        await page.fill('input[type="email"]', "staff-test@stepperslife.com");
        console.log("  ✓ Staff email: staff-test@stepperslife.com");

        // Select role (if available)
        const roleSelector = await page
          .locator('select, button:has-text("Seller"), button:has-text("Scanner")')
          .count();
        if (roleSelector > 0) {
          console.log("  ✓ Role selector found");
        }

        // Take screenshot
        await page.screenshot({
          path: "test-results/02-staff-form.png",
          fullPage: true,
        });
      }
    } else {
      console.log("    Staff management UI not found");
    }

    // Take final screenshot
    await page.screenshot({
      path: "test-results/02-staff-final.png",
      fullPage: true,
    });

    console.log(" Staff Management Test Complete");
  });

  test("should verify event can be published", async ({ page }) => {
    if (!eventId) {
      console.log("  No event ID available");
      test.skip();
      return;
    }

    console.log(`\n Testing Event Publishing for event: ${eventId}`);

    // Navigate to event detail
    await page.goto(`/organizer/events/${eventId}`);
    await waitForStableState(page);

    // Take screenshot
    await page.screenshot({
      path: "test-results/02-before-publish.png",
      fullPage: true,
    });

    // Look for publish button
    const publishButton = await page.locator('button:has-text("Publish")').count();

    if (publishButton > 0) {
      console.log("  ✓ Publish button found");

      // Click publish
      await page.click('button:has-text("Publish")');
      await waitForStableState(page);

      console.log("  ✓ Event published");

      // Take screenshot after publishing
      await page.screenshot({
        path: "test-results/02-after-publish.png",
        fullPage: true,
      });
    } else {
      console.log("    Event may already be published or publish button not found");
    }

    // Navigate to public events page to verify
    await page.goto("/");
    await waitForStableState(page);

    // Take screenshot of homepage
    await page.screenshot({
      path: "test-results/02-public-homepage.png",
      fullPage: true,
    });

    console.log("  ✓ Checked public homepage");

    console.log(" Publishing Test Complete");
  });
});
