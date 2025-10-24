import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create Stripe Connect account (placeholder)
 */
export const createStripeConnectAccount = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // TODO: Implement actual Stripe Connect account creation
    // For now, return a placeholder URL
    // In production, this would:
    // 1. Create a Stripe Connect account
    // 2. Generate an account link for onboarding
    // 3. Save the account ID to the user record

    const accountLinkUrl = `https://connect.stripe.com/setup/s/placeholder`;

    return {
      accountLinkUrl,
      success: true,
    };
  },
});
