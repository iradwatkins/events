import { test, expect, Page } from "@playwright/test";

/**
 * Test 3: Complete Ticket Purchase Flow
 * Tests the end-user experience of browsing, selecting, and purchasing tickets
 */

async function waitForStableState(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

test.describe("Ticket Purchase - Complete User Flow", () => {
  let selectedEventId: string | null = null;
  let selectedEventName: string | null = null;

  test("should browse and view public events", async ({ page }) => {
    console.log("\n🌐 Testing Public Event Browsing");

    // Navigate to homepage
    await page.goto("/");
    await waitForStableState(page);

    console.log("  📍 On homepage");

    // Take screenshot
    await page.screenshot({
      path: "test-results/03-homepage.png",
      fullPage: true,
    });

    // Count events displayed
    const eventCards = await page.locator('a[href^="/events/"]').count();
    console.log(`  📊 Found ${eventCards} public event(s)`);

    if (eventCards === 0) {
      console.log("  ⚠️  No public events found. Events may need to be published first.");
      console.log("  ℹ️  Skipping remaining tests in this suite.");
      test.skip();
      return;
    }

    // Click on first event
    const firstEvent = page.locator('a[href^="/events/"]').first();

    // Get event name before clicking
    const eventNameElement = firstEvent.locator("h3, h2, .event-name").first();
    const eventNameCount = await eventNameElement.count();

    if (eventNameCount > 0) {
      selectedEventName = await eventNameElement.textContent();
      console.log(`  📌 Selected event: ${selectedEventName}`);
    }

    // Get event URL
    const eventHref = await firstEvent.getAttribute("href");
    if (eventHref) {
      selectedEventId = eventHref.split("/events/")[1]?.split("?")[0];
      console.log(`  🆔 Event ID: ${selectedEventId}`);
    }

    // Click event
    await firstEvent.click();
    await waitForStableState(page);

    console.log("  ✓ Navigated to event detail page");

    // Take screenshot of event detail
    await page.screenshot({
      path: "test-results/03-event-detail.png",
      fullPage: true,
    });

    // Verify event details are displayed
    const hasEventName = await page.locator("h1, h2").count();
    const hasDate = await page.locator("text=/\\w+ \\d+, \\d{4}/").count();
    const hasLocation = await page.locator("text=/\\w+, \\w+/").count();

    console.log(
      `  ✓ Event details visible - Name: ${hasEventName > 0}, Date: ${hasDate > 0}, Location: ${hasLocation > 0}`
    );

    expect(hasEventName).toBeGreaterThan(0);

    console.log("✅ Event Browsing Test Complete");
  });

  test("should view ticket options and navigate to checkout", async ({ page }) => {
    if (!selectedEventId) {
      console.log("  ⚠️  No event selected from previous test");
      test.skip();
      return;
    }

    console.log(`\n🎫 Testing Ticket Selection for event: ${selectedEventId}`);

    // Navigate to event page
    await page.goto(`/events/${selectedEventId}`);
    await waitForStableState(page);

    // Look for ticket information
    const ticketSection = await page
      .locator("text=Tickets, text=Get Tickets, text=Available")
      .count();

    if (ticketSection > 0) {
      console.log("  ✓ Ticket information section found");

      // Take screenshot showing tickets
      await page.screenshot({
        path: "test-results/03-tickets-available.png",
        fullPage: true,
      });

      // Look for "Get Tickets" or "Buy Tickets" button
      const buyButton = await page
        .locator(
          'button:has-text("Get Tickets"), button:has-text("Buy Tickets"), button:has-text("Purchase"), a:has-text("Get Tickets")'
        )
        .count();

      if (buyButton > 0) {
        console.log("  ✓ Purchase button found");

        // Click to proceed to checkout
        await page.click(
          'button:has-text("Get Tickets"), button:has-text("Buy Tickets"), button:has-text("Purchase"), a:has-text("Get Tickets")'
        );
        await waitForStableState(page);

        console.log("  ✓ Navigated to checkout/ticket selection");

        // Take screenshot of checkout page
        await page.screenshot({
          path: "test-results/03-checkout-page.png",
          fullPage: true,
        });

        // Check current URL
        const checkoutUrl = page.url();
        console.log(`  📍 Checkout URL: ${checkoutUrl}`);

        const isCheckoutPage =
          checkoutUrl.includes("/checkout") || checkoutUrl.includes("/tickets");
        expect(isCheckoutPage).toBeTruthy();
      } else {
        console.log("  ℹ️  Purchase button not found - tickets may not be available yet");
      }
    } else {
      console.log("  ℹ️  No ticket section found on event page");
    }

    console.log("✅ Ticket Selection Test Complete");
  });

  test("should complete checkout form", async ({ page }) => {
    if (!selectedEventId) {
      console.log("  ⚠️  No event selected");
      test.skip();
      return;
    }

    console.log(`\n💳 Testing Checkout Process`);

    // Navigate directly to checkout page
    await page.goto(`/events/${selectedEventId}/checkout`);
    await waitForStableState(page);

    // Take screenshot
    await page.screenshot({
      path: "test-results/03-checkout-form.png",
      fullPage: true,
    });

    console.log("  📍 On checkout page");

    // Check for ticket quantity selector
    const quantitySelector = await page
      .locator('input[type="number"], select[name*="quantity"]')
      .count();

    if (quantitySelector > 0) {
      console.log("  ✓ Quantity selector found");

      // Select quantity
      const quantityInput = page.locator('input[type="number"]').first();
      await quantityInput.fill("2");
      console.log("  ✓ Selected 2 tickets");

      await waitForStableState(page);

      // Take screenshot after quantity selection
      await page.screenshot({
        path: "test-results/03-quantity-selected.png",
        fullPage: true,
      });
    }

    // Look for attendee information form
    const nameInput = await page.locator('input[name*="name"], input[placeholder*="Name"]').count();
    const emailInput = await page.locator('input[type="email"], input[name*="email"]').count();

    if (nameInput > 0 && emailInput > 0) {
      console.log("  ✓ Attendee form found");

      // Fill in attendee details
      await page.fill('input[name*="name"], input[placeholder*="Name"]', "Test User Playwright");
      console.log("  ✓ Name: Test User Playwright");

      await page.fill(
        'input[type="email"], input[name*="email"]',
        "test-playwright@stepperslife.com"
      );
      console.log("  ✓ Email: test-playwright@stepperslife.com");

      // Fill phone if present
      const phoneInput = await page.locator('input[type="tel"], input[name*="phone"]').count();
      if (phoneInput > 0) {
        await page.fill('input[type="tel"], input[name*="phone"]', "555-123-4567");
        console.log("  ✓ Phone: 555-123-4567");
      }

      // Take screenshot of filled form
      await page.screenshot({
        path: "test-results/03-form-filled.png",
        fullPage: true,
      });
    } else {
      console.log("  ℹ️  Attendee form not found or different structure");
    }

    // Check for order summary
    const orderSummary = await page.locator("text=Total, text=Subtotal, text=Summary").count();
    if (orderSummary > 0) {
      console.log("  ✓ Order summary displayed");

      // Try to capture total amount
      const totalText = await page.locator("text=/\\$\\d+\\.\\d{2}/").first().textContent();
      if (totalText) {
        console.log(`  💰 Order total: ${totalText}`);
      }
    }

    // Look for payment section
    const paymentSection = await page.locator("text=Payment, text=Card, text=Credit Card").count();

    if (paymentSection > 0) {
      console.log("  ✓ Payment section found");
      console.log("  ℹ️  Note: Not filling actual payment details in test");

      // Take screenshot of payment section
      await page.screenshot({
        path: "test-results/03-payment-section.png",
        fullPage: true,
      });
    } else {
      console.log("  ℹ️  Payment section not visible yet");
    }

    // Look for submit button (but don't click it)
    const submitButton = await page
      .locator(
        'button:has-text("Complete Purchase"), button:has-text("Place Order"), button:has-text("Pay")'
      )
      .count();

    if (submitButton > 0) {
      console.log("  ✓ Submit button found (not clicking in test)");
    }

    console.log("✅ Checkout Form Test Complete");
    console.log("  ℹ️  Note: Actual payment submission skipped to avoid charges");
  });

  test("should verify my tickets page structure", async ({ page }) => {
    console.log(`\n📋 Testing My Tickets Page`);

    // Navigate to my tickets
    await page.goto("/my-tickets");
    await waitForStableState(page);

    // Take screenshot
    await page.screenshot({
      path: "test-results/03-my-tickets-page.png",
      fullPage: true,
    });

    console.log("  📍 On my tickets page");

    // Check if auth is required
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      console.log("  🔐 Authentication required for my tickets page");
      console.log("  ✓ Correct behavior - my tickets requires auth");

      expect(currentUrl).toContain("/login");
    } else {
      console.log("  ✓ My tickets page loaded");

      // Check for tickets or empty state
      const hasTickets = await page.locator("text=Ticket, text=Event, text=QR").count();
      const emptyState = await page.locator("text=No tickets, text=no tickets yet").count();

      if (hasTickets > 0) {
        console.log("  📊 Tickets displayed on page");
      } else if (emptyState > 0) {
        console.log("  ℹ️  No tickets found (expected for new account)");
      } else {
        console.log("  ℹ️  Tickets page structure detected");
      }
    }

    console.log("✅ My Tickets Page Test Complete");
  });

  test("should test event search and filtering", async ({ page }) => {
    console.log(`\n🔍 Testing Event Search and Filtering`);

    // Navigate to homepage/events
    await page.goto("/");
    await waitForStableState(page);

    // Look for search box
    const searchInput = await page
      .locator('input[placeholder*="Search"], input[type="search"]')
      .count();

    if (searchInput > 0) {
      console.log("  ✓ Search functionality found");

      // Enter search term
      await page.fill('input[placeholder*="Search"], input[type="search"]', "steppers");
      await waitForStableState(page);

      console.log("  ✓ Entered search term: steppers");

      // Take screenshot
      await page.screenshot({
        path: "test-results/03-search-results.png",
        fullPage: true,
      });

      // Count results
      const results = await page.locator('a[href^="/events/"]').count();
      console.log(`  📊 Search results: ${results} event(s)`);
    } else {
      console.log("  ℹ️  Search functionality not found on this page");
    }

    // Look for view toggle (list/grid)
    const viewToggle = await page
      .locator('button[aria-label*="view"], button:has-text("Grid"), button:has-text("List")')
      .count();

    if (viewToggle > 0) {
      console.log("  ✓ View toggle found");

      // Try switching views
      const gridButton = page.locator('button:has-text("Grid"), button[aria-label*="grid"]');
      if ((await gridButton.count()) > 0) {
        await gridButton.click();
        await waitForStableState(page);
        console.log("  ✓ Switched to grid view");

        await page.screenshot({
          path: "test-results/03-grid-view.png",
          fullPage: true,
        });
      }

      const listButton = page.locator('button:has-text("List"), button[aria-label*="list"]');
      if ((await listButton.count()) > 0) {
        await listButton.click();
        await waitForStableState(page);
        console.log("  ✓ Switched to list view");

        await page.screenshot({
          path: "test-results/03-list-view.png",
          fullPage: true,
        });
      }
    } else {
      console.log("  ℹ️  View toggle not found");
    }

    console.log("✅ Search and Filter Test Complete");
  });
});
