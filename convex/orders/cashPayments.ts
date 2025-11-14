/**
 * Cash Payment System for In-Person Ticket Sales
 *
 * Flow:
 * 1. Customer selects "Pay Cash In-Person" at checkout
 * 2. Order created with PENDING_CASH_PAYMENT status + 30-min hold
 * 3. Seller receives push notification
 * 4. Seller approves payment OR generates activation code
 * 5. Order completes OR expires after 30 minutes
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { api } from "../_generated/api";

const CASH_HOLD_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Helper: Generate 4-digit activation code
 */
function generateActivationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Helper: Generate order confirmation number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CASH-${timestamp}-${random}`;
}

/**
 * Create a cash payment order (from checkout page)
 * Customer selects "Pay Cash In-Person" option
 */
export const createCashOrder = mutation({
  args: {
    eventId: v.id("events"),
    buyerName: v.string(),
    buyerPhone: v.string(), // Phone required, email optional for cash orders
    buyerEmail: v.optional(v.string()),
    tickets: v.array(
      v.object({
        tierId: v.id("ticketTiers"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const holdExpiresAt = now + CASH_HOLD_DURATION;


    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Calculate totals
    let subtotalCents = 0;
    const ticketDetails = [];

    for (const ticketRequest of args.tickets) {
      const tier = await ctx.db.get(ticketRequest.tierId);
      if (!tier) {
        throw new Error(`Ticket tier ${ticketRequest.tierId} not found`);
      }

      const tierTotal = tier.price * ticketRequest.quantity;
      subtotalCents += tierTotal;

      ticketDetails.push({
        tierId: ticketRequest.tierId,
        tierName: tier.name,
        quantity: ticketRequest.quantity,
        price: tier.price,
      });
    }

    // For cash orders, no platform or processing fees
    const platformFeeCents = 0;
    const processingFeeCents = 0;
    const totalCents = subtotalCents;

    // Create temporary/anonymous user for cash orders (no email required)
    const buyerId = await ctx.db.insert("users", {
      name: args.buyerName,
      email: args.buyerEmail || `cash-${now}@temp.local`,
      role: "user",
      createdAt: now,
      updatedAt: now,
    });

    // Create order with PENDING_CASH_PAYMENT status
    const orderNumber = generateOrderNumber();
    const orderId = await ctx.db.insert("orders", {
      eventId: args.eventId,
      buyerId,
      buyerName: args.buyerName,
      buyerEmail: args.buyerEmail || "",
      buyerPhone: args.buyerPhone,
      status: "PENDING_CASH_PAYMENT",
      subtotalCents,
      platformFeeCents,
      processingFeeCents,
      totalCents,
      paymentMethod: "CASH",
      holdExpiresAt,
      createdAt: now,
      updatedAt: now,
    });


    // Create ticket placeholders (not activated yet)
    const ticketIds = [];
    for (const detail of ticketDetails) {
      for (let i = 0; i < detail.quantity; i++) {
        const ticketCode =
          `CASH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`.toUpperCase();

        const ticketId = await ctx.db.insert("tickets", {
          eventId: args.eventId,
          orderId,
          ticketTierId: detail.tierId,
          attendeeId: buyerId,
          attendeeName: args.buyerName,
          attendeeEmail: args.buyerEmail || "",
          attendeePhone: args.buyerPhone,
          ticketCode,
          status: "PENDING", // Pending until cash payment approved
          price: detail.price,
          createdAt: now,
          updatedAt: now,
        });

        ticketIds.push(ticketId);
      }
    }

    // Send push notification to sellers
    await ctx.scheduler.runAfter(0, api.notifications.pushNotifications.notifyNewCashOrder, {
      orderId,
      eventId: args.eventId,
      buyerName: args.buyerName,
      totalCents,
    });

    return {
      orderId,
      orderNumber,
      totalCents,
      holdExpiresAt,
      ticketIds,
      message: `Your tickets are on hold for 30 minutes. Complete payment with the seller. Order #: ${orderNumber}`,
    };
  },
});

/**
 * Approve a cash payment (seller manually approves)
 * Instantly completes the order
 */
