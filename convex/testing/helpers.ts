/**
 * TESTING HELPERS
 * These mutations are only for testing purposes and bypass authentication
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Enable tickets visibility for testing (bypasses authentication)
 */
export const enableTicketsForTesting = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    console.log("[enableTicketsForTesting] Enabling tickets for event:", args.eventId);

    // Update event to make tickets visible
    await ctx.db.patch(args.eventId, {
      ticketsVisible: true,
      paymentModelSelected: true,
      updatedAt: Date.now(),
    });

    // Check if payment config exists
    const existingConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!existingConfig) {
      // Get event to get organizerId
      const event = await ctx.db.get(args.eventId);
      if (!event) throw new Error("Event not found");

      // Create minimal payment config
      await ctx.db.insert("eventPaymentConfig", {
        eventId: args.eventId,
        organizerId: event.organizerId,
        paymentModel: "PREPAY",
        isActive: true,
        platformFeePercent: 0,
        platformFeeFixed: 0,
        processingFeePercent: 0,
        charityDiscount: false,
        lowPriceDiscount: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log("[enableTicketsForTesting] Created payment config");
    } else {
      // Update existing config to be active
      await ctx.db.patch(existingConfig._id, {
        isActive: true,
        updatedAt: Date.now(),
      });
      console.log("[enableTicketsForTesting] Activated existing payment config");
    }

    console.log("[enableTicketsForTesting] ✅ Tickets enabled successfully");
    return { success: true };
  },
});
