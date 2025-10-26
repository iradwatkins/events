import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a seating chart for an event
 */
export const createSeatingChart = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    venueImageId: v.optional(v.id("_storage")),
    venueImageUrl: v.optional(v.string()),
    imageScale: v.optional(v.number()),
    imageRotation: v.optional(v.number()),
    sections: v.array(v.object({
      id: v.string(),
      name: v.string(),
      color: v.optional(v.string()),
      x: v.optional(v.number()),
      y: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      rotation: v.optional(v.number()),
      rows: v.array(v.object({
        id: v.string(),
        label: v.string(),
        curved: v.optional(v.boolean()),
        seats: v.array(v.object({
          id: v.string(),
          number: v.string(),
          type: v.union(
            v.literal("STANDARD"),
            v.literal("WHEELCHAIR"),
            v.literal("COMPANION"),
            v.literal("VIP"),
            v.literal("BLOCKED"),
            v.literal("STANDING"),
            v.literal("PARKING"),
            v.literal("TENT")
          ),
          status: v.union(v.literal("AVAILABLE"), v.literal("RESERVED"), v.literal("UNAVAILABLE")),
        })),
      })),
      ticketTierId: v.optional(v.id("ticketTiers")),
    })),
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

    // Calculate total seats
    let totalSeats = 0;
    for (const section of args.sections) {
      for (const row of section.rows) {
        totalSeats += row.seats.length;
      }
    }

    const seatingChartId = await ctx.db.insert("seatingCharts", {
      eventId: args.eventId,
      name: args.name,
      venueImageId: args.venueImageId,
      venueImageUrl: args.venueImageUrl,
      imageScale: args.imageScale,
      imageRotation: args.imageRotation,
      sections: args.sections,
      totalSeats,
      reservedSeats: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { seatingChartId };
  },
});

/**
 * Update a seating chart
 */
export const updateSeatingChart = mutation({
  args: {
    seatingChartId: v.id("seatingCharts"),
    name: v.optional(v.string()),
    venueImageId: v.optional(v.id("_storage")),
    venueImageUrl: v.optional(v.string()),
    imageScale: v.optional(v.number()),
    imageRotation: v.optional(v.number()),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      color: v.optional(v.string()),
      x: v.optional(v.number()),
      y: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      rotation: v.optional(v.number()),
      rows: v.array(v.object({
        id: v.string(),
        label: v.string(),
        curved: v.optional(v.boolean()),
        seats: v.array(v.object({
          id: v.string(),
          number: v.string(),
          type: v.union(
            v.literal("STANDARD"),
            v.literal("WHEELCHAIR"),
            v.literal("COMPANION"),
            v.literal("VIP"),
            v.literal("BLOCKED"),
            v.literal("STANDING"),
            v.literal("PARKING"),
            v.literal("TENT")
          ),
          status: v.union(v.literal("AVAILABLE"), v.literal("RESERVED"), v.literal("UNAVAILABLE")),
        })),
      })),
      ticketTierId: v.optional(v.id("ticketTiers")),
    }))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const seatingChart = await ctx.db.get(args.seatingChartId);
    if (!seatingChart) throw new Error("Seating chart not found");

    // Verify user is the event organizer
    const event = await ctx.db.get(seatingChart.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.venueImageId !== undefined) updates.venueImageId = args.venueImageId;
    if (args.venueImageUrl !== undefined) updates.venueImageUrl = args.venueImageUrl;
    if (args.imageScale !== undefined) updates.imageScale = args.imageScale;
    if (args.imageRotation !== undefined) updates.imageRotation = args.imageRotation;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    if (args.sections !== undefined) {
      updates.sections = args.sections;

      // Recalculate total seats
      let totalSeats = 0;
      for (const section of args.sections) {
        for (const row of section.rows) {
          totalSeats += row.seats.length;
        }
      }
      updates.totalSeats = totalSeats;
    }

    await ctx.db.patch(args.seatingChartId, updates);

    return { success: true };
  },
});

/**
 * Delete a seating chart (only if no reservations)
 */
export const deleteSeatingChart = mutation({
  args: {
    seatingChartId: v.id("seatingCharts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const seatingChart = await ctx.db.get(args.seatingChartId);
    if (!seatingChart) throw new Error("Seating chart not found");

    // Verify user is the event organizer
    const event = await ctx.db.get(seatingChart.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Check if there are any reservations
    const reservations = await ctx.db
      .query("seatReservations")
      .withIndex("by_seating_chart", (q) => q.eq("seatingChartId", args.seatingChartId))
      .filter((q) => q.eq(q.field("status"), "RESERVED"))
      .first();

    if (reservations) {
      throw new Error("Cannot delete seating chart with active reservations");
    }

    await ctx.db.delete(args.seatingChartId);

    return { success: true };
  },
});

/**
 * Reserve seats for a ticket
 */
export const reserveSeats = mutation({
  args: {
    seatingChartId: v.id("seatingCharts"),
    ticketId: v.id("tickets"),
    orderId: v.id("orders"),
    seats: v.array(v.object({
      sectionId: v.string(),
      rowId: v.string(),
      seatId: v.string(),
      seatNumber: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const seatingChart = await ctx.db.get(args.seatingChartId);
    if (!seatingChart) throw new Error("Seating chart not found");

    // Verify seats are available
    for (const seat of args.seats) {
      const existingReservation = await ctx.db
        .query("seatReservations")
        .withIndex("by_seat", (q) =>
          q
            .eq("seatingChartId", args.seatingChartId)
            .eq("sectionId", seat.sectionId)
            .eq("rowId", seat.rowId)
            .eq("seatId", seat.seatId)
        )
        .filter((q) => q.eq(q.field("status"), "RESERVED"))
        .first();

      if (existingReservation) {
        throw new Error(`Seat ${seat.seatNumber} is already reserved`);
      }
    }

    // Create reservations
    for (const seat of args.seats) {
      await ctx.db.insert("seatReservations", {
        eventId: seatingChart.eventId,
        seatingChartId: args.seatingChartId,
        ticketId: args.ticketId,
        orderId: args.orderId,
        sectionId: seat.sectionId,
        rowId: seat.rowId,
        seatId: seat.seatId,
        seatNumber: seat.seatNumber,
        status: "RESERVED",
        reservedAt: Date.now(),
      });
    }

    // Update reserved seats count
    await ctx.db.patch(args.seatingChartId, {
      reservedSeats: seatingChart.reservedSeats + args.seats.length,
    });

    return { success: true };
  },
});

/**
 * Release seat reservations (e.g., when ticket is cancelled)
 */
export const releaseSeats = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const reservations = await ctx.db
      .query("seatReservations")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .filter((q) => q.eq(q.field("status"), "RESERVED"))
      .collect();

    if (reservations.length === 0) {
      return { success: true };
    }

    const seatingChartId = reservations[0].seatingChartId;
    const seatingChart = await ctx.db.get(seatingChartId);

    // Release all reservations
    for (const reservation of reservations) {
      await ctx.db.patch(reservation._id, {
        status: "RELEASED",
        releasedAt: Date.now(),
      });
    }

    // Update reserved seats count
    if (seatingChart) {
      await ctx.db.patch(seatingChartId, {
        reservedSeats: Math.max(0, seatingChart.reservedSeats - reservations.length),
      });
    }

    return { success: true };
  },
});
