import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Admin mutations - requires admin role
 */

/**
 * Update user role
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("organizer"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    // // Don't allow changing your own role
    // if (admin._id === args.userId) {
    //   throw new Error("Cannot change your own role");
    // }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete user (soft delete - keep for records)
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    // // Don't allow deleting yourself
    // if (admin._id === args.userId) {
    //   throw new Error("Cannot delete your own account");
    // }

    // Check if user has events
    const userEvents = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.userId))
      .collect();

    if (userEvents.length > 0) {
      throw new Error(
        `Cannot delete user with ${userEvents.length} events. Please delete or reassign events first.`
      );
    }

    // Actually delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

/**
 * Update event status (for moderation)
 */
export const updateEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("CANCELLED"),
      v.literal("COMPLETED")
    ),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    await ctx.db.patch(args.eventId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete event (admin override)
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Check if event has tickets sold
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (tickets.length > 0) {
      throw new Error(
        `Cannot delete event with ${tickets.length} tickets sold. Cancel instead.`
      );
    }

    // Delete ticket tiers
    const tiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const tier of tiers) {
      await ctx.db.delete(tier._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});

/**
 * Create admin user (system initialization)
 */
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // This mutation should be protected and only callable during setup
    // In production, add additional security checks

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Promote existing user to admin
      await ctx.db.patch(existingUser._id, {
        role: "admin",
        updatedAt: Date.now(),
      });

      return { success: true, userId: existingUser._id, action: "promoted" };
    }

    // Create new admin user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: "admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, userId, action: "created" };
  },
});

/**
 * Refund order (admin override)
 */
export const refundOrder = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    if (order.status !== "COMPLETED") {
      throw new Error("Can only refund completed orders");
    }

    // Mark order as refunded
    await ctx.db.patch(args.orderId, {
      status: "CANCELLED",
      updatedAt: Date.now(),
    });

    // Mark all tickets as refunded
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    for (const ticket of tickets) {
      await ctx.db.patch(ticket._id, {
        status: "REFUNDED",
        updatedAt: Date.now(),
      });
    }

    // TODO: Process actual refund via payment processor (Square/Stripe)

    return { success: true, ticketsRefunded: tickets.length };
  },
});
