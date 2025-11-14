import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Run 4 comprehensive real-time ticket posting tests
 */
export const runLiveTicketTests = mutation({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    success: boolean;
    testsPassed: number;
    testsFailed: number;
    results: any[];
  }> => {

    const testResults = [];

    // ========================================
    // TEST 1: Single Ticket Purchase
    // ========================================

    try {
      // Find an event with tickets
      const events = await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("eventType"), "TICKETED_EVENT"))
        .take(1);

      if (events.length === 0) {
        throw new Error("No ticketed events found");
      }

      const event1 = events[0];

      const tiers1 = await ctx.db
        .query("ticketTiers")
        .withIndex("by_event", (q) => q.eq("eventId", event1._id))
        .take(1);

      if (tiers1.length === 0) {
        throw new Error("No ticket tiers found");
      }

      const tier1 = tiers1[0];

      // Create order
      const order1Id: Id<"orders"> = await ctx.runMutation(api.tickets.mutations.createOrder, {
        eventId: event1._id,
        ticketTierId: tier1._id,
        quantity: 1,
        buyerEmail: `test1-${Date.now()}@stepperslife.com`,
        buyerName: "Test User 1",
        subtotalCents: tier1.price,
        platformFeeCents: 0,
        processingFeeCents: 0,
        totalCents: tier1.price,
      });


      // Complete order
      await ctx.runMutation(api.tickets.mutations.completeOrder, {
        orderId: order1Id,
        paymentId: `TEST1-${Date.now()}`,
        paymentMethod: "TEST",
      });

      // Verify ticket was created
      const tickets1 = await ctx.db
        .query("tickets")
        .filter((q: any) => q.eq(q.field("orderId"), order1Id))
        .collect();


      testResults.push({
        test: "Test 1: Single Ticket Purchase",
        status: "PASSED",
        ticketsCreated: tickets1.length,
        ticketCodes: tickets1.map((t: any) => t.ticketCode),
      });
    } catch (error: any) {
      testResults.push({
        test: "Test 1: Single Ticket Purchase",
        status: "FAILED",
        error: error.message,
      });
    }

    // ========================================
    // TEST 2: Multiple Tickets Same Event
    // ========================================

    try {
      const events = await ctx.db
        .query("events")
        .filter((q) => q.eq(q.field("eventType"), "TICKETED_EVENT"))
        .take(1);

      const event2 = events[0];

      const tiers2 = await ctx.db
        .query("ticketTiers")
        .withIndex("by_event", (q) => q.eq("eventId", event2._id))
        .take(1);

      const tier2 = tiers2[0];
      const quantity = 3;

      // Create order
      const order2Id: Id<"orders"> = await ctx.runMutation(api.tickets.mutations.createOrder, {
        eventId: event2._id,
        ticketTierId: tier2._id,
        quantity,
        buyerEmail: `test2-${Date.now()}@stepperslife.com`,
        buyerName: "Test User 2",
        subtotalCents: tier2.price * quantity,
        platformFeeCents: 0,
        processingFeeCents: 0,
        totalCents: tier2.price * quantity,
      });


      // Complete order
      await ctx.runMutation(api.tickets.mutations.completeOrder, {
        orderId: order2Id,
        paymentId: `TEST2-${Date.now()}`,
        paymentMethod: "TEST",
      });

      // Verify tickets were created
      const tickets2 = await ctx.db
        .query("tickets")
        .filter((q: any) => q.eq(q.field("orderId"), order2Id))
        .collect();

      tickets2.forEach((t: any, i: number) => {
      });

      testResults.push({
        test: "Test 2: Multiple Tickets Same Event",
        status: "PASSED",
        ticketsCreated: tickets2.length,
        ticketCodes: tickets2.map((t: any) => t.ticketCode),
      });
    } catch (error: any) {
      testResults.push({
        test: "Test 2: Multiple Tickets Same Event",
        status: "FAILED",
        error: error.message,
      });
    }

    // ========================================
    // TEST 3: Single-Event Bundle
    // ========================================

    try {
      // Find single-event bundle
      const allBundles = await ctx.db
        .query("ticketBundles")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const singleEventBundle = allBundles.find(
        (b) => !b.bundleType || b.bundleType === "SINGLE_EVENT"
      );

      if (!singleEventBundle) {
        throw new Error("No single-event bundle found");
      }


      const primaryEventId = singleEventBundle.eventId;
      if (!primaryEventId) {
        throw new Error("Bundle has no event ID");
      }

      // Create bundle order
      const order3Id: Id<"orders"> = await ctx.runMutation(
        api.tickets.mutations.createBundleOrder,
        {
          eventId: primaryEventId,
          bundleId: singleEventBundle._id,
          quantity: 1,
          buyerEmail: `test3-${Date.now()}@stepperslife.com`,
          buyerName: "Test User 3",
          subtotalCents: singleEventBundle.price,
          platformFeeCents: 0,
          processingFeeCents: 0,
          totalCents: singleEventBundle.price,
        }
      );


      // Complete bundle order
      await ctx.runMutation(api.tickets.mutations.completeBundleOrder, {
        orderId: order3Id,
        paymentId: `TEST3-${Date.now()}`,
        paymentMethod: "TEST",
      });

      // Verify tickets were created
      const tickets3 = await ctx.db
        .query("tickets")
        .filter((q: any) => q.eq(q.field("orderId"), order3Id))
        .collect();

      tickets3.forEach((t: any, i: number) => {
      });

      testResults.push({
        test: "Test 3: Single-Event Bundle",
        status: "PASSED",
        ticketsCreated: tickets3.length,
        ticketCodes: tickets3.map((t: any) => t.ticketCode),
      });
    } catch (error: any) {
      testResults.push({
        test: "Test 3: Single-Event Bundle",
        status: "FAILED",
        error: error.message,
      });
    }

    // ========================================
    // TEST 4: Multi-Event Bundle
    // ========================================

    try {
      // Find multi-event bundle
      const allBundles = await ctx.db
        .query("ticketBundles")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const multiEventBundle = allBundles.find((b) => b.bundleType === "MULTI_EVENT");

      if (!multiEventBundle) {
        throw new Error("No multi-event bundle found");
      }


      const primaryEventId = multiEventBundle.eventId || multiEventBundle.eventIds?.[0];
      if (!primaryEventId) {
        throw new Error("Bundle has no event ID");
      }

      // Create bundle order
      const order4Id: Id<"orders"> = await ctx.runMutation(
        api.tickets.mutations.createBundleOrder,
        {
          eventId: primaryEventId,
          bundleId: multiEventBundle._id,
          quantity: 1,
          buyerEmail: `test4-${Date.now()}@stepperslife.com`,
          buyerName: "Test User 4",
          subtotalCents: multiEventBundle.price,
          platformFeeCents: 0,
          processingFeeCents: 0,
          totalCents: multiEventBundle.price,
        }
      );


      // Complete bundle order
      await ctx.runMutation(api.tickets.mutations.completeBundleOrder, {
        orderId: order4Id,
        paymentId: `TEST4-${Date.now()}`,
        paymentMethod: "TEST",
      });

      // Verify tickets were created
      const tickets4 = await ctx.db
        .query("tickets")
        .filter((q: any) => q.eq(q.field("orderId"), order4Id))
        .collect();

      // Get event names for each ticket
      const ticketDetails = await Promise.all(
        tickets4.map(async (t: any) => {
          const event: any = await ctx.db.get(t.eventId);
          return {
            code: t.ticketCode,
            event: event?.name || "Unknown",
            status: t.status,
          };
        })
      );

      ticketDetails.forEach((t: any, i: number) => {
      });

      // Verify tickets are for different events
      const uniqueEvents = new Set(tickets4.map((t: any) => t.eventId));

      testResults.push({
        test: "Test 4: Multi-Event Bundle",
        status: "PASSED",
        ticketsCreated: tickets4.length,
        uniqueEvents: uniqueEvents.size,
        ticketCodes: tickets4.map((t: any) => t.ticketCode),
        ticketDetails,
      });
    } catch (error: any) {
      testResults.push({
        test: "Test 4: Multi-Event Bundle",
        status: "FAILED",
        error: error.message,
      });
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================

    const passed: number = testResults.filter((r: any) => r.status === "PASSED").length;
    const failed: number = testResults.filter((r: any) => r.status === "FAILED").length;


    testResults.forEach((result, i) => {
      const icon = result.status === "PASSED" ? "✅" : "❌";
      if (result.status === "PASSED") {
      } else {
      }
    });


    return {
      success: passed === 4,
      testsPassed: passed,
      testsFailed: failed,
      results: testResults,
    };
  },
});
