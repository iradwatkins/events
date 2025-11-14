import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a ticket bundle (single-event or multi-event)
 */
export const createTicketBundle = mutation({
  args: {
    // Bundle type
    bundleType: v.optional(v.union(v.literal("SINGLE_EVENT"), v.literal("MULTI_EVENT"))),

    // For single-event bundles (legacy support)
    eventId: v.optional(v.id("events")),

    // For multi-event bundles
    eventIds: v.optional(v.array(v.id("events"))),

    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // Bundle price in cents

    // For single-event bundles (legacy format)
    includedTiers: v.optional(
      v.array(
        v.object({
          tierId: v.id("ticketTiers"),
          tierName: v.string(),
          quantity: v.number(),
        })
      )
    ),

    // For multi-event bundles (new format with event info)
    includedTiersWithEvents: v.optional(
      v.array(
        v.object({
          tierId: v.id("ticketTiers"),
          tierName: v.string(),
          quantity: v.number(),
          eventId: v.id("events"),
          eventName: v.string(),
        })
      )
    ),

    totalQuantity: v.number(),
    saleStart: v.optional(v.number()),
    saleEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // PRODUCTION: Require authentication for creating ticket bundles
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
      throw new Error("Authentication required. Please sign in to create ticket bundles.");
    }

    // Determine bundle type (default to SINGLE_EVENT for backward compatibility)
    const bundleType = args.bundleType || "SINGLE_EVENT";

    // Validate bundle type configuration
    if (bundleType === "SINGLE_EVENT") {
      if (!args.eventId) {
        throw new Error("eventId is required for single-event bundles");
      }
      if (!args.includedTiers) {
        throw new Error("includedTiers is required for single-event bundles");
      }
    } else if (bundleType === "MULTI_EVENT") {
      if (!args.eventIds || args.eventIds.length < 2) {
        throw new Error("eventIds with at least 2 events is required for multi-event bundles");
      }
      if (!args.includedTiersWithEvents) {
        throw new Error("includedTiersWithEvents is required for multi-event bundles");
      }
    }

    // Verify event ownership
    const eventsToCheck = bundleType === "SINGLE_EVENT" ? [args.eventId!] : args.eventIds!;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User account not found. Please contact support.");
    }

    // Verify all events belong to the organizer
    for (const eventId of eventsToCheck) {
      const event = await ctx.db.get(eventId);
      if (!event) throw new Error(`Event ${eventId} not found`);
      if (event.organizerId !== user._id) {
        throw new Error(`Not authorized to create bundles for event: ${event.name}`);
      }
    }

    // Verify all events exist
    const eventsToVerify = bundleType === "SINGLE_EVENT" ? [args.eventId!] : args.eventIds!;

    for (const eventId of eventsToVerify) {
      const event = await ctx.db.get(eventId);
      if (!event) throw new Error(`Event not found: ${eventId}`);
    }

    // Verify all included tiers exist and calculate regular price
    let regularPrice = 0;
    const tiersToVerify = args.includedTiers || args.includedTiersWithEvents!;

    for (const includedTier of tiersToVerify) {
      const tier = await ctx.db.get(includedTier.tierId);
      if (!tier) {
        throw new Error(`Ticket tier ${includedTier.tierName} not found`);
      }

      // For single-event bundles, verify tier belongs to the event
      if (bundleType === "SINGLE_EVENT" && tier.eventId !== args.eventId) {
        throw new Error(`Ticket tier ${includedTier.tierName} does not belong to this event`);
      }

      // For multi-event bundles, verify tier belongs to one of the events
      if (bundleType === "MULTI_EVENT") {
        const tierWithEvent = includedTier as any;
        if (tier.eventId !== tierWithEvent.eventId) {
          throw new Error(
            `Ticket tier ${includedTier.tierName} does not belong to event ${tierWithEvent.eventName}`
          );
        }
      }

      regularPrice += tier.price * includedTier.quantity;
    }

    // Calculate savings
    const savings = regularPrice - args.price;

    // Normalize includedTiers format
    const normalizedTiers =
      bundleType === "SINGLE_EVENT"
        ? args.includedTiers!.map((tier) => ({
            tierId: tier.tierId,
            tierName: tier.tierName,
            quantity: tier.quantity,
            eventId: args.eventId,
          }))
        : args.includedTiersWithEvents!;

    // Create the bundle
    const bundleId = await ctx.db.insert("ticketBundles", {
      bundleType,
      eventId: bundleType === "SINGLE_EVENT" ? args.eventId : args.eventIds![0], // Primary event for multi-event
      eventIds: bundleType === "MULTI_EVENT" ? args.eventIds : undefined,
      name: args.name,
      description: args.description,
      price: args.price,
      includedTiers: normalizedTiers,
      totalQuantity: args.totalQuantity,
      sold: 0,
      regularPrice,
      savings,
      saleStart: args.saleStart,
      saleEnd: args.saleEnd,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return bundleId;
  },
});

/**
 * Update a ticket bundle
 */
