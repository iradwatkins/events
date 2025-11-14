import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireEventOwnership } from "../lib/auth";

/**
 * Create or update consignment configuration for an event
 */
export const setupConsignment = mutation({
  args: {
    eventId: v.id("events"),
    floatedTickets: v.number(),
    settlementDueDate: v.optional(v.number()), // Default to event date
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    let event;

    // Verify ownership if authenticated (TESTING MODE: skip if no identity)
    if (identity) {
      const ownership = await requireEventOwnership(ctx, args.eventId);
      event = ownership.event;
    } else {
      console.warn("[setupConsignment] TESTING MODE - No authentication required");
      event = await ctx.db.get(args.eventId);
      if (!event) throw new Error("Event not found");
    }

    // Get or create payment config
    const paymentConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (paymentConfig) {
      // Update existing config to CONSIGNMENT
      await ctx.db.patch(paymentConfig._id, {
        paymentModel: "CONSIGNMENT",
        consignmentFloatedTickets: args.floatedTickets,
        consignmentSoldTickets: 0,
        consignmentSettlementDue: args.settlementDueDate || event.startDate,
        consignmentSettled: false,
        consignmentSettlementAmount: 0,
        updatedAt: Date.now(),
      });
    } else {
      // Create new config
      await ctx.db.insert("eventPaymentConfig", {
        eventId: args.eventId,
        organizerId: event.organizerId || ("test_organizer_id" as any),
        paymentModel: "CONSIGNMENT",
        isActive: true,
        activatedAt: Date.now(),

        // Consignment specific
        consignmentFloatedTickets: args.floatedTickets,
        consignmentSoldTickets: 0,
        consignmentSettlementDue: args.settlementDueDate || event.startDate,
        consignmentSettled: false,
        consignmentSettlementAmount: 0,

        // Default fee structure
        platformFeePercent: 3.7,
        platformFeeFixed: 179, // $1.79 in cents
        processingFeePercent: 2.9,
        charityDiscount: false,
        lowPriceDiscount: false,

        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }


    return {
      success: true,
      floatedTickets: args.floatedTickets,
      settlementDue: args.settlementDueDate || event.startDate,
    };
  },
});

/**
 * Calculate settlement amount for a consignment event
 */
export const calculateSettlement = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const paymentConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!paymentConfig || paymentConfig.paymentModel !== "CONSIGNMENT") {
      throw new Error("Event is not using consignment payment model");
    }

    // Get all sold tickets for this event
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.neq(q.field("status"), "CANCELLED"))
      .collect();

    const ticketsSold = tickets.length;

    // Calculate total revenue from sold tickets
    const ticketTiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    let totalRevenue = 0;
    for (const ticket of tickets) {
      const tier = ticketTiers.find((t) => t._id === ticket.ticketTierId);
      if (tier) {
        totalRevenue += tier.price;
      }
    }

    // Calculate platform fees
    const platformFeePercent = paymentConfig.platformFeePercent / 100;
    const platformFeeFixed = paymentConfig.platformFeeFixed * ticketsSold; // Fixed fee per ticket
    const platformFeeVariable = totalRevenue * platformFeePercent;
    const totalPlatformFee = platformFeeFixed + platformFeeVariable;

    // Settlement amount is total revenue minus platform fees
    const settlementAmount = totalRevenue - totalPlatformFee;

    return {
      eventId: args.eventId,
      floatedTickets: paymentConfig.consignmentFloatedTickets || 0,
      soldTickets: ticketsSold,
      unsoldTickets: (paymentConfig.consignmentFloatedTickets || 0) - ticketsSold,
      totalRevenue,
      platformFeeFixed,
      platformFeeVariable,
      totalPlatformFee,
      settlementAmount,
      settlementDue: paymentConfig.consignmentSettlementDue,
      isSettled: paymentConfig.consignmentSettled || false,
      settledAt: paymentConfig.consignmentSettledAt,
    };
  },
});

