import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a new user with email and password
 * Password should be pre-hashed on the server (not client)
 */
export const createUserWithPassword = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("organizer"), v.literal("user"))),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const now = Date.now();

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash: args.passwordHash,
      name: args.name,
      role: args.role || "user",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    // Initialize credit balance for organizers - 1000 FREE tickets!
    if (args.role === "organizer" || args.role === "admin") {
      await ctx.db.insert("organizerCredits", {
        organizerId: userId,
        creditsTotal: 1000,
        creditsUsed: 0,
        creditsRemaining: 1000,
        firstEventFreeUsed: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return userId;
  },
});

/**
 * Update user password (for password reset)
 */
export const updateUserPassword = mutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    // Update user password
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
