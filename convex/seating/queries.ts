import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get seating chart for an event (organizer only)
 */
export const getEventSeatingChart = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify user is the event organizer
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    return seatingChart;
  },
});

/**
 * Get public seating chart for an event (for customers)
 */
export const getPublicSeatingChart = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!seatingChart) return null;

    // Get all reserved seats
    const reservations = await ctx.db
      .query("seatReservations")
      .withIndex("by_seating_chart", (q) => q.eq("seatingChartId", seatingChart._id))
      .filter((q) => q.eq(q.field("status"), "RESERVED"))
      .collect();

    // Build a map of reserved seats
    const reservedSeatsMap = new Set<string>();
    for (const reservation of reservations) {
      const key = `${reservation.sectionId}-${reservation.rowId}-${reservation.seatId}`;
      reservedSeatsMap.add(key);
    }

    // Update seat statuses based on reservations
    const updatedSections = seatingChart.sections.map((section) => ({
      ...section,
      rows: section.rows.map((row) => ({
        ...row,
        seats: row.seats.map((seat) => {
          const key = `${section.id}-${row.id}-${seat.id}`;
          return {
            ...seat,
            status: reservedSeatsMap.has(key) ? "RESERVED" as const : seat.status,
          };
        }),
      })),
    }));

    return {
      ...seatingChart,
      sections: updatedSections,
    };
  },
});

/**
 * Get seat reservations for a ticket
 */
export const getTicketSeats = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("seatReservations")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .filter((q) => q.eq(q.field("status"), "RESERVED"))
      .collect();

    return reservations;
  },
});

/**
 * Get all seat reservations for an event (organizer only)
 */
export const getEventSeatReservations = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify user is the event organizer
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const reservations = await ctx.db
      .query("seatReservations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get ticket details for each reservation
    const reservationsWithDetails = await Promise.all(
      reservations.map(async (reservation) => {
        const ticket = await ctx.db.get(reservation.ticketId);
        return {
          ...reservation,
          ticket,
        };
      })
    );

    return reservationsWithDetails;
  },
});
