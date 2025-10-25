import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a ticket tier for an event
 */
export const createTicketTier = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // in cents
    quantity: v.number(),
    saleStart: v.optional(v.number()),
    saleEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[createTicketTier] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify event ownership
      const event = await ctx.db.get(args.eventId);
      if (!event) throw new Error("Event not found");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized");
      }
    }

    // Verify event exists (even in TESTING MODE)
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Create ticket tier
    const tierId = await ctx.db.insert("ticketTiers", {
      eventId: args.eventId,
      name: args.name,
      description: args.description,
      price: args.price,
      quantity: args.quantity,
      sold: 0,
      saleStart: args.saleStart,
      saleEnd: args.saleEnd,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return tierId;
  },
});

/**
 * Delete a ticket tier
 */
export const deleteTicketTier = mutation({
  args: {
    tierId: v.id("ticketTiers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const tier = await ctx.db.get(args.tierId);
    if (!tier) throw new Error("Ticket tier not found");

    // Check if any tickets have been sold
    if (tier.sold > 0) {
      throw new Error("Cannot delete ticket tier with sold tickets");
    }

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[deleteTicketTier] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify event ownership
      const event = await ctx.db.get(tier.eventId);
      if (!event) throw new Error("Event not found");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized");
      }
    }

    await ctx.db.delete(args.tierId);

    return { success: true };
  },
});

/**
 * Create a new order for ticket purchase
 */
export const createOrder = mutation({
  args: {
    eventId: v.id("events"),
    ticketTierId: v.id("ticketTiers"),
    quantity: v.number(),
    buyerEmail: v.string(),
    buyerName: v.string(),
    subtotalCents: v.number(),
    platformFeeCents: v.number(),
    processingFeeCents: v.number(),
    totalCents: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    // Verify event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Verify ticket tier exists
    const ticketTier = await ctx.db.get(args.ticketTierId);
    if (!ticketTier) throw new Error("Ticket tier not found");

    // Create order
    const orderId = await ctx.db.insert("orders", {
      eventId: args.eventId,
      buyerId: user._id,
      buyerEmail: args.buyerEmail,
      buyerName: args.buyerName,
      status: "PENDING",
      subtotalCents: args.subtotalCents,
      platformFeeCents: args.platformFeeCents,
      processingFeeCents: args.processingFeeCents,
      totalCents: args.totalCents,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create order items (tickets)
    for (let i = 0; i < args.quantity; i++) {
      await ctx.db.insert("orderItems", {
        orderId,
        ticketTierId: args.ticketTierId,
        priceCents: ticketTier.price,
        createdAt: Date.now(),
      });
    }

    return orderId;
  },
});

/**
 * Complete an order after successful payment
 */
export const completeOrder = mutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
    paymentMethod: v.union(v.literal("SQUARE"), v.literal("STRIPE")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Verify order belongs to current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || order.buyerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Update order status
    await ctx.db.patch(args.orderId, {
      status: "COMPLETED",
      paymentId: args.paymentId,
      paymentMethod: args.paymentMethod,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Generate tickets for each order item
    const orderItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    for (const item of orderItems) {
      // Generate unique ticket code
      const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await ctx.db.insert("tickets", {
        orderId: args.orderId,
        orderItemId: item._id,
        eventId: order.eventId,
        ticketTierId: item.ticketTierId,
        attendeeId: user._id,
        attendeeEmail: order.buyerEmail,
        attendeeName: order.buyerName,
        ticketCode,
        status: "VALID",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true, ticketCount: orderItems.length };
  },
});

/**
 * Cancel a pending order
 */
export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || order.buyerId !== user._id) {
      throw new Error("Not authorized");
    }

    if (order.status !== "PENDING") {
      throw new Error("Cannot cancel completed order");
    }

    await ctx.db.patch(args.orderId, {
      status: "CANCELLED",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
