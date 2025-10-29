import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Constants
const FIRST_EVENT_FREE_TICKETS = 10000; // First 10,000 tickets are FREE!
const PRICE_PER_TICKET_CENTS = 30; // $0.30 per ticket

/**
 * Initialize credit balance for new organizer
 */
export const initializeCredits = mutation({
  args: {
    organizerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if credits already exist
    const existing = await ctx.db
      .query("organizerCredits")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new credit account with first event free tickets
    const creditId = await ctx.db.insert("organizerCredits", {
      organizerId: args.organizerId,
      creditsTotal: FIRST_EVENT_FREE_TICKETS,
      creditsUsed: 0,
      creditsRemaining: FIRST_EVENT_FREE_TICKETS,
      firstEventFreeUsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return creditId;
  },
});

/**
 * Purchase additional ticket credits
 */
export const purchaseCredits = mutation({
  args: {
    organizerId: v.id("users"),
    ticketQuantity: v.number(),
    stripePaymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify user matches organizer
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || user._id !== args.organizerId) {
      throw new Error("Not authorized");
    }

    // Calculate amount
    const amountPaid = args.ticketQuantity * PRICE_PER_TICKET_CENTS;

    // Create transaction record
    const transactionId = await ctx.db.insert("creditTransactions", {
      organizerId: args.organizerId,
      ticketsPurchased: args.ticketQuantity,
      amountPaid,
      pricePerTicket: PRICE_PER_TICKET_CENTS,
      stripePaymentIntentId: args.stripePaymentIntentId,
      status: "PENDING",
      purchasedAt: Date.now(),
    });

    return { transactionId, amountPaid };
  },
});

/**
 * Confirm credit purchase after Stripe webhook
 */
export const confirmCreditPurchase = mutation({
  args: {
    stripePaymentIntentId: v.string(),
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

    // Get or create credit balance
    let credits = await ctx.db
      .query("organizerCredits")
      .withIndex("by_organizer", (q) => q.eq("organizerId", transaction.organizerId))
      .first();

    if (!credits) {
      // Initialize if doesn't exist
      const creditId = await ctx.db.insert("organizerCredits", {
        organizerId: transaction.organizerId,
        creditsTotal: transaction.ticketsPurchased,
        creditsUsed: 0,
        creditsRemaining: transaction.ticketsPurchased,
        firstEventFreeUsed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { success: true, creditId };
    }

    // Add purchased credits to balance
    await ctx.db.patch(credits._id, {
      creditsTotal: credits.creditsTotal + transaction.ticketsPurchased,
      creditsRemaining: credits.creditsRemaining + transaction.ticketsPurchased,
      updatedAt: Date.now(),
    });

    return { success: true, creditId: credits._id };
  },
});

/**
 * Use credits when ticket is sold (called from order completion)
 */
export const useCredits = mutation({
  args: {
    organizerId: v.id("users"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("organizerCredits")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .first();

    if (!credits) {
      throw new Error("No credit balance found");
    }

    if (credits.creditsRemaining < args.quantity) {
      throw new Error(`Insufficient credits. Available: ${credits.creditsRemaining}, Needed: ${args.quantity}`);
    }

    // Deduct credits
    await ctx.db.patch(credits._id, {
      creditsUsed: credits.creditsUsed + args.quantity,
      creditsRemaining: credits.creditsRemaining - args.quantity,
      updatedAt: Date.now(),
    });

    return { success: true, remaining: credits.creditsRemaining - args.quantity };
  },
});

/**
 * Mark first event free tickets as used
 */
export const markFirstEventUsed = mutation({
  args: {
    organizerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("organizerCredits")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .first();

    if (!credits) {
      throw new Error("No credit balance found");
    }

    await ctx.db.patch(credits._id, {
      firstEventFreeUsed: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
