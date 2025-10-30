import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create Stripe Connect account and return onboarding link
 * This creates the account via API and stores the account ID
 */
export const createStripeConnectAccount = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Skip authentication, use test user
    let user;
    if (!identity) {
      console.warn("[createStripeConnectAccount] TESTING MODE - No authentication required");
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
        .first();
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!user) throw new Error("User not found");

    // If user already has a Stripe account, just return a new onboarding link
    if (user.stripeConnectedAccountId) {
      console.log("[createStripeConnectAccount] User already has Stripe account:", user.stripeConnectedAccountId);

      // Return existing account with refresh link
      // The frontend will call the PUT endpoint to get a new account link
      return {
        accountId: user.stripeConnectedAccountId,
        accountLinkUrl: `/organizer/settings?stripe=refresh&accountId=${user.stripeConnectedAccountId}`,
        success: true,
      };
    }

    // Return info needed for frontend to create account via API
    // Frontend will call /api/stripe/create-connect-account with this email
    return {
      accountLinkUrl: `/organizer/settings?stripe=create&email=${user.email}`,
      success: true,
    };
  },
});

/**
 * Save Stripe Connect account ID to user after successful onboarding
 */
export const saveStripeConnectAccount = mutation({
  args: {
    accountId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Skip authentication, use test user
    let user;
    if (!identity) {
      console.warn("[saveStripeConnectAccount] TESTING MODE - No authentication required");
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
        .first();
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!user) throw new Error("User not found");

    // Update user with Stripe account ID and mark as setup complete
    await ctx.db.patch(user._id, {
      stripeConnectedAccountId: args.accountId,
      stripeAccountSetupComplete: true,
    });

    console.log("[saveStripeConnectAccount] Saved Stripe account for user:", user._id, args.accountId);

    return { success: true };
  },
});
