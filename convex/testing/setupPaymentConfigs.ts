import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * INTERNAL MUTATION - Create basic payment configs for events without one
 * This bypasses authentication for testing/setup purposes
 */
export const createBasicPaymentConfigs = internalMutation({
  args: {},
  handler: async (ctx) => {

    // Get all events
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("status"), "PUBLISHED"))
      .collect();


    let created = 0;
    let skipped = 0;

    for (const event of events) {
      // Check if payment config exists
      const existing = await ctx.db
        .query("eventPaymentConfig")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Create a basic payment config
      await ctx.db.insert("eventPaymentConfig", {
        eventId: event._id,
        organizerId: event.organizerId!,
        paymentModel: "CREDIT_CARD",
        isActive: true,
        activatedAt: Date.now(),
        platformFeePercent: 5,
        platformFeeFixed: 50,
        processingFeePercent: 2.9,
        charityDiscount: false,
        lowPriceDiscount: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update event to show tickets
      await ctx.db.patch(event._id, {
        paymentModelSelected: true,
        ticketsVisible: true,
        updatedAt: Date.now(),
      });

      created++;
    }


    return { created, skipped, total: events.length };
  },
});
