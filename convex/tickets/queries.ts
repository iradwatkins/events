import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all tickets for current user with full event details
 */
export const getMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Use test user if not authenticated
    let user;
    if (!identity) {
      console.warn("[getMyTickets] TESTING MODE - Using test user");
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
        .first();
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!user) return [];

    // Get all tickets for this user
    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => q.eq(q.field("attendeeId"), user._id))
      .collect();

    // Enrich tickets with event, tier, order, and seat details
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const event = await ctx.db.get(ticket.eventId);
        const tier = ticket.ticketTierId ? await ctx.db.get(ticket.ticketTierId) : null;
        const order = ticket.orderId ? await ctx.db.get(ticket.orderId) : null;

        // Get image URL if exists
        let imageUrl = event?.imageUrl;
        if (!imageUrl && event?.images && event.images.length > 0) {
          const url = await ctx.storage.getUrl(event.images[0]);
          imageUrl = url ?? undefined;
        }

        // Get seat reservation if exists
        const seatReservation = await ctx.db
          .query("seatReservations")
          .withIndex("by_ticket", (q) => q.eq("ticketId", ticket._id))
          .filter((q) => q.eq(q.field("status"), "RESERVED"))
          .first();

        // Get section and row names from seating chart
        let seatInfo = null;
        if (seatReservation) {
          const seatingChart = await ctx.db.get(seatReservation.seatingChartId);
          if (seatingChart) {
            const section = seatingChart.sections.find((s: any) => s.id === seatReservation.sectionId);
            if (section) {
              const row = section.rows.find((r: any) => r.id === seatReservation.rowId);
              seatInfo = {
                sectionName: section.name,
                rowLabel: row?.label || "",
                seatNumber: seatReservation.seatNumber,
              };
            }
          }
        }

        return {
          _id: ticket._id,
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          scannedAt: ticket.scannedAt,
          createdAt: ticket.createdAt,
          event: event ? {
            _id: event._id,
            name: event.name,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            imageUrl,
            eventType: event.eventType,
          } : null,
          tier: tier ? {
            name: tier.name,
            price: tier.price,
          } : null,
          order: order ? {
            _id: order._id,
            totalCents: order.totalCents,
            paidAt: order.paidAt,
          } : null,
          seat: seatInfo,
        };
      })
    );

    // Sort by creation date (newest first)
    return enrichedTickets.sort((a, b) => b.createdAt - a.createdAt);
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

/**
 * Get ticket details by ticket code (for QR code scanning/validation)
 */
export const getTicketByCode = query({
  args: {
    ticketCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Find ticket by code
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_code", (q) => q.eq("ticketCode", args.ticketCode))
      .first();

    if (!ticket) return null;

    // Get event details
    const event = await ctx.db.get(ticket.eventId);
    if (!event) return null;

    // Get tier details
    const tier = ticket.ticketTierId ? await ctx.db.get(ticket.ticketTierId) : null;

    // Get order details
    const order = ticket.orderId ? await ctx.db.get(ticket.orderId) : null;

    // Get attendee details
    const attendee = ticket.attendeeId ? await ctx.db.get(ticket.attendeeId) : null;

    // Get image URL
    let imageUrl = event.imageUrl;
    if (!imageUrl && event.images && event.images.length > 0) {
      const url = await ctx.storage.getUrl(event.images[0]);
      imageUrl = url ?? undefined;
    }

    return {
      ticket: {
        _id: ticket._id,
        ticketCode: ticket.ticketCode,
        status: ticket.status,
        createdAt: ticket.createdAt,
        scannedAt: ticket.scannedAt,
      },
      event: {
        _id: event._id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        imageUrl,
        eventType: event.eventType,
      },
      tier: tier ? {
        name: tier.name,
        price: tier.price,
        description: tier.description,
      } : null,
      order: order ? {
        _id: order._id,
        totalCents: order.totalCents,
        paidAt: order.paidAt,
      } : null,
      attendee: attendee ? {
        name: attendee.name,
        email: attendee.email,
      } : null,
    };
  },
});
