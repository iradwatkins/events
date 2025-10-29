import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all bundles for an event
 */
export const getBundlesForEvent = query({
  args: {
    eventId: v.id("events"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const bundles = await ctx.db
      .query("ticketBundles")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Filter by active status if requested
    const filteredBundles = args.includeInactive
      ? bundles
      : bundles.filter((b) => b.isActive);

    // Enrich with tier information
    const enrichedBundles = await Promise.all(
      filteredBundles.map(async (bundle) => {
        // Get full tier details for each included tier
        const tierDetails = await Promise.all(
          bundle.includedTiers.map(async (includedTier) => {
            const tier = await ctx.db.get(includedTier.tierId);
            return {
              ...includedTier,
              tierDetails: tier ? {
                name: tier.name,
                description: tier.description,
                price: tier.price,
                available: tier.quantity - tier.sold,
              } : null,
            };
          })
        );

        // Calculate availability based on included tier availability
        const maxAvailable = Math.min(
          bundle.totalQuantity - bundle.sold,
          ...tierDetails.map((td) =>
            td.tierDetails ? Math.floor(td.tierDetails.available / td.quantity) : 0
          )
        );

        return {
          ...bundle,
          includedTiersDetails: tierDetails,
          available: maxAvailable,
          percentageSavings: bundle.regularPrice && bundle.regularPrice > 0
            ? Math.round((bundle.savings! / bundle.regularPrice) * 100)
            : 0,
        };
      })
    );

    return enrichedBundles;
  },
});

/**
 * Get bundle details by ID
 */
export const getBundleDetails = query({
  args: {
    bundleId: v.id("ticketBundles"),
  },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) return null;

    // Get full tier details for each included tier
    const tierDetails = await Promise.all(
      bundle.includedTiers.map(async (includedTier) => {
        const tier = await ctx.db.get(includedTier.tierId);
        return {
          ...includedTier,
          tierDetails: tier ? {
            name: tier.name,
            description: tier.description,
            price: tier.price,
            quantity: tier.quantity,
            sold: tier.sold,
            available: tier.quantity - tier.sold,
          } : null,
        };
      })
    );

    // Calculate availability
    const maxAvailable = Math.min(
      bundle.totalQuantity - bundle.sold,
      ...tierDetails.map((td) =>
        td.tierDetails ? Math.floor(td.tierDetails.available / td.quantity) : 0
      )
    );

    return {
      ...bundle,
      includedTiersDetails: tierDetails,
      available: maxAvailable,
      percentageSavings: bundle.regularPrice && bundle.regularPrice > 0
        ? Math.round((bundle.savings! / bundle.regularPrice) * 100)
        : 0,
    };
  },
});

/**
 * Check if bundle is available for purchase
 */
export const isBundleAvailable = query({
  args: {
    bundleId: v.id("ticketBundles"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle) {
      return {
        available: false,
        reason: "Bundle not found",
      };
    }

    // Check if bundle is active
    if (!bundle.isActive) {
      return {
        available: false,
        reason: "Bundle is no longer active",
      };
    }

    // Check sale period
    const now = Date.now();
    if (bundle.saleStart && now < bundle.saleStart) {
      return {
        available: false,
        reason: "Bundle sales have not started yet",
        saleStartsAt: bundle.saleStart,
      };
    }
    if (bundle.saleEnd && now > bundle.saleEnd) {
      return {
        available: false,
        reason: "Bundle sales have ended",
      };
    }

    // Check bundle quantity
    const bundlesLeft = bundle.totalQuantity - bundle.sold;
    if (bundlesLeft < args.quantity) {
      return {
        available: false,
        reason: `Only ${bundlesLeft} bundle${bundlesLeft === 1 ? '' : 's'} remaining`,
        maxQuantity: bundlesLeft,
      };
    }

    // Check each included tier availability
    for (const includedTier of bundle.includedTiers) {
      const tier = await ctx.db.get(includedTier.tierId);
      if (!tier) {
        return {
          available: false,
          reason: `Ticket tier ${includedTier.tierName} not found`,
        };
      }

      const tiersNeeded = includedTier.quantity * args.quantity;
      const tiersAvailable = tier.quantity - tier.sold;

      if (tiersAvailable < tiersNeeded) {
        return {
          available: false,
          reason: `Not enough ${includedTier.tierName} tickets available`,
          tierName: includedTier.tierName,
          needed: tiersNeeded,
          tiersAvailable: tiersAvailable,
        };
      }
    }

    return {
      available: true,
    };
  },
});

/**
 * Get all multi-event bundles for an organizer
 */
