import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

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
    referralCode: v.optional(v.string()),
    discountCodeId: v.optional(v.id("discountCodes")),
    discountAmountCents: v.optional(v.number()),
    selectedSeats: v.optional(v.array(v.object({
      sectionId: v.string(),
      sectionName: v.string(),
      rowId: v.string(),
      rowLabel: v.string(),
      seatId: v.string(),
      seatNumber: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Get or create test user
    let user;
    if (!identity) {
      console.warn("[createOrder] TESTING MODE - Using test user");
      // Try to find test user
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
        .first();

      // Create test user if doesn't exist
      if (!user) {
        const userId = await ctx.db.insert("users", {
          email: "test@stepperslife.com",
          name: "Test Organizer",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        user = await ctx.db.get(userId);
      }
    } else {
      // Production mode: Get current user
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    if (!user) throw new Error("User not found");

    // Verify event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Verify ticket tier exists
    const ticketTier = await ctx.db.get(args.ticketTierId);
    if (!ticketTier) throw new Error("Ticket tier not found");

    // Look up staff member if referral code provided
    let staffMember = null;
    if (args.referralCode && args.referralCode.length > 0) {
      staffMember = await ctx.db
        .query("eventStaff")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode!))
        .first();

      if (staffMember && !staffMember.isActive) {
        staffMember = null; // Don't count inactive staff
      }
    }

    // Verify and increment discount code usage if provided
    if (args.discountCodeId && args.discountAmountCents) {
      const discountCode = await ctx.db.get(args.discountCodeId);
      if (discountCode && discountCode.isActive) {
        // Increment usage count
        await ctx.db.patch(args.discountCodeId, {
          usedCount: discountCode.usedCount + 1,
          updatedAt: Date.now(),
        });
      }
    }

    // Validate seat selection if seating chart exists
    if (args.selectedSeats && args.selectedSeats.length > 0) {
      // Verify seats match quantity
      if (args.selectedSeats.length !== args.quantity) {
        throw new Error("Number of selected seats must match ticket quantity");
      }

      // Check if event has a seating chart
      const seatingChart = await ctx.db
        .query("seatingCharts")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .first();

      if (!seatingChart) {
        throw new Error("Seating chart not found for this event");
      }

      // Verify all seats are available (check for existing reservations)
      for (const seat of args.selectedSeats) {
        const existingReservation = await ctx.db
          .query("seatReservations")
          .withIndex("by_seat", (q) =>
            q
              .eq("seatingChartId", seatingChart._id)
              .eq("sectionId", seat.sectionId)
              .eq("rowId", seat.rowId)
              .eq("seatId", seat.seatId)
          )
          .filter((q) => q.eq(q.field("status"), "RESERVED"))
          .first();

        if (existingReservation) {
          throw new Error(`Seat ${seat.seatNumber} in ${seat.sectionName} is already reserved`);
        }
      }
    }

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
      soldByStaffId: staffMember?._id,
      referralCode: args.referralCode,
      selectedSeats: args.selectedSeats,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Track discount code usage
    if (args.discountCodeId && args.discountAmountCents) {
      await ctx.db.insert("discountCodeUsage", {
        discountCodeId: args.discountCodeId,
        orderId,
        userEmail: args.buyerEmail,
        discountAmountCents: args.discountAmountCents,
        createdAt: Date.now(),
      });
    }

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
    paymentMethod: v.union(v.literal("SQUARE"), v.literal("STRIPE"), v.literal("TEST")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // TESTING MODE: Allow test payments
    let user;
    if (!identity) {
      console.warn("[completeOrder] TESTING MODE - Using test user");
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
        .first();
    } else {
      // Production mode: Verify order belongs to current user
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || order.buyerId !== user._id) {
        throw new Error("Not authorized");
      }
    }

    if (!user) throw new Error("User not found");

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

    // Track sold count per tier
    const tierSoldCount = new Map<string, number>();

    // Get seating chart if seats were selected
    let seatingChart = null;
    if (order.selectedSeats && order.selectedSeats.length > 0) {
      seatingChart = await ctx.db
        .query("seatingCharts")
        .withIndex("by_event", (q) => q.eq("eventId", order.eventId))
        .first();
    }

    let seatIndex = 0;
    for (const item of orderItems) {
      // Generate unique ticket code
      const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const ticketId = await ctx.db.insert("tickets", {
        orderId: args.orderId,
        orderItemId: item._id,
        eventId: order.eventId,
        ticketTierId: item.ticketTierId,
        attendeeId: user._id,
        attendeeEmail: order.buyerEmail,
        attendeeName: order.buyerName,
        ticketCode,
        status: "VALID",
        soldByStaffId: order.soldByStaffId || undefined,
        paymentMethod: args.paymentMethod as "SQUARE" | "STRIPE" | "ONLINE",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Reserve seat if seating chart exists and seats were selected
      if (seatingChart && order.selectedSeats && seatIndex < order.selectedSeats.length) {
        const seat = order.selectedSeats[seatIndex];
        await ctx.db.insert("seatReservations", {
          eventId: order.eventId,
          seatingChartId: seatingChart._id,
          ticketId,
          orderId: args.orderId,
          sectionId: seat.sectionId,
          rowId: seat.rowId,
          seatId: seat.seatId,
          seatNumber: seat.seatNumber,
          status: "RESERVED",
          reservedAt: Date.now(),
        });

        seatIndex++;
      }

      // Count tickets per tier
      const currentCount = tierSoldCount.get(item.ticketTierId) || 0;
      tierSoldCount.set(item.ticketTierId, currentCount + 1);
    }

    // Update reserved seats count on seating chart if seats were reserved
    if (seatingChart && order.selectedSeats) {
      await ctx.db.patch(seatingChart._id, {
        reservedSeats: seatingChart.reservedSeats + order.selectedSeats.length,
      });
    }

    // Update sold count for each tier
    for (const [tierId, count] of tierSoldCount.entries()) {
      const tier = await ctx.db.get(tierId as Id<"ticketTiers">);
      if (tier && 'sold' in tier) {
        await ctx.db.patch(tierId as Id<"ticketTiers">, {
          sold: tier.sold + count,
          updatedAt: Date.now(),
        });
      }
    }

    // Update staff member statistics if this sale was from a referral
    if (order.soldByStaffId) {
      const staffMember = await ctx.db.get(order.soldByStaffId);
      if (staffMember) {
        const ticketCount = orderItems.length;

        // Calculate commission
        let commission = 0;
        if (staffMember.commissionType === "PERCENTAGE") {
          // Calculate percentage commission on subtotal
          commission = Math.round((order.subtotalCents * (staffMember.commissionValue || 0)) / 100);
        } else if (staffMember.commissionType === "FIXED") {
          // Fixed commission per ticket (commissionValue is already in cents)
          commission = (staffMember.commissionValue || 0) * ticketCount;
        }

        // Update staff statistics
        await ctx.db.patch(order.soldByStaffId, {
          ticketsSold: staffMember.ticketsSold + ticketCount,
          commissionEarned: staffMember.commissionEarned + commission,
          updatedAt: Date.now(),
        });

        // Create a staff sale record for tracking
        await ctx.db.insert("staffSales", {
          staffId: order.soldByStaffId,
          staffUserId: staffMember.staffUserId,
          eventId: order.eventId,
          orderId: args.orderId,
          ticketCount,
          commissionAmount: commission,
          paymentMethod: args.paymentMethod as "SQUARE" | "STRIPE" | "ONLINE",
          createdAt: Date.now(),
        });
      }
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

/**
 * Register for a free event
 * Creates a free ticket for the attendee
 */
export const registerFreeEvent = mutation({
  args: {
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify event exists and is a FREE_EVENT
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.eventType !== "FREE_EVENT") {
      throw new Error("This event is not a free event. Please use the checkout flow.");
    }

    // Get or create user
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.attendeeEmail))
      .first();

    if (!user) {
      // Create a basic user account for this attendee
      const userId = await ctx.db.insert("users", {
        email: args.attendeeEmail,
        name: args.attendeeName,
        role: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Failed to create user account");
    }

    // Look up staff member if referral code provided
    let staffMember = null;
    if (args.referralCode && args.referralCode.length > 0) {
      staffMember = await ctx.db
        .query("eventStaff")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode!))
        .first();

      if (staffMember && !staffMember.isActive) {
        staffMember = null; // Don't count inactive staff
      }
    }

    // Create a free order (completed immediately)
    const orderId = await ctx.db.insert("orders", {
      eventId: args.eventId,
      buyerId: user._id,
      buyerName: args.attendeeName,
      buyerEmail: args.attendeeEmail,
      status: "COMPLETED",
      subtotalCents: 0,
      platformFeeCents: 0,
      processingFeeCents: 0,
      totalCents: 0,
      paymentMethod: "TEST", // Free registration
      paidAt: Date.now(),
      soldByStaffId: staffMember?._id,
      referralCode: args.referralCode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Generate ticket with QR code
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const ticketId = await ctx.db.insert("tickets", {
      orderId,
      eventId: args.eventId,
      attendeeId: user._id,
      attendeeEmail: args.attendeeEmail,
      attendeeName: args.attendeeName,
      ticketCode,
      status: "VALID",
      soldByStaffId: staffMember?._id,
      paymentMethod: "ONLINE", // Free but registered online
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update staff statistics if referred
    if (staffMember) {
      await ctx.db.patch(staffMember._id, {
        ticketsSold: staffMember.ticketsSold + 1,
        updatedAt: Date.now(),
      });

      // Create staff sale record (with $0 commission)
      await ctx.db.insert("staffSales", {
        staffId: staffMember._id,
        staffUserId: staffMember.staffUserId,
        eventId: args.eventId,
        orderId,
        ticketCount: 1,
        commissionAmount: 0, // No commission for free events
        paymentMethod: "ONLINE",
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      orderId,
      ticketId,
      ticketCode,
    };
  },
});

/**
 * Cancel a ticket and release its seat
 */
export const cancelTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    // Verify user owns this ticket
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || ticket.attendeeId !== user._id) {
      throw new Error("Not authorized");
    }

    // Can't cancel already scanned tickets
    if (ticket.scannedAt) {
      throw new Error("Cannot cancel a ticket that has been scanned");
    }

    // Update ticket status
    await ctx.db.patch(args.ticketId, {
      status: "CANCELLED",
      updatedAt: Date.now(),
    });

    // Release seat if exists
    const seatReservation = await ctx.db
      .query("seatReservations")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .filter((q) => q.eq(q.field("status"), "RESERVED"))
      .first();

    if (seatReservation) {
      await ctx.db.patch(seatReservation._id, {
        status: "RELEASED",
        releasedAt: Date.now(),
      });

      // Update seating chart reserved count
      const seatingChart = await ctx.db.get(seatReservation.seatingChartId);
      if (seatingChart) {
        await ctx.db.patch(seatingChart._id, {
          reservedSeats: Math.max(0, seatingChart.reservedSeats - 1),
        });
      }
    }

    // Decrement sold count for tier
    if (ticket.ticketTierId) {
      const tier = await ctx.db.get(ticket.ticketTierId);
      if (tier) {
        await ctx.db.patch(ticket.ticketTierId, {
          sold: Math.max(0, tier.sold - 1),
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});
