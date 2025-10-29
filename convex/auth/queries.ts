import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get user by email for login verification
 * Returns user with password hash for server-side verification
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

/**
 * Get current user by ID (for session validation)
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    // Don't return password hash to client
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});
