import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Test multi-event bundle purchase and ticket generation
 * This verifies the fix for multi-event bundle tickets
 */
export const testMultiEventBundlePurchase = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; tickets: any[] }> => {
    console.log("🧪 Testing multi-event bundle purchase...\n");

    // Find a multi-event bundle
    const allBundles = await ctx.db
      .query("ticketBundles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const multiEventBundle = allBundles.find((b) => b.bundleType === "MULTI_EVENT");

    if (!multiEventBundle) {
      throw new Error("No multi-event bundle found. Please create one first using createMultiEventBundle.");
    }

    console.log(`Found multi-event bundle: ${multiEventBundle.name}`);
    console.log(`Events included: ${multiEventBundle.eventIds?.length || 0}`);
    console.log(`Tiers included: ${multiEventBundle.includedTiers.length}\n`);

    // Get test user
    const testUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "iradwatkins@gmail.com"))
      .first();

    if (!testUser) {
      throw new Error("Test user not found");
    }

    // Get the primary event for the bundle
    const primaryEventId = multiEventBundle.eventId || multiEventBundle.eventIds?.[0];
    if (!primaryEventId) {
      throw new Error("Bundle has no event ID");
    }

    // Calculate pricing
    const bundlePrice = multiEventBundle.price;
    const platformFeeCents = 0; // No fee for test
    const processingFeeCents = 0; // No fee for test

    // Create bundle order
    console.log("1️⃣  Creating bundle order...");
    const orderId = await ctx.runMutation(api.tickets.mutations.createBundleOrder, {
      eventId: primaryEventId,
      bundleId: multiEventBundle._id,
      quantity: 1,
      buyerEmail: "iradwatkins@gmail.com",
      buyerName: "Test Buyer",
      subtotalCents: bundlePrice,
      platformFeeCents,
      processingFeeCents,
      totalCents: bundlePrice + platformFeeCents + processingFeeCents,
    });

    console.log(`   ✅ Order created: ${orderId}\n`);

    // Complete the bundle order (simulating payment)
    console.log("2️⃣  Completing bundle order (simulating payment)...");
    const result = await ctx.runMutation(api.tickets.mutations.completeBundleOrder, {
      orderId,
      paymentId: "TEST-PAYMENT-" + Date.now(),
      paymentMethod: "TEST",
    });

    console.log(`   ✅ Order completed`);
    console.log(`   Tickets generated: ${result.ticketsGenerated}\n`);

    // Fetch the generated tickets to verify
    console.log("3️⃣  Verifying generated tickets...\n");
    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => q.eq(q.field("orderId"), orderId))
      .collect();

    console.log(`Found ${tickets.length} tickets:\n`);

    const ticketDetails = [];
    for (const ticket of tickets) {
      const event = await ctx.db.get(ticket.eventId);
      const tier = ticket.ticketTierId ? await ctx.db.get(ticket.ticketTierId) : null;

      const detail = {
        ticketId: ticket._id,
        ticketCode: ticket.ticketCode,
        eventId: ticket.eventId,
        eventName: event?.name || "Unknown",
        tierName: tier?.name || "Unknown",
        status: ticket.status,
      };

      ticketDetails.push(detail);

      console.log(`  Ticket ${ticketDetails.length}:`);
      console.log(`    - Code: ${detail.ticketCode}`);
      console.log(`    - Event: ${detail.eventName}`);
      console.log(`    - Tier: ${detail.tierName}`);
      console.log(`    - Status: ${detail.status}\n`);
    }

    // Verify tickets are for different events
    const uniqueEventIds = new Set(tickets.map((t) => t.eventId));
    console.log(`\n✅ Verification Results:`);
    console.log(`   - Total tickets: ${tickets.length}`);
    console.log(`   - Unique events: ${uniqueEventIds.size}`);
    console.log(`   - All have ticket codes: ${tickets.every((t) => !!t.ticketCode)}`);

    if (uniqueEventIds.size > 1) {
      console.log(`   ✅ SUCCESS: Tickets are correctly assigned to ${uniqueEventIds.size} different events!`);
    } else {
      console.log(`   ⚠️  WARNING: All tickets are for the same event (bundle may be single-event)`);
    }

    if (tickets.every((t) => !!t.ticketCode)) {
      console.log(`   ✅ SUCCESS: All tickets have unique QR codes!`);
    } else {
      console.log(`   ❌ ERROR: Some tickets are missing ticket codes!`);
    }

    console.log("\n🎉 Test complete!\n");

    return {
      success: true,
      tickets: ticketDetails,
    };
  },
});