/**
 * Get all consignment events for an organizer
 */
export const getConsignmentEvents = query({
  args: {},
  handler: async (ctx) => {
    // TESTING MODE: Get all consignment events
    console.warn("[getConsignmentEvents] TESTING MODE - Returning all consignment events");

    const consignmentConfigs = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_payment_model", (q) => q.eq("paymentModel", "CONSIGNMENT"))
      .collect();

    const results = await Promise.all(
      consignmentConfigs.map(async (config) => {
        const event = await ctx.db.get(config.eventId);
        if (!event) return null;

        // Calculate settlement details
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_event", (q) => q.eq("eventId", config.eventId))
          .filter((q) => q.neq(q.field("status"), "CANCELLED"))
          .collect();

        const ticketsSold = tickets.length;

        // Get revenue
        const ticketTiers = await ctx.db
          .query("ticketTiers")
          .withIndex("by_event", (q) => q.eq("eventId", config.eventId))
          .collect();

        let totalRevenue = 0;
        for (const ticket of tickets) {
          const tier = ticketTiers.find((t) => t._id === ticket.ticketTierId);
          if (tier) {
            totalRevenue += tier.price;
          }
        }

        // Calculate fees
        const platformFeePercent = config.platformFeePercent / 100;
        const platformFeeFixed = config.platformFeeFixed * ticketsSold;
        const platformFeeVariable = totalRevenue * platformFeePercent;
        const totalPlatformFee = platformFeeFixed + platformFeeVariable;
        const settlementAmount = totalRevenue - totalPlatformFee;

        return {
          eventId: config.eventId,
          eventName: event.name,
          eventDate: event.startDate,
          floatedTickets: config.consignmentFloatedTickets || 0,
          soldTickets: ticketsSold,
          totalRevenue,
          settlementAmount,
          settlementDue: config.consignmentSettlementDue,
          isSettled: config.consignmentSettled || false,
          settledAt: config.consignmentSettledAt,
          paymentConfigId: config._id,
        };
      })
    );

    return results.filter((r) => r !== null);
  },
});

/**
 * Mark a consignment as settled
 */
export const settleConsignment = mutation({
  args: {
    eventId: v.id("events"),
    paymentNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[settleConsignment] TESTING MODE - No authentication required");
    }

    const paymentConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!paymentConfig) {
      throw new Error("Payment configuration not found");
    }

    if (paymentConfig.paymentModel !== "CONSIGNMENT") {
      throw new Error("Event is not using consignment payment model");
    }

    if (paymentConfig.consignmentSettled) {
      throw new Error("Consignment already settled");
    }

    // Calculate final settlement amount
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.neq(q.field("status"), "CANCELLED"))
      .collect();

    const ticketsSold = tickets.length;

    // Calculate revenue
    const ticketTiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    let totalRevenue = 0;
    for (const ticket of tickets) {
      const tier = ticketTiers.find((t) => t._id === ticket.ticketTierId);
      if (tier) {
        totalRevenue += tier.price;
      }
    }

    // Calculate fees
    const platformFeePercent = paymentConfig.platformFeePercent / 100;
    const platformFeeFixed = paymentConfig.platformFeeFixed * ticketsSold;
    const platformFeeVariable = totalRevenue * platformFeePercent;
    const totalPlatformFee = platformFeeFixed + platformFeeVariable;
    const settlementAmount = totalRevenue - totalPlatformFee;

    // Update payment config
    await ctx.db.patch(paymentConfig._id, {
      consignmentSettled: true,
      consignmentSettledAt: Date.now(),
      consignmentSettlementAmount: settlementAmount,
      consignmentSoldTickets: ticketsSold,
      consignmentNotes: args.paymentNotes,
      updatedAt: Date.now(),
    });


    return {
      success: true,
      settlementAmount,
      ticketsSold,
      totalRevenue,
      totalFees: totalPlatformFee,
    };
  },
});
