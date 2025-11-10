import { query } from "../_generated/server";

/**
 * Get current user's credit balance
 * Returns full credit object with creditsRemaining, creditsUsed, creditsTotal
 */
export const getCreditBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    const credits = await ctx.db
      .query("organizerCredits")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .first();

    if (!credits) return null;

    // Return full credits object for components to use
    return credits;
  },
});
