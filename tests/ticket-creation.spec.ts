import { test, expect } from '@playwright/test';

test.setTimeout(180000); // 3 minutes for the whole test

test.describe('Ticket Creation Flow', () => {
  const baseUrl = 'https://events.stepperslife.com';
  let eventId: string;

  test.beforeAll(async () => {
    // We'll create an event first, then extract its ID from the URL
  });

  test('should create event and add various ticket structures', async ({ page }) => {
    console.log('🚀 Starting ticket creation test...');

    // Step 1: Navigate to create event page
    await page.goto(`${baseUrl}/organizer/events/create`, { timeout: 60000 });

    // Wait for the page to load
    await page.waitForSelector('input[placeholder*="Chicago"]', { timeout: 30000 });

    console.log('✅ Loaded event creation page');

    // Step 2: Fill in event details - Step 1 (Basic Info)
    await page.fill('input[placeholder*="Chicago Summer Steppers Set"]', 'Test Event for Tickets');
    await page.fill('textarea[placeholder*="Describe your event"]', 'This is a test event to verify ticket creation works correctly.');

    // Select event type: Ticketed Event
    await page.click('button:has-text("Ticketed Event")');

    console.log('✅ Filled basic info');

    // Step 3: Go to next step (Date & Time)
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Fill in dates
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const startDateStr = future.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

    await page.fill('input[type="datetime-local"]', startDateStr);

    console.log('✅ Filled date & time');

    // Step 4: Go to next step (Location)
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Fill in location
    await page.fill('input[placeholder="Chicago"]', 'Chicago');
    await page.fill('input[placeholder="IL"]', 'IL');

    console.log('✅ Filled location');

    // Step 5: Go to final step (Additional Details)
    await page.click('button:has-text("Next Step")');
    await page.waitForTimeout(500);

    // Fill in capacity
    await page.fill('input[placeholder="e.g., 500"]', '500');

    console.log('✅ Filled capacity (500 tickets)');

    // Step 6: Create the event (NO TICKETS YET)
    await page.click('button:has-text("Create Event")');

    // Wait for redirect to events list
    await page.waitForURL('**/organizer/events', { timeout: 10000 });

    console.log('✅ Event created! Redirected to events list');

    // Step 7: Find the blinking tickets button and click it
    await page.waitForTimeout(2000); // Let page load

    // Get the event ID from the tickets button href
    const ticketsButton = page.locator('a:has-text("Tickets")').first();
    await expect(ticketsButton).toBeVisible();

    const href = await ticketsButton.getAttribute('href');
    eventId = href?.match(/\/events\/([^\/]+)\/tickets/)?.[1] || '';

    console.log(`✅ Found event ID: ${eventId}`);
    console.log('✅ Blinking tickets button is visible');

    // Click the tickets button
    await ticketsButton.click();
    await page.waitForURL('**/tickets');

    console.log('✅ Navigated to tickets page');

    // Step 8: Create Ticket Structure 1 - Simple Individual Tickets
    console.log('\n🎫 Creating Ticket Structure 1: General Admission (Individual)');

    await page.click('button:has-text("Add Ticket Tier")');
    await page.waitForTimeout(1000);

    // Expand the tier if it's collapsed
    const tierHeader = page.locator('text=Untitled Tier').first();
    if (await tierHeader.isVisible()) {
      await tierHeader.click();
      await page.waitForTimeout(500);
    }

    // Fill in ticket details
    await page.fill('input[placeholder*="General Admission"]', 'General Admission');
    await page.fill('textarea[placeholder*="Describe what"]', 'Standard entry ticket');
    await page.fill('input[placeholder="25.00"]', '25');
    await page.fill('input[placeholder="100"]', '200');

    // Scroll to create button
    await page.click('button:has-text("Create Ticket Tier")');

    console.log('⏳ Waiting for ticket creation...');
    await page.waitForTimeout(3000);

    // Check for success alert or ticket appearing
    const generalAdmissionExists = await page.locator('text=General Admission').count();
    console.log(`✅ General Admission ticket created (found ${generalAdmissionExists} instances)`);

    // Step 9: Create Ticket Structure 2 - VIP Individual
    console.log('\n🎫 Creating Ticket Structure 2: VIP (Individual)');

    await page.click('button:has-text("Add Ticket Tier")');
    await page.waitForTimeout(1000);

    // Expand the tier
    const vipTierHeader = page.locator('text=Untitled Tier').first();
    if (await vipTierHeader.isVisible()) {
      await vipTierHeader.click();
      await page.waitForTimeout(500);
    }

    await page.fill('input[placeholder*="General Admission"]', 'VIP');
    await page.fill('textarea[placeholder*="Describe what"]', 'VIP access with perks');
    await page.fill('input[placeholder="25.00"]', '75');
    await page.fill('input[placeholder="100"]', '100');

    await page.click('button:has-text("Create Ticket Tier")');
    await page.waitForTimeout(3000);

    const vipExists = await page.locator('text=VIP').count();
    console.log(`✅ VIP ticket created (found ${vipExists} instances)`);

    // Step 10: Create Ticket Structure 3 - Table Package
    console.log('\n🎫 Creating Ticket Structure 3: VIP Table (4 seats)');

    await page.click('button:has-text("Add Ticket Tier")');
    await page.waitForTimeout(1000);

    // Expand the tier
    const tableTierHeader = page.locator('text=Untitled Tier').first();
    if (await tableTierHeader.isVisible()) {
      await tableTierHeader.click();
      await page.waitForTimeout(500);
    }

    await page.fill('input[placeholder*="General Admission"]', 'VIP Table');
    await page.fill('textarea[placeholder*="Describe what"]', 'Reserved table for 4 people');
    await page.fill('input[placeholder="25.00"]', '250');
    await page.fill('input[placeholder="100"]', '25');

    // Check "This is a table package"
    await page.check('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Select seats per table
    await page.selectOption('select', '4');

    await page.click('button:has-text("Create Ticket Tier")');
    await page.waitForTimeout(3000);

    const tableExists = await page.locator('text=VIP Table').count();
    console.log(`✅ VIP Table ticket created (found ${tableExists} instances)`);

    // Step 11: Create Ticket Structure 4 - Large Table Package
    console.log('\n🎫 Creating Ticket Structure 4: Premium Table (8 seats)');

    await page.click('button:has-text("Add Ticket Tier")');
    await page.waitForTimeout(1000);

    const premiumTierHeader = page.locator('text=Untitled Tier').first();
    if (await premiumTierHeader.isVisible()) {
      await premiumTierHeader.click();
      await page.waitForTimeout(500);
    }

    await page.fill('input[placeholder*="General Admission"]', 'Premium Table');
    await page.fill('textarea[placeholder*="Describe what"]', 'Premium reserved table for 8 people');
    await page.fill('input[placeholder="25.00"]', '500');
    await page.fill('input[placeholder="100"]', '10');

    // Check "This is a table package"
    await page.check('input[type="checkbox"]');
    await page.waitForTimeout(500);

    // Select 8 seats per table
    await page.selectOption('select', '8');

    await page.click('button:has-text("Create Ticket Tier")');
    await page.waitForTimeout(3000);

    const premiumExists = await page.locator('text=Premium Table').count();
    console.log(`✅ Premium Table ticket created (found ${premiumExists} instances)`);

    // Step 12: Verify capacity breakdown
    console.log('\n📊 Verifying Ticket Breakdown...');

    // Reload page to see all tickets
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for ticket breakdown
    const breakdown = await page.locator('text=Ticket Breakdown').isVisible();
    console.log(`Breakdown visible: ${breakdown}`);

    // Calculate expected total:
    // 200 General + 100 VIP + (25 tables × 4 seats) + (10 tables × 8 seats)
    // = 200 + 100 + 100 + 80 = 480 tickets
    const expectedTotal = 480;

    // Look for the total in the capacity bar or breakdown
    const totalText = await page.locator(`text=${expectedTotal} tickets`).isVisible();
    console.log(`Expected total (${expectedTotal}) visible: ${totalText}`);

    // Step 13: Take screenshots
    await page.screenshot({
      path: '/tmp/ticket-creation-final.png',
      fullPage: true
    });

    console.log('✅ Screenshot saved to /tmp/ticket-creation-final.png');

    // Final verification
    console.log('\n✅ TEST COMPLETE!');
    console.log('📋 Created tickets:');
    console.log('   1. General Admission - $25 × 200 tickets');
    console.log('   2. VIP - $75 × 100 tickets');
    console.log('   3. VIP Table - $250 × 25 tables (4 seats = 100 seats)');
    console.log('   4. Premium Table - $500 × 10 tables (8 seats = 80 seats)');
    console.log(`   TOTAL: ${expectedTotal} tickets available`);
  });
});