export const approveCashOrder = mutation({
  args: {
    orderId: v.id("orders"),
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();


    // Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Verify order status
    if (order.status !== "PENDING_CASH_PAYMENT") {
      throw new Error(`Cannot approve order with status: ${order.status}`);
    }

    // Check if expired
    if (order.holdExpiresAt && order.holdExpiresAt < now) {
      throw new Error("Order has expired");
    }

    // Get staff
    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // Verify staff has cash acceptance enabled
    if (!staff.acceptCashInPerson) {
      throw new Error("Staff member is not authorized to accept cash payments");
    }

    // Update order to COMPLETED
    await ctx.db.patch(args.orderId, {
      status: "COMPLETED",
      paidAt: now,
      approvedByStaffId: args.staffId,
      approvedAt: now,
      soldByStaffId: args.staffId, // Track who made the sale
      updatedAt: now,
    });

    // Activate all tickets
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    for (const ticket of tickets) {
      await ctx.db.patch(ticket._id, {
        status: "ACTIVE",
        soldByStaffId: args.staffId,
        updatedAt: now,
      });
    }

    // Update staff sales tracking
    const ticketCount = tickets.length;
    await ctx.db.patch(args.staffId, {
      ticketsSold: staff.ticketsSold + ticketCount,
      cashCollected: (staff.cashCollected || 0) + order.totalCents,
      updatedAt: now,
    });

    // Calculate commission
    let commission = 0;
    if (staff.commissionType === "PERCENTAGE" && staff.commissionValue) {
      commission = Math.round((order.subtotalCents * staff.commissionValue) / 100);
    } else if (staff.commissionType === "FIXED" && staff.commissionValue) {
      commission = staff.commissionValue * ticketCount;
    }

    // Update commission earned
    if (commission > 0) {
      await ctx.db.patch(args.staffId, {
        commissionEarned: staff.commissionEarned + commission,
      });

      // Update order with commission
      await ctx.db.patch(args.orderId, {
        staffCommission: commission,
      });
    }

    // Record staff sale
    await ctx.db.insert("staffSales", {
      orderId: args.orderId,
      eventId: order.eventId,
      staffId: args.staffId,
      staffUserId: staff.staffUserId,
      ticketCount,
      commissionAmount: commission,
      paymentMethod: "CASH",
      createdAt: now,
    });


    return {
      success: true,
      orderId: args.orderId,
      ticketsActivated: ticketCount,
      commission,
    };
  },
});

/**
 * Generate activation code for cash order
 * Seller generates code, gives to customer, customer activates
 */
export const generateCashActivationCode = mutation({
  args: {
    orderId: v.id("orders"),
    staffId: v.id("eventStaff"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();


    // Get order
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Verify order status
    if (order.status !== "PENDING_CASH_PAYMENT") {
      throw new Error(`Cannot generate code for order with status: ${order.status}`);
    }

    // Check if expired
    if (order.holdExpiresAt && order.holdExpiresAt < now) {
      throw new Error("Order has expired");
    }

    // Get staff
    const staff = await ctx.db.get(args.staffId);
    if (!staff) {
      throw new Error("Staff member not found");
    }

    // Verify staff has cash acceptance enabled
    if (!staff.acceptCashInPerson) {
      throw new Error("Staff member is not authorized to accept cash payments");
    }

    // Generate 4-digit activation code
    const activationCode = generateActivationCode();

    // Update all tickets with activation code
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    for (const ticket of tickets) {
      await ctx.db.patch(ticket._id, {
        activationCode,
        soldByStaffId: args.staffId,
        updatedAt: now,
      });
    }

    // Mark order as having code generated (but still pending activation)
    await ctx.db.patch(args.orderId, {
      soldByStaffId: args.staffId,
      updatedAt: now,
    });


    return {
      success: true,
      activationCode,
      ticketCount: tickets.length,
      orderId: args.orderId,
    };
  },
});

/**
 * Get pending cash orders for a staff member or event
 */
export const getPendingCashOrders = query({
  args: {
    eventId: v.optional(v.id("events")),
    staffId: v.optional(v.id("eventStaff")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let orders;

    if (args.eventId) {
      // Get all pending cash orders for event
      orders = await ctx.db
        .query("orders")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId!))
        .filter((q) => q.eq(q.field("status"), "PENDING_CASH_PAYMENT"))
        .collect();
    } else {
      // Get all pending cash orders (admin view)
      const allOrders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", "PENDING_CASH_PAYMENT"))
        .collect();
      orders = allOrders;
    }

    // Enrich with ticket details and time remaining
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        const timeRemaining = order.holdExpiresAt ? order.holdExpiresAt - now : 0;
        const isExpired = timeRemaining <= 0;

        return {
          ...order,
          ticketCount: tickets.length,
          timeRemaining,
          isExpired,
          expiresIn: Math.floor(timeRemaining / 1000 / 60), // minutes
        };
      })
    );

    // Filter out expired (will be handled by cron job)
    const active = enriched.filter((o) => !o.isExpired);

    // Sort by time remaining (soonest to expire first)
    active.sort((a, b) => a.timeRemaining - b.timeRemaining);

    return active;
  },
});

/**
 * Get expired cash orders for a staff member or event
 */
export const getExpiredCashOrders = query({
  args: {
    eventId: v.id("events"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "EXPIRED"))
      .order("desc")
      .take(args.limit || 50);

    // Enrich with ticket details
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();

        return {
          ...order,
          ticketCount: tickets.length,
        };
      })
    );

    return enriched;
  },
});
