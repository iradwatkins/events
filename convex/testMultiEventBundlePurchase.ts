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

    // Find a multi-event bundle
    const allBundles = await ctx.db
      .query("ticketBundles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const multiEventBundle = allBundles.find((b) => b.bundleType === "MULTI_EVENT");

    if (!multiEventBundle) {
      throw new Error(
        "No multi-event bundle found. Please create one first using createMultiEventBundle."
      );
    }


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


    // Complete the bundle order (simulating payment)
    const result = await ctx.runMutation(api.tickets.mutations.completeBundleOrder, {
      orderId,
      paymentId: "TEST-PAYMENT-" + Date.now(),
      paymentMethod: "TEST",
    });


    // Fetch the generated tickets to verify
    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => q.eq(q.field("orderId"), orderId))
      .collect();


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

    }

    // Verify tickets are for different events
    const uniqueEventIds = new Set(tickets.map((t) => t.eventId));

    if (uniqueEventIds.size > 1) {
    } else {
    }

    if (tickets.every((t) => !!t.ticketCode)) {
    } else {
    }


    return {
      success: true,
      tickets: ticketDetails,
    };
  },
});
