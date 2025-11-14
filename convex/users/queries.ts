import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get current authenticated user
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();


    // Require authentication
    if (!identity) {
      return null;
    }

    // Parse the identity (which is a JSON string from our NextAuth integration)
    let userInfo;
    try {
      userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
    } catch (error) {
      userInfo = identity;
    }

    const email = userInfo.email || identity.email;
    if (!email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    return user;
  },
});

/**
 * Check if user is authenticated
 */
export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return !!identity;
  },
});

/**
 * Get user by ID (includes password hash - use getUserByIdPublic for client-facing endpoints)
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get user by ID without password hash (safe for client-facing endpoints)
 */
export const getUserByIdPublic = query({
  args: { userId: v.id("users") },
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

/**
 * Get user by email address
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});
