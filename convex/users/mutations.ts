import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";

/**
 * Create or update user from OAuth sign-in
 * This is called after successful Google OAuth authentication
 */
export const upsertUserFromAuth = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        image: args.image,
        updatedAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        email: args.email,
        name: args.name,
        image: args.image,
        role: "user",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      });

      // AUTO-GRANT 10,000 FREE TICKETS for new organizers!
      // Initialize credit balance with first event free promotion
      await ctx.db.insert("organizerCredits", {
        organizerId: userId,
        creditsTotal: 10000, // First 10,000 tickets FREE!
        creditsUsed: 0,
        creditsRemaining: 10000,
        firstEventFreeUsed: false,
        createdAt: now,
        updatedAt: now,
      });

      return userId;
    }
  },
});
