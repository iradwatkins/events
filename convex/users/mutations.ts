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

/**
 * Mark first event ticket popup as shown
 */
export const markFirstEventTicketPopupShown = mutation({
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
      firstEventTicketPopupShown: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create a new user with email/password registration
 */
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(), // Pre-hashed password (hash before calling this)
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: args.passwordHash, // Store pre-hashed password
      role: (args.role || "organizer") as "admin" | "organizer" | "user",
      emailVerified: false,
      welcomePopupShown: false,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Update payment processor settings for an organizer
 * Allows organizers to enable/disable which payment methods they accept for ticket sales
 */
export const updatePaymentProcessorSettings = mutation({
  args: {
    acceptsStripePayments: v.optional(v.boolean()),
    acceptsPaypalPayments: v.optional(v.boolean()),
    acceptsCashPayments: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
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

    // Only allow organizers to update payment settings
    if (user.role !== "organizer" && user.role !== "admin") {
      throw new Error("Only organizers can configure payment processors");
    }

    const updates: any = { updatedAt: Date.now() };

    if (args.acceptsStripePayments !== undefined) {
      updates.acceptsStripePayments = args.acceptsStripePayments;
    }
    if (args.acceptsPaypalPayments !== undefined) {
      updates.acceptsPaypalPayments = args.acceptsPaypalPayments;
    }
    if (args.acceptsCashPayments !== undefined) {
      updates.acceptsCashPayments = args.acceptsCashPayments;
    }

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

/**
 * Connect Stripe account for receiving ticket payments
 */
export const connectStripeAccount = mutation({
  args: {
    stripeConnectedAccountId: v.string(),
  },
  handler: async (ctx, args) => {
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
      stripeConnectedAccountId: args.stripeConnectedAccountId,
      stripeAccountSetupComplete: true,
      acceptsStripePayments: true, // Auto-enable when connected
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Connect PayPal account for receiving ticket payments
 */
export const connectPaypalAccount = mutation({
  args: {
    paypalMerchantId: v.string(),
  },
  handler: async (ctx, args) => {
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
      paypalMerchantId: args.paypalMerchantId,
      paypalAccountSetupComplete: true,
      acceptsPaypalPayments: true, // Auto-enable when connected
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Disconnect a payment processor
 */
export const disconnectPaymentProcessor = mutation({
  args: {
    processor: v.union(v.literal("stripe"), v.literal("paypal")),
  },
  handler: async (ctx, args) => {
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

    const updates: any = { updatedAt: Date.now() };

    if (args.processor === "stripe") {
      updates.stripeConnectedAccountId = undefined;
      updates.stripeAccountSetupComplete = false;
      updates.acceptsStripePayments = false;
    } else if (args.processor === "paypal") {
      updates.paypalMerchantId = undefined;
      updates.paypalAccountSetupComplete = false;
      updates.acceptsPaypalPayments = false;
    }

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

/**
 * Update user password hash (ADMIN ONLY - highly sensitive)
 * PRODUCTION: Requires admin authentication
 */
export const updatePasswordHash = mutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    // PRODUCTION: Require admin authentication for password changes
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. This is a sensitive operation.");
    }

    // Verify admin privileges
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Admin access required. Only administrators can update user passwords.");
    }

    // Log admin action for security audit

    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update user role (ADMIN ONLY - highly sensitive)
 * PRODUCTION: Requires admin authentication
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("organizer"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // PRODUCTION: Require admin authentication for role changes
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. This is a sensitive operation.");
    }

    // Verify admin privileges
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Admin access required. Only administrators can change user roles.");
    }

    // Prevent removing the last admin
    if (args.role !== "admin") {
      const targetUser = await ctx.db.get(args.userId);
      if (targetUser?.role === "admin") {
        const allAdmins = await ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", "admin"))
          .collect();

        if (allAdmins.length <= 1) {
          throw new Error("Cannot remove the last admin. Please assign another admin first.");
        }
      }
    }

    // Log admin action for security audit

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return { success: true, role: args.role };
  },
});

/**
 * Update user permissions (ADMIN ONLY)
 * Used to restrict organizers to only certain event types
 * PRODUCTION: Requires admin authentication
 */
export const updateUserPermissions = mutation({
  args: {
    userId: v.id("users"),
    canCreateTicketedEvents: v.boolean(),
  },
  handler: async (ctx, args) => {
    // PRODUCTION: Require admin authentication for permission changes
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. This is a sensitive operation.");
    }

    // Verify admin privileges
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Admin access required. Only administrators can modify user permissions.");
    }

    // Log admin action for security audit

    await ctx.db.patch(args.userId, {
      canCreateTicketedEvents: args.canCreateTicketedEvents,
      updatedAt: Date.now(),
    });

    return { success: true, canCreateTicketedEvents: args.canCreateTicketedEvents };
  },
});

/**
 * Create or update user from Google OAuth
 */
export const upsertUserFromGoogle = mutation({
  args: {
    googleId: v.string(),
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists by Google ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_googleId", (q) => q.eq("googleId", args.googleId))
      .first();

    // If not found by Google ID, check by email
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      // If found by email, link Google ID
      if (user) {
        await ctx.db.patch(user._id, {
          googleId: args.googleId,
          authProvider: "google",
          name: args.name,
          image: args.image,
          emailVerified: true,
          updatedAt: now,
        });
        return user._id;
      }
    }

    // If user exists with Google ID, just update
    if (user) {
      await ctx.db.patch(user._id, {
        name: args.name,
        image: args.image,
        updatedAt: now,
      });
      return user._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
      googleId: args.googleId,
      authProvider: "google",
      role: "user",
      emailVerified: true,
      welcomePopupShown: false,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Store magic link token for a user
 */
export const storeMagicLinkToken = mutation({
  args: {
    email: v.string(),
    tokenHash: v.string(),
    expiry: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find or create user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      // Update existing user with magic link token
      await ctx.db.patch(user._id, {
        magicLinkToken: args.tokenHash,
        magicLinkExpiry: args.expiry,
        updatedAt: now,
      });
      return { userId: user._id, isNewUser: false };
    } else {
      // Create new user with magic link token
      const userId = await ctx.db.insert("users", {
        email: args.email,
        name: args.email.split("@")[0], // Use email prefix as temporary name
        magicLinkToken: args.tokenHash,
        magicLinkExpiry: args.expiry,
        authProvider: "magic_link",
        role: "user",
        emailVerified: false, // Will be verified when they click the link
        welcomePopupShown: false,
        createdAt: now,
        updatedAt: now,
      });
      return { userId, isNewUser: true };
    }
  },
});

/**
 * Verify magic link token and sign in user
 */
export const verifyMagicLinkToken = mutation({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find user by token hash
    const user = await ctx.db
      .query("users")
      .withIndex("by_magicLinkToken", (q) => q.eq("magicLinkToken", args.tokenHash))
      .first();

    if (!user) {
      throw new Error("Invalid or expired magic link");
    }

    // Check if token is expired
    if (!user.magicLinkExpiry || now > user.magicLinkExpiry) {
      // Clear expired token
      await ctx.db.patch(user._id, {
        magicLinkToken: undefined,
        magicLinkExpiry: undefined,
      });
      throw new Error("Magic link has expired. Please request a new one.");
    }

    // Token is valid - clear it and mark email as verified
    await ctx.db.patch(user._id, {
      magicLinkToken: undefined,
      magicLinkExpiry: undefined,
      emailVerified: true,
      authProvider: "magic_link",
      updatedAt: now,
    });

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
    };
  },
});

/**
 * Delete a user (ADMIN ONLY - highly sensitive)
 * This will also delete all related data
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. This is a sensitive operation.");
    }

    // Verify admin privileges
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Admin access required. Only administrators can delete users.");
    }

    // Get the user to be deleted
    const userToDelete = await ctx.db.get(args.userId);
    if (!userToDelete) {
      throw new Error("User not found");
    }

    // Prevent deleting the last admin
    if (userToDelete.role === "admin") {
      const allAdmins = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .collect();

      if (allAdmins.length <= 1) {
        throw new Error("Cannot delete the last admin.");
      }
    }

    // Log admin action for security audit

    // Delete the user
    await ctx.db.delete(args.userId);

    return { success: true, deletedEmail: userToDelete.email };
  },
});
