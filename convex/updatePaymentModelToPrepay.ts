import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Update payment config to PREPAY model
 * This is a one-time fix for test events
 */
export const updateToPrepay = internalMutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {

    // Get payment config
    const paymentConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!paymentConfig) {
      throw new Error("No payment config found for this event");
    }


    // Update to PREPAY model
    await ctx.db.patch(paymentConfig._id, {
      paymentModel: "PREPAY",
      platformFeePercent: 0, // No platform fee for prepay
      platformFeeFixed: 0,
      processingFeePercent: 2.9, // Only Stripe processing
      stripeConnectAccountId: undefined, // Remove Stripe Connect requirement
      updatedAt: Date.now(),
    });


    return {
      success: true,
      eventId: args.eventId,
      oldModel: paymentConfig.paymentModel,
      newModel: "PREPAY",
    };
  },
});
