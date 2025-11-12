import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Scan and check-in a ticket
 * Used by staff scanners at event door
 */
export const scanTicket = mutation({
  args: {
    ticketCode: v.string(),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // PRODUCTION: Require authentication for ticket scanning
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. Staff must be signed in to scan tickets.");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User account not found. Please contact support.");
    }

    // Find the ticket
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_code", (q) => q.eq("ticketCode", args.ticketCode))
      .first();

    if (!ticket) {
      return {
        success: false,
        error: "TICKET_NOT_FOUND",
        message: "Ticket not found. Please check the code.",
      };
    }

    // Verify ticket is for this event
    if (ticket.eventId !== args.eventId) {
      return {
        success: false,
        error: "WRONG_EVENT",
        message: "This ticket is for a different event.",
      };
    }

    // Check ticket status
    if (ticket.status === "SCANNED") {
      return {
        success: false,
        error: "ALREADY_SCANNED",
        message: "This ticket has already been scanned.",
        ticket: {
          ticketCode: ticket.ticketCode,
          scannedAt: ticket.scannedAt,
          attendeeName: ticket.attendeeName,
        },
      };
    }

    if (ticket.status === "CANCELLED") {
      return {
        success: false,
        error: "CANCELLED",
        message: "This ticket has been cancelled.",
      };
    }

    if (ticket.status === "REFUNDED") {
      return {
        success: false,
        error: "REFUNDED",
        message: "This ticket has been refunded.",
      };
    }

    // Get ticket tier for display
    const tier = ticket.ticketTierId ? await ctx.db.get(ticket.ticketTierId) : null;

    // Mark ticket as scanned
    await ctx.db.patch(ticket._id, {
      status: "SCANNED",
      scannedAt: Date.now(),
      scannedBy: currentUser._id,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Ticket scanned successfully! Welcome!",
      ticket: {
        ticketCode: ticket.ticketCode,
        attendeeName: ticket.attendeeName || "Guest",
        attendeeEmail: ticket.attendeeEmail,
        tierName: tier?.name || "General Admission",
        scannedAt: Date.now(),
      },
    };
  },
});

/**
 * Manually mark a ticket as valid (undo scan)
 * For staff to fix mistakes
 */
export const unScanTicket = mutation({
  args: {
    ticketCode: v.string(),
  },
  handler: async (ctx, args) => {
    // PRODUCTION: Require authentication for ticket management
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. Staff must be signed in to manage tickets.");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User account not found. Please contact support.");
    }

    // Find the ticket
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_ticket_code", (q) => q.eq("ticketCode", args.ticketCode))
      .first();

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Mark ticket as valid again
    await ctx.db.patch(ticket._id, {
      status: "VALID",
      scannedAt: undefined,
      scannedBy: undefined,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Ticket unmarked. Status changed back to VALID.",
    };
  },
});
