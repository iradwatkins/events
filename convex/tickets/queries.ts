import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all tickets for current user
 */
export const getMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    // Get all orders for this user
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "COMPLETED"))
      .order("desc")
      .collect();

    // Return orders - enrichment temporarily disabled due to schema mismatch
    return orders;
  },
});

/**
 * Get ticket by order number (for magic link access)
 */
export const getTicketByOrderNumber = query({
  args: {
    orderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Function temporarily disabled - orderNumber field doesn't exist in schema
    return null;
  },
});

/**
 * Get single ticket instance (for QR code display)
 */
export const getTicketInstance = query({
  args: {
    ticketNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("ticketInstances")
      .withIndex("by_ticket_number", (q) => q.eq("ticketNumber", args.ticketNumber))
      .first();

    if (!ticket) return null;

    // Return ticket - enrichment temporarily disabled due to schema mismatch
    return ticket;
  },
});

/**
 * Get upcoming events for user (events with tickets not yet scanned)
 */
export const getMyUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    // Get completed orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "COMPLETED"))
      .collect();

    // Get unique events
    const eventIds = [...new Set(orders.map((o) => o.eventId))];
    const events = await Promise.all(
      eventIds.map(async (eventId) => {
        const event = await ctx.db.get(eventId);
        if (!event) return null;

        // Only return upcoming events
        if (event.startDate && event.startDate < Date.now()) return null;

        // Get user's tickets for this event
        const userOrders = orders.filter((o) => o.eventId === eventId);
        // TODO: Restore quantity calculation when orders schema is updated
        const totalTickets = userOrders.length;

        return {
          ...event,
          totalTickets,
        };
      })
    );

    return events.filter((e) => e !== null);
  },
});

/**
 * Get past events for user
 */
export const getMyPastEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "COMPLETED"))
      .collect();

    const eventIds = [...new Set(orders.map((o) => o.eventId))];
    const events = await Promise.all(
      eventIds.map(async (eventId) => {
        const event = await ctx.db.get(eventId);
        if (!event) return null;

        // Only return past events
        if (!event.startDate || event.startDate >= Date.now()) return null;

        const userOrders = orders.filter((o) => o.eventId === eventId);
        // TODO: Restore quantity calculation when orders schema is updated
        const totalTickets = userOrders.length;

        return {
          ...event,
          totalTickets,
        };
      })
    );

    return events.filter((e) => e !== null);
  },
});

/**
 * Get order details (for confirmation page)
 */
export const getOrderDetails = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const event = await ctx.db.get(order.eventId);

    // Get all tickets for this order
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    // Enrich tickets with tier information
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const tier = ticket.ticketTierId ? await ctx.db.get(ticket.ticketTierId) : null;
        return {
          code: ticket.ticketCode,
          tierName: tier?.name || "General Admission",
          status: ticket.status,
        };
      })
    );

    return {
      order,
      event,
      tickets: enrichedTickets,
    };
  },
});