export const getMultiEventBundles = query({
  args: {
    organizerId: v.id("users"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get all events by this organizer
    const organizerEvents = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("organizerId"), args.organizerId))
      .collect();

    const eventIds = organizerEvents.map((e) => e._id);

    // Get all bundles
    const allBundles = await ctx.db
      .query("ticketBundles")
      .collect();

    // Filter to multi-event bundles owned by this organizer
    const multiEventBundles = allBundles.filter((bundle) => {
      // Must be multi-event type
      if (bundle.bundleType !== "MULTI_EVENT") return false;

      // Filter by active status if requested
      if (!args.includeInactive && !bundle.isActive) return false;

      // Check if any of the bundle's events belong to this organizer
      if (bundle.eventIds && bundle.eventIds.length > 0) {
        return bundle.eventIds.some((eid) => eventIds.includes(eid));
      }

      return false;
    });

    // Enrich with event and tier information
    const enrichedBundles = await Promise.all(
      multiEventBundles.map(async (bundle) => {
        // Get event details
        const eventDetails = await Promise.all(
          (bundle.eventIds || []).map(async (eventId) => {
            const event = await ctx.db.get(eventId);
            return event
              ? {
                  _id: event._id,
                  name: event.name,
                  startDate: event.startDate,
                  imageUrl: event.imageUrl,
                }
              : null;
          })
        );

        // Get tier details
        const tierDetails = await Promise.all(
          bundle.includedTiers.map(async (includedTier) => {
            const tier = await ctx.db.get(includedTier.tierId);
            return {
              ...includedTier,
              tierDetails: tier
                ? {
                    name: tier.name,
                    description: tier.description,
                    price: tier.price,
                    available: tier.quantity - tier.sold,
                  }
                : null,
            };
          })
        );

        // Calculate availability
        const maxAvailable = Math.min(
          bundle.totalQuantity - bundle.sold,
          ...tierDetails.map((td) =>
            td.tierDetails ? Math.floor(td.tierDetails.available / td.quantity) : 0
          )
        );

        return {
          ...bundle,
          events: eventDetails.filter((e) => e !== null),
          includedTiersDetails: tierDetails,
          available: maxAvailable,
          percentageSavings:
            bundle.regularPrice && bundle.regularPrice > 0
              ? Math.round((bundle.savings! / bundle.regularPrice) * 100)
              : 0,
        };
      })
    );

    return enrichedBundles;
  },
});

/**
 * Get all bundles (single and multi-event) for public display
 */
export const getAllActiveBundles = query({
  args: {},
  handler: async (ctx) => {
    const allBundles = await ctx.db
      .query("ticketBundles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Check sale periods and enrich
    const now = Date.now();
    const enrichedBundles = await Promise.all(
      allBundles.map(async (bundle) => {
        // Check if currently on sale
        const onSale =
          (!bundle.saleStart || now >= bundle.saleStart) &&
          (!bundle.saleEnd || now <= bundle.saleEnd);

        if (!onSale) return null;

        // Get event details
        const eventIds =
          bundle.bundleType === "MULTI_EVENT" && bundle.eventIds
            ? bundle.eventIds
            : [bundle.eventId!];

        const eventDetails = await Promise.all(
          eventIds.map(async (eventId) => {
            const event = await ctx.db.get(eventId);
            return event
              ? {
                  _id: event._id,
                  name: event.name,
                  startDate: event.startDate,
                  imageUrl: event.imageUrl,
                  location: event.location,
                }
              : null;
          })
        );

        // Get tier details
        const tierDetails = await Promise.all(
          bundle.includedTiers.map(async (includedTier) => {
            const tier = await ctx.db.get(includedTier.tierId);
            return {
              ...includedTier,
              tierDetails: tier
                ? {
                    name: tier.name,
                    description: tier.description,
                    price: tier.price,
                    available: tier.quantity - tier.sold,
                  }
                : null,
            };
          })
        );

        // Calculate availability
        const maxAvailable = Math.min(
          bundle.totalQuantity - bundle.sold,
          ...tierDetails.map((td) =>
            td.tierDetails ? Math.floor(td.tierDetails.available / td.quantity) : 0
          )
        );

        return {
          ...bundle,
          events: eventDetails.filter((e) => e !== null),
          includedTiersDetails: tierDetails,
          available: maxAvailable,
          percentageSavings:
            bundle.regularPrice && bundle.regularPrice > 0
              ? Math.round((bundle.savings! / bundle.regularPrice) * 100)
              : 0,
        };
      })
    );

    return enrichedBundles.filter((b) => b !== null && b.available > 0);
  },
});