export const updateTicketBundle = mutation({
  args: {
    bundleId: v.id("ticketBundles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    totalQuantity: v.optional(v.number()),
    saleStart: v.optional(v.number()),
    saleEnd: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) throw new Error("Bundle not found");

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[updateTicketBundle] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify event ownership
      if (!bundle.eventId) {
        throw new Error("Bundle has no primary event ID");
      }

      const event = await ctx.db.get(bundle.eventId);
      if (!event) throw new Error("Event not found");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized to update this bundle");
      }
    }

    // SAFEGUARD: Cannot reduce quantity below sold count
    if (args.totalQuantity !== undefined && args.totalQuantity < bundle.sold) {
      throw new Error(
        `Cannot reduce quantity to ${args.totalQuantity} because ${bundle.sold} bundle${bundle.sold === 1 ? " has" : "s have"} already been sold. ` +
          `Quantity must be at least ${bundle.sold}.`
      );
    }

    // SAFEGUARD: Cannot change price after bundles sold (creates pricing inconsistency)
    if (bundle.sold > 0 && args.price !== undefined && args.price !== bundle.price) {
      throw new Error(
        `Cannot change bundle price after ${bundle.sold} bundle${bundle.sold === 1 ? " has" : "s have"} been sold. ` +
          `This would create pricing inconsistency for customers who already purchased at $${(bundle.price / 100).toFixed(2)}. ` +
          `If you need different pricing, please create a new bundle.`
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.totalQuantity !== undefined) updates.totalQuantity = args.totalQuantity;
    if (args.saleStart !== undefined) updates.saleStart = args.saleStart;
    if (args.saleEnd !== undefined) updates.saleEnd = args.saleEnd;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    // If price changed, recalculate savings
    if (args.price !== undefined) {
      updates.price = args.price;
      updates.savings = bundle.regularPrice ? bundle.regularPrice - args.price : 0;
    }

    await ctx.db.patch(args.bundleId, updates);

    return { success: true };
  },
});

/**
 * Purchase a ticket bundle
 */
export const createBundlePurchase = mutation({
  args: {
    bundleId: v.id("ticketBundles"),
    quantity: v.number(),
    buyerName: v.string(),
    buyerEmail: v.string(),
    buyerPhone: v.optional(v.string()),
    paymentId: v.string(),
    paymentStatus: v.string(),
    totalPaid: v.number(),
  },
  handler: async (ctx, args) => {
    // Get bundle details
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) throw new Error("Bundle not found");

    // Check if bundle is active
    if (!bundle.isActive) {
      throw new Error("This bundle is no longer available");
    }

    // Check sale period
    const now = Date.now();
    if (bundle.saleStart && now < bundle.saleStart) {
      throw new Error("This bundle is not yet available for purchase");
    }
    if (bundle.saleEnd && now > bundle.saleEnd) {
      throw new Error("This bundle sale has ended");
    }

    // Check availability
    const available = bundle.totalQuantity - bundle.sold;
    if (available < args.quantity) {
      throw new Error(`Only ${available} bundle${available === 1 ? "" : "s"} available`);
    }

    // Update bundle sold count
    await ctx.db.patch(args.bundleId, {
      sold: bundle.sold + args.quantity,
      updatedAt: Date.now(),
    });

    // Create individual tickets for each included tier
    const ticketIds: string[] = [];

    for (let i = 0; i < args.quantity; i++) {
      for (const includedTier of bundle.includedTiers) {
        for (let j = 0; j < includedTier.quantity; j++) {
          // Get tier details
          const tier = await ctx.db.get(includedTier.tierId);
          if (!tier) continue;

          // Generate ticket code
          const ticketCode = `${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

          // Create ticket
          const ticketId = await ctx.db.insert("tickets", {
            eventId: includedTier.eventId || bundle.eventId!,
            ticketTierId: includedTier.tierId,
            bundleId: args.bundleId,
            ticketCode,
            attendeeName: args.buyerName,
            attendeeEmail: args.buyerEmail,
            status: "VALID",
            createdAt: Date.now(),
          });

          ticketIds.push(ticketId);

          // Update tier sold count
          await ctx.db.patch(includedTier.tierId, {
            sold: tier.sold + 1,
          });
        }
      }
    }

    // Create bundle purchase record
    const purchaseId = await ctx.db.insert("bundlePurchases", {
      bundleId: args.bundleId,
      quantity: args.quantity,
      buyerName: args.buyerName,
      buyerEmail: args.buyerEmail,
      buyerPhone: args.buyerPhone,
      paymentId: args.paymentId,
      paymentStatus: args.paymentStatus,
      totalPaid: args.totalPaid,
      ticketIds,
      purchaseDate: Date.now(),
      status: "COMPLETED",
    });

    // TODO: Send confirmation email with tickets
    // This would integrate with your email service

    return {
      purchaseId,
      ticketIds,
      ticketCodes: ticketIds.length,
    };
  },
});

/**
 * Delete a ticket bundle
 */
export const deleteTicketBundle = mutation({
  args: {
    bundleId: v.id("ticketBundles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) throw new Error("Bundle not found");

    // Check if any bundles have been sold
    if (bundle.sold > 0) {
      throw new Error(`Cannot delete bundle with ${bundle.sold} sold. Set to inactive instead.`);
    }

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[deleteTicketBundle] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify event ownership
      if (!bundle.eventId) {
        throw new Error("Bundle has no primary event ID");
      }

      const event = await ctx.db.get(bundle.eventId);
      if (!event) throw new Error("Event not found");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized to delete this bundle");
      }
    }

    await ctx.db.delete(args.bundleId);

    return { success: true };
  },
});
