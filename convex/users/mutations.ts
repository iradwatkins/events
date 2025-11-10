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
        welcomePopupShown: false, // Will be shown when they create first event
        createdAt: now,
        updatedAt: now,
      });

      // Credits will be granted when user creates their first event
      // Normal signup is for attendees who buy tickets, not organizers yet

      return userId;
    }
  },
});

/**
 * Mark the welcome popup as shown for the current user
 */
export const markWelcomePopupShown = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      welcomePopupShown: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
