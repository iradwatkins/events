import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get event by ID
 */
export const getEventById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    return event;
  },
});

/**
 * Get payment configuration for an event
 */
export const getPaymentConfig = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    return config;
  },
});

/**
 * Get organizer's events
 * TESTING MODE: Returns all events (no authentication)
 */
export const getOrganizerEvents = query({
  args: {},
  handler: async (ctx) => {
    // TESTING MODE: No authentication required
    console.warn("[getOrganizerEvents] TESTING MODE - No authentication required");

    // Return all events for now
    const events = await ctx.db
      .query("events")
      .order("desc")
      .collect();

    // Convert storage IDs to URLs for images
    const eventsWithImageUrls = await Promise.all(
      events.map(async (event) => {
        let imageUrl = event.imageUrl;

        // If images array exists and has items, get URL for first image
        if (event.images && event.images.length > 0) {
          try {
            const url = await ctx.storage.getUrl(event.images[0]);
            if (url) {
              imageUrl = url;
            }
          } catch (error) {
            console.error("[getOrganizerEvents] Error getting image URL:", error);
          }
        }

        return {
          ...event,
          imageUrl,
        };
      })
    );

    return eventsWithImageUrls;
  },
});

/**
 * Get ticket tiers for an event
 */
export const getEventTicketTiers = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const tiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return tiers;
  },
});

/**
 * Get event statistics (sales, revenue, attendees)
 */
export const getEventStatistics = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Get all orders for this event
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get all tickets for this event
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get ticket tiers
    const tiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Calculate statistics
    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    const pendingOrders = orders.filter((o) => o.status === "PENDING");
    const totalOrders = orders.length;

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalCents, 0);
    const totalTicketsSold = tiers.reduce((sum, tier) => sum + tier.sold, 0);
    const totalTicketsAvailable = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
    const totalAttendees = tickets.length;

    // Recent orders (last 5)
    const recentOrders = completedOrders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    // Sales by tier
    const salesByTier = tiers.map((tier) => ({
      tierId: tier._id,
      name: tier.name,
      sold: tier.sold,
      quantity: tier.quantity,
      revenue: tier.sold * tier.price,
      percentageSold: tier.quantity > 0 ? (tier.sold / tier.quantity) * 100 : 0,
    }));

    return {
      totalRevenue,
      totalOrders,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      totalTicketsSold,
      totalTicketsAvailable,
      totalAttendees,
      percentageSold: totalTicketsAvailable > 0
        ? (totalTicketsSold / totalTicketsAvailable) * 100
        : 0,
      recentOrders,
      salesByTier,
    };
  },
});

/**
 * Get all orders for an event
 */
export const getEventOrders = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    // Enrich orders with ticket count
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          ...order,
          ticketCount: orderItems.length,
          tickets: tickets.length,
        };
      })
    );

    return enrichedOrders;
  },
});

/**
 * Get all attendees for an event
 */
export const getEventAttendees = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Enrich with tier information
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const tier = ticket.ticketTierId
          ? await ctx.db.get(ticket.ticketTierId)
          : null;

        const order = ticket.orderId
          ? await ctx.db.get(ticket.orderId)
          : null;

        return {
          ...ticket,
          tierName: tier?.name || "General Admission",
          orderNumber: order?._id || "",
          purchaseDate: ticket.createdAt,
        };
      })
    );

    return enrichedTickets;
  },
});

/**
 * Get events available for claiming
 * Returns events that are marked as claimable and don't have an organizer yet
 */
export const getClaimableEvents = query({
  args: {},
  handler: async (ctx) => {
    // Find all events that are claimable and have no organizer
    const claimableEvents = await ctx.db
      .query("events")
      .withIndex("by_claimable", (q) => q.eq("isClaimable", true))
      .filter((q) => q.eq(q.field("organizerId"), undefined))
      .order("desc")
      .collect();

    // Convert storage IDs to URLs for images
    const eventsWithImageUrls = await Promise.all(
      claimableEvents.map(async (event) => {
        let imageUrl = event.imageUrl;

        // If images array exists and has items, get URL for first image
        if (event.images && event.images.length > 0) {
          try {
            const url = await ctx.storage.getUrl(event.images[0]);
            if (url) {
              imageUrl = url;
            }
          } catch (error) {
            console.error("[getClaimableEvents] Error getting image URL:", error);
          }
        }

        return {
          ...event,
          imageUrl,
        };
      })
    );

    return eventsWithImageUrls;
  },
});

/**
 * Search events available for claiming
 * Returns empty array if no search term provided (keeps UI clean)
 */
export const searchClaimableEvents = query({
  args: {
    searchTerm: v.optional(v.string()),
    category: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // If no search term and no filters, return empty array
    if (!args.searchTerm && !args.category && !args.dateFrom && !args.dateTo) {
      return [];
    }

    // Find all events that are claimable and have no organizer
    let claimableEvents = await ctx.db
      .query("events")
      .withIndex("by_claimable", (q) => q.eq("isClaimable", true))
      .filter((q) => q.eq(q.field("organizerId"), undefined))
      .order("desc")
      .collect();

    // Apply search term filter
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      claimableEvents = claimableEvents.filter(
        (event) =>
          event.name.toLowerCase().includes(searchLower) ||
          (event.description?.toLowerCase().includes(searchLower) ?? false) ||
          (event.location?.toLowerCase().includes(searchLower) ?? false) ||
          (event.venueName?.toLowerCase().includes(searchLower) ?? false) ||
          (event.city?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Apply category filter
    if (args.category) {
      claimableEvents = claimableEvents.filter(
        (event) => event.category === args.category
      );
    }

    // Apply date range filter
    if (args.dateFrom || args.dateTo) {
      claimableEvents = claimableEvents.filter((event) => {
        if (!event.startDate) return false;
        if (args.dateFrom && event.startDate < args.dateFrom) return false;
        if (args.dateTo && event.startDate > args.dateTo) return false;
        return true;
      });
    }

    // Convert storage IDs to URLs for images
    const eventsWithImageUrls = await Promise.all(
      claimableEvents.map(async (event) => {
        let imageUrl = event.imageUrl;

        // If images array exists and has items, get URL for first image
        if (event.images && event.images.length > 0) {
          try {
            const url = await ctx.storage.getUrl(event.images[0]);
            if (url) {
              imageUrl = url;
            }
          } catch (error) {
            console.error("[searchClaimableEvents] Error getting image URL:", error);
          }
        }

        return {
          ...event,
          imageUrl,
        };
      })
    );

    return eventsWithImageUrls;
  },
});
