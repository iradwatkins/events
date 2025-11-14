import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Create a test multi-event bundle
 * This demonstrates the new cross-event bundle feature
 */
export const createMultiEventBundle = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; bundleId: any }> => {

    // Find multiple events to bundle together - specifically look for the test events we created
    const allEvents = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("eventType"), "TICKETED_EVENT"))
      .collect();

    // Filter to events that have ticket tiers
    const eventsWithTiers = [];
    for (const event of allEvents) {
      const tiers = await ctx.db
        .query("ticketTiers")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();

      if (tiers.length > 0) {
        eventsWithTiers.push(event);
        if (eventsWithTiers.length >= 2) break; // We only need 2 events
      }
    }

    if (eventsWithTiers.length < 2) {
      throw new Error("Need at least 2 events with ticket tiers to create a multi-event bundle");
    }

    const events = eventsWithTiers;

    events.forEach((e, i) => {
    });

    // Get ticket tiers for each event
    const event1Tiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", events[0]._id))
      .collect();

    const event2Tiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", events[1]._id))
      .collect();

    if (event1Tiers.length === 0 || event2Tiers.length === 0) {
      throw new Error("Events must have ticket tiers");
    }

    // Pick one tier from each event (preferably GA/General Admission)
    const tier1 = event1Tiers.find((t) => t.name.includes("General")) || event1Tiers[0];
    const tier2 = event2Tiers.find((t) => t.name.includes("General")) || event2Tiers[0];


    // Calculate bundle pricing
    const regularPrice = tier1.price + tier2.price;
    const discount = Math.floor(regularPrice * 0.15); // 15% discount
    const bundlePrice = regularPrice - discount;


    // Create multi-event bundle
    const bundleId = await ctx.runMutation(api.bundles.mutations.createTicketBundle, {
      bundleType: "MULTI_EVENT",
      eventIds: [events[0]._id, events[1]._id],
      name: "Holiday Season Pass",
      description: `Experience both ${events[0].name} and ${events[1].name}! Save 15% when you bundle tickets to both events. Perfect for the holiday season!`,
      price: bundlePrice,
      includedTiersWithEvents: [
        {
          tierId: tier1._id,
          tierName: tier1.name,
          quantity: 1,
          eventId: events[0]._id,
          eventName: events[0].name,
        },
        {
          tierId: tier2._id,
          tierName: tier2.name,
          quantity: 1,
          eventId: events[1]._id,
          eventName: events[1].name,
        },
      ],
      totalQuantity: 100, // 100 bundles available
    });


    return {
      success: true,
      bundleId,
    };
  },
});
