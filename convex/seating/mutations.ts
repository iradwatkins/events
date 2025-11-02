import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a seating chart for an event
 */
export const createSeatingChart = mutation({
  args: {
    eventId: v.id("events"),
    name: v.string(),
    seatingStyle: v.optional(v.union(
      v.literal("ROW_BASED"),
      v.literal("TABLE_BASED"),
      v.literal("MIXED")
    )),
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
      containerType: v.optional(v.union(v.literal("ROWS"), v.literal("TABLES"))),
      // ROW-BASED (optional)
      rows: v.optional(v.array(v.object({
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
      }))),
      // TABLE-BASED (optional)
      tables: v.optional(v.array(v.object({
        id: v.string(),
        number: v.union(v.string(), v.number()),
        shape: v.union(
          v.literal("ROUND"),
          v.literal("RECTANGULAR"),
          v.literal("SQUARE"),
          v.literal("CUSTOM")
        ),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        rotation: v.optional(v.number()),
        customPath: v.optional(v.string()),
        capacity: v.number(),
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
          position: v.optional(v.object({
            angle: v.optional(v.number()),
            side: v.optional(v.string()),
            offset: v.optional(v.number()),
          })),
        })),
      }))),
      ticketTierId: v.optional(v.id("ticketTiers")),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[createSeatingChart] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify user is the event organizer
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

    // Verify event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Calculate total seats (handles both rows and tables)
    let totalSeats = 0;
    for (const section of args.sections) {
      // Count row-based seats
      if (section.rows) {
        for (const row of section.rows) {
          totalSeats += row.seats.length;
        }
      }
      // Count table-based seats
      if (section.tables) {
        for (const table of section.tables) {
          totalSeats += table.seats.length;
        }
      }
    }

    const seatingChartId = await ctx.db.insert("seatingCharts", {
      eventId: args.eventId,
      name: args.name,
      seatingStyle: args.seatingStyle || "ROW_BASED",
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
    seatingStyle: v.optional(v.union(
      v.literal("ROW_BASED"),
      v.literal("TABLE_BASED"),
      v.literal("MIXED")
    )),
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
      containerType: v.optional(v.union(v.literal("ROWS"), v.literal("TABLES"))),
      // ROW-BASED (optional)
      rows: v.optional(v.array(v.object({
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
      }))),
      // TABLE-BASED (optional)
      tables: v.optional(v.array(v.object({
        id: v.string(),
        number: v.union(v.string(), v.number()),
        shape: v.union(
          v.literal("ROUND"),
          v.literal("RECTANGULAR"),
          v.literal("SQUARE"),
          v.literal("CUSTOM")
        ),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        rotation: v.optional(v.number()),
        customPath: v.optional(v.string()),
        capacity: v.number(),
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
          position: v.optional(v.object({
            angle: v.optional(v.number()),
            side: v.optional(v.string()),
            offset: v.optional(v.number()),
          })),
        })),
      }))),
      ticketTierId: v.optional(v.id("ticketTiers")),
    }))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const seatingChart = await ctx.db.get(args.seatingChartId);
    if (!seatingChart) throw new Error("Seating chart not found");

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[updateSeatingChart] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify user is the event organizer
      const event = await ctx.db.get(seatingChart.eventId);
      if (!event) throw new Error("Event not found");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized");
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.seatingStyle !== undefined) updates.seatingStyle = args.seatingStyle;
    if (args.venueImageId !== undefined) updates.venueImageId = args.venueImageId;
    if (args.venueImageUrl !== undefined) updates.venueImageUrl = args.venueImageUrl;
    if (args.imageScale !== undefined) updates.imageScale = args.imageScale;
    if (args.imageRotation !== undefined) updates.imageRotation = args.imageRotation;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    if (args.sections !== undefined) {
      updates.sections = args.sections;

      // Recalculate total seats (handles both rows and tables)
      let totalSeats = 0;
      for (const section of args.sections) {
        // Count row-based seats
        if (section.rows) {
          for (const row of section.rows) {
            totalSeats += row.seats.length;
          }
        }
        // Count table-based seats
        if (section.tables) {
          for (const table of section.tables) {
            totalSeats += table.seats.length;
          }
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

    const seatingChart = await ctx.db.get(args.seatingChartId);
    if (!seatingChart) throw new Error("Seating chart not found");

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[deleteSeatingChart] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify user is the event organizer
      const event = await ctx.db.get(seatingChart.eventId);
      if (!event) throw new Error("Event not found");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized");
      }
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
 * Reserve seats for a ticket (supports both row-based and table-based)
 */
export const reserveSeats = mutation({
  args: {
    seatingChartId: v.id("seatingCharts"),
    ticketId: v.id("tickets"),
    orderId: v.id("orders"),
    seats: v.array(v.object({
      sectionId: v.string(),
      // ROW-BASED fields (optional)
      rowId: v.optional(v.string()),
      rowLabel: v.optional(v.string()),
      // TABLE-BASED fields (optional)
      tableId: v.optional(v.string()),
      tableNumber: v.optional(v.union(v.string(), v.number())),
      // Common fields
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
        // ROW-BASED fields
        rowId: seat.rowId,
        rowLabel: seat.rowLabel,
        // TABLE-BASED fields
        tableId: seat.tableId,
        tableNumber: seat.tableNumber,
        // Common fields
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

/**
 * Temporarily hold seats for a user session (15 minute timeout)
 * Used during checkout to prevent double-bookings
 */
export const holdSeatsForSession = mutation({
  args: {
    eventId: v.id("events"),
    sessionId: v.string(),
    seats: v.array(v.object({
      tableId: v.string(),
      seatNumber: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionExpiry = now + (15 * 60 * 1000); // 15 minutes from now

    // Get the seating chart
    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!seatingChart) {
      throw new Error("Seating chart not found");
    }

    // Update the seating chart with session holds
    const updatedSections = seatingChart.sections.map((section: any) => {
      if (!section.tables) return section;

      const updatedTables = section.tables.map((table: any) => {
        const updatedSeats = table.seats.map((seat: any) => {
          const seatHold = args.seats.find(
            (s) => s.tableId === table.id && s.seatNumber === seat.number
          );

          if (seatHold) {
            // Check if seat is already sold or reserved by another session
            if (seat.status === "RESERVED" || seat.status === "UNAVAILABLE") {
              throw new Error(`Seat ${seat.number} at Table ${table.number} is already taken`);
            }

            // Check if held by another active session
            if (
              seat.sessionId &&
              seat.sessionId !== args.sessionId &&
              seat.sessionExpiry &&
              seat.sessionExpiry > now
            ) {
              throw new Error(`Seat ${seat.number} at Table ${table.number} is being selected by another user`);
            }

            // Hold the seat for this session
            return {
              ...seat,
              sessionId: args.sessionId,
              sessionExpiry,
            };
          }

          return seat;
        });

        return { ...table, seats: updatedSeats };
      });

      return { ...section, tables: updatedTables };
    });

    await ctx.db.patch(seatingChart._id, {
      sections: updatedSections,
    });

    return { success: true, expiresAt: sessionExpiry };
  },
});

/**
 * Release seats held by a session (when user deselects or session expires)
 */
export const releaseSessionHolds = mutation({
  args: {
    eventId: v.id("events"),
    sessionId: v.string(),
    seats: v.optional(v.array(v.object({
      tableId: v.string(),
      seatNumber: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!seatingChart) {
      return { success: true };
    }

    // Update the seating chart to release session holds
    const updatedSections = seatingChart.sections.map((section: any) => {
      if (!section.tables) return section;

      const updatedTables = section.tables.map((table: any) => {
        const updatedSeats = table.seats.map((seat: any) => {
          // If specific seats provided, only release those
          if (args.seats) {
            const shouldRelease = args.seats.some(
              (s) => s.tableId === table.id && s.seatNumber === seat.number
            );

            if (shouldRelease && seat.sessionId === args.sessionId) {
              const { sessionId, sessionExpiry, ...rest } = seat;
              return rest;
            }
          } else {
            // Release all seats held by this session
            if (seat.sessionId === args.sessionId) {
              const { sessionId, sessionExpiry, ...rest } = seat;
              return rest;
            }
          }

          return seat;
        });

        return { ...table, seats: updatedSeats };
      });

      return { ...section, tables: updatedTables };
    });

    await ctx.db.patch(seatingChart._id, {
      sections: updatedSections,
    });

    return { success: true };
  },
});

/**
 * Clean up expired session holds (should be run periodically)
 */
export const cleanupExpiredSessionHolds = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!seatingChart) {
      return { success: true, cleaned: 0 };
    }

    let cleanedCount = 0;

    const updatedSections = seatingChart.sections.map((section: any) => {
      if (!section.tables) return section;

      const updatedTables = section.tables.map((table: any) => {
        const updatedSeats = table.seats.map((seat: any) => {
          // Remove expired session holds
          if (seat.sessionId && seat.sessionExpiry && seat.sessionExpiry < now) {
            cleanedCount++;
            const { sessionId, sessionExpiry, ...rest } = seat;
            return rest;
          }

          return seat;
        });

        return { ...table, seats: updatedSeats };
      });

      return { ...section, tables: updatedTables };
    });

    if (cleanedCount > 0) {
      await ctx.db.patch(seatingChart._id, {
        sections: updatedSections,
      });
    }

    return { success: true, cleaned: cleanedCount };
  },
});

/**
 * Assign pricing zone to a table
 */
export const assignPricingZoneToTable = mutation({
  args: {
    eventId: v.id("events"),
    sectionId: v.string(),
    tableId: v.string(),
    pricingZone: v.optional(v.string()), // null to remove zone
  },
  handler: async (ctx, args) => {
    // Get the seating chart
    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!seatingChart) {
      throw new Error("Seating chart not found");
    }

    // Find and update the table
    const updatedSections = seatingChart.sections.map((section) => {
      if (section.id !== args.sectionId) return section;

      return {
        ...section,
        tables: section.tables?.map((table) => {
          if (table.id !== args.tableId) return table;

          return {
            ...table,
            pricingZone: args.pricingZone,
          };
        }),
      };
    });

    // Update the seating chart
    await ctx.db.patch(seatingChart._id, {
      sections: updatedSections,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Assign pricing zone to multiple tables at once
 */
export const assignPricingZoneToMultipleTables = mutation({
  args: {
    eventId: v.id("events"),
    tables: v.array(v.object({
      sectionId: v.string(),
      tableId: v.string(),
    })),
    pricingZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the seating chart
    const seatingChart = await ctx.db
      .query("seatingCharts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!seatingChart) {
      throw new Error("Seating chart not found");
    }

    // Build a map of table IDs to update
    const tableIdsToUpdate = new Set(args.tables.map(t => t.tableId));

    // Find and update all matching tables
    const updatedSections = seatingChart.sections.map((section) => {
      const needsUpdate = args.tables.some(t => t.sectionId === section.id);
      if (!needsUpdate) return section;

      return {
        ...section,
        tables: section.tables?.map((table) => {
          if (!tableIdsToUpdate.has(table.id)) return table;

          return {
            ...table,
            pricingZone: args.pricingZone,
          };
        }),
      };
    });

    // Update the seating chart
    await ctx.db.patch(seatingChart._id, {
      sections: updatedSections,
      updatedAt: Date.now(),
    });

    return { success: true, updatedCount: args.tables.length };
  },
});
