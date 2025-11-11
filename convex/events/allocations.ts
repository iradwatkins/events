import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// Constants
const FIRST_EVENT_FREE_TICKETS = 300; // First event gets 300 FREE tickets
const PRICE_PER_TICKET_CENTS = 30; // $0.30 per ticket for subsequent events

/**
 * Allocate tickets to an event
 * - First event: Automatically gets 300 FREE tickets
 * - Subsequent events: Requires prepaid purchase
 */
export const allocateEventTickets = mutation({
  args: {
    eventId: v.id("events"),
    ticketQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get event
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Check if this is the organizer's first event
    const allOrganizerEvents = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .collect();

    const isFirstEvent = allOrganizerEvents.length === 1 && allOrganizerEvents[0]._id === args.eventId;

    // Check if allocation already exists
    const existingConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existingConfig && existingConfig.ticketsAllocated) {
      throw new Error(
        `This event already has ${existingConfig.ticketsAllocated} tickets allocated. ` +
        `Use the ticket management interface to adjust quantities.`
      );
    }

    // First event: FREE 1,000 tickets
    if (isFirstEvent) {
      if (args.ticketQuantity > FIRST_EVENT_FREE_TICKETS) {
        throw new Error(
          `Your first event gets ${FIRST_EVENT_FREE_TICKETS} FREE tickets (risk-free trial). ` +
          `You requested ${args.ticketQuantity} tickets. Please reduce your quantity or ` +
          `purchase additional tickets at $${(PRICE_PER_TICKET_CENTS / 100).toFixed(2)} each.`
        );
      }

      // Create or update payment config with free allocation
      if (existingConfig) {
        await ctx.db.patch(existingConfig._id, {
          ticketsAllocated: args.ticketQuantity,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("eventPaymentConfig", {
          eventId: args.eventId,
          organizerId: user._id,
          paymentModel: "PREPAY", // First event uses prepay model
          ticketsAllocated: args.ticketQuantity,
          isActive: true,
          activatedAt: Date.now(),
          platformFeePercent: 0, // Free for first event
          platformFeeFixed: 0,
          processingFeePercent: 0,
          charityDiscount: false,
          lowPriceDiscount: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Update organizer credits to mark first event as used
      const credits = await ctx.db
        .query("organizerCredits")
        .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
        .first();

      if (credits) {
        await ctx.db.patch(credits._id, {
          firstEventFreeUsed: true,
          updatedAt: Date.now(),
        });
      } else {
        // Create credit record
        await ctx.db.insert("organizerCredits", {
          organizerId: user._id,
          creditsTotal: FIRST_EVENT_FREE_TICKETS,
          creditsUsed: 0,
          creditsRemaining: FIRST_EVENT_FREE_TICKETS,
          firstEventFreeUsed: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return {
        success: true,
        allocated: args.ticketQuantity,
        isFree: true,
        isFirstEvent: true,
        message: `Congratulations! Your first event received ${args.ticketQuantity} FREE tickets. Try our service risk-free!`,
      };
    }

    // Subsequent events: MUST prepay
    throw new Error(
      `This is not your first event. You must prepay for tickets at $${(PRICE_PER_TICKET_CENTS / 100).toFixed(2)} each. ` +
      `Please visit the Credits page to purchase tickets for this event.`
    );
  },
});

/**
 * Get ticket allocation for a specific event
 */
export const getEventAllocation = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!config || !config.ticketsAllocated) {
      return {
        allocated: 0,
        used: 0,
        remaining: 0,
        hasAllocation: false,
      };
    }

    // Calculate tickets used by counting all ticket tiers for this event
    const tiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const totalAllocated = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
    const totalSold = tiers.reduce((sum, tier) => sum + tier.sold, 0);

    return {
      allocated: config.ticketsAllocated,
      used: totalAllocated,
      remaining: config.ticketsAllocated - totalAllocated,
      sold: totalSold,
      hasAllocation: true,
    };
  },
});

/**
 * Get all event allocations for an organizer
 */
export const getOrganizerAllocations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    // Get all events for this organizer
    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .collect();

    // Get allocation for each event
    const allocations = await Promise.all(
      events.map(async (event) => {
        const config = await ctx.db
          .query("eventPaymentConfig")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .first();

        if (!config || !config.ticketsAllocated) {
          return {
            eventId: event._id,
            eventName: event.name,
            allocated: 0,
            used: 0,
            remaining: 0,
            hasAllocation: false,
          };
        }

        // Count tickets created for this event
        const tiers = await ctx.db
          .query("ticketTiers")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        const totalAllocated = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
        const totalSold = tiers.reduce((sum, tier) => sum + tier.sold, 0);

        return {
          eventId: event._id,
          eventName: event.name,
          allocated: config.ticketsAllocated,
          used: totalAllocated,
          remaining: config.ticketsAllocated - totalAllocated,
          sold: totalSold,
          hasAllocation: true,
        };
      })
    );

    return allocations;
  },
});

/**
 * Check if organizer has used their first event free tickets
 */
export const hasUsedFirstEventFree = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return true; // Assume used if not logged in

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return true;

    const credits = await ctx.db
      .query("organizerCredits")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .first();

    return credits?.firstEventFreeUsed ?? false;
  },
});

/**
 * Purchase prepaid tickets for an event (subsequent events after first)
 */
export const purchaseEventTickets = mutation({
  args: {
    eventId: v.id("events"),
    ticketQuantity: v.number(),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Calculate cost
    const totalCostCents = args.ticketQuantity * PRICE_PER_TICKET_CENTS;

    // Create transaction record
    const transactionId = await ctx.db.insert("creditTransactions", {
      organizerId: user._id,
      ticketsPurchased: args.ticketQuantity,
      amountPaid: totalCostCents,
      pricePerTicket: PRICE_PER_TICKET_CENTS,
      stripePaymentIntentId: args.stripePaymentIntentId,
      status: "PENDING",
      purchasedAt: Date.now(),
    });

    return {
      success: true,
      transactionId,
      amountPaid: totalCostCents,
      ticketQuantity: args.ticketQuantity,
      eventId: args.eventId,
    };
  },
});

/**
 * Confirm prepaid ticket purchase after Stripe payment succeeds
 * Allocates purchased tickets to the specific event
 */
export const confirmEventTicketPurchase = mutation({
  args: {
    stripePaymentIntentId: v.string(),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Find transaction
    const transaction = await ctx.db
      .query("creditTransactions")
      .filter((q) => q.eq(q.field("stripePaymentIntentId"), args.stripePaymentIntentId))
      .first();

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status === "COMPLETED") {
      return { success: true, message: "Already completed" };
    }

    // Update transaction status
    await ctx.db.patch(transaction._id, {
      status: "COMPLETED",
    });

    // Get or create event payment config
    let config = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (!config) {
      // Create new config with purchased allocation
      const configId = await ctx.db.insert("eventPaymentConfig", {
        eventId: args.eventId,
        organizerId: transaction.organizerId,
        paymentModel: "PREPAY",
        ticketsAllocated: transaction.ticketsPurchased,
        isActive: true,
        activatedAt: Date.now(),
        platformFeePercent: 0,
        platformFeeFixed: 0,
        processingFeePercent: 0,
        charityDiscount: false,
        lowPriceDiscount: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        configId,
        allocated: transaction.ticketsPurchased,
      };
    }

    // Add to existing allocation
    const newAllocation = (config.ticketsAllocated || 0) + transaction.ticketsPurchased;
    await ctx.db.patch(config._id, {
      ticketsAllocated: newAllocation,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      configId: config._id,
      allocated: newAllocation,
    };
  },
});
