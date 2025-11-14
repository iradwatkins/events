import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all published events (public API for stepperslife.com)
 * By default, excludes past events
 */
export const getPublishedEvents = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    includePast: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const eventsQuery = ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .order("desc");

    let events = await eventsQuery.collect();

    // Filter out past events by default (unless includePast is true)
    if (!args.includePast) {
      events = events.filter((e) => {
        // Use endDate if available, otherwise use startDate
        const eventDate = e.endDate || e.startDate;
        return eventDate && eventDate >= now;
      });
    }

    // Filter by category if specified
    if (args.category) {
      events = events.filter((e) => e.categories?.includes(args.category!));
    }

    // Filter by search term if specified
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower) ||
          (e.location &&
            typeof e.location === "object" &&
            e.location.city &&
            e.location.city.toLowerCase().includes(searchLower))
      );
    }

    // Sort by date in chronological order (oldest to newest)
    events.sort((a, b) => {
      const aDate = a.startDate || 0;
      const bDate = b.startDate || 0;
      return aDate - bDate; // Ascending order (oldest first)
    });

    // Limit results
    if (args.limit) {
      events = events.slice(0, args.limit);
    }

    // Convert storage IDs to URLs for images
    const eventsWithImageUrls = await Promise.all(
      events.map(async (event) => {
        let imageUrl = event.imageUrl;

        // If no imageUrl but has images array with storage IDs
        if (!imageUrl && event.images && event.images.length > 0) {
          const url = await ctx.storage.getUrl(event.images[0]);
          imageUrl = url ?? undefined;
        }

        return {
          ...event,
          imageUrl,
        };
      })
    );

    return eventsWithImageUrls;
  },
});

/**
 * Get upcoming published events (for homepage feed)
 */
export const getUpcomingEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const events = await ctx.db
      .query("events")
      .withIndex("by_published", (q) => q.eq("status", "PUBLISHED"))
      .filter((q) => q.gte(q.field("startDate"), now))
      .order("asc")
      .take(args.limit || 20);

    return events;
  },
});

/**
 * Get past published events (events that have already occurred)
 */
export const getPastEvents = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const eventsQuery = ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .order("desc");

    let events = await eventsQuery.collect();

    // Only show past events (where endDate or startDate < now)
    events = events.filter((e) => {
      const eventDate = e.endDate || e.startDate;
      return eventDate && eventDate < now;
    });

    // Filter by category if specified
    if (args.category) {
      events = events.filter((e) => e.categories?.includes(args.category!));
    }

    // Filter by search term if specified
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower) ||
          (e.location &&
            typeof e.location === "object" &&
            e.location.city &&
            e.location.city.toLowerCase().includes(searchLower))
      );
    }

    // Sort by date in chronological order (oldest to newest)
    events.sort((a, b) => {
      const aDate = a.startDate || 0;
      const bDate = b.startDate || 0;
      return aDate - bDate; // Ascending order (oldest first)
    });

    // Limit results
    if (args.limit) {
      events = events.slice(0, args.limit);
    }

    // Convert storage IDs to URLs for images
    const eventsWithImageUrls = await Promise.all(
      events.map(async (event) => {
        let imageUrl = event.imageUrl;

        // If no imageUrl but has images array with storage IDs
        if (!imageUrl && event.images && event.images.length > 0) {
          const url = await ctx.storage.getUrl(event.images[0]);
          imageUrl = url ?? undefined;
        }

        return {
          ...event,
          imageUrl,
        };
      })
    );

    return eventsWithImageUrls;
  },
});

/**
 * Get public event details by ID
 */
export const getPublicEventDetails = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    if (!event || event.status !== "PUBLISHED") {
      return null;
    }

    // Get payment config to check if tickets are visible
    const paymentConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    // Get tickets if visible
    let tickets = null;
    if (event.ticketsVisible && paymentConfig?.isActive) {
      tickets = await ctx.db
        .query("tickets")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();
    }

    // Get ticket tiers if visible
    let ticketTiers = null;
    if (event.ticketsVisible && paymentConfig?.isActive) {
      const tiers = await ctx.db
        .query("ticketTiers")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Enrich tiers with current pricing information
      const now = Date.now();
      ticketTiers = tiers.map((tier) => {
        let currentPrice = tier.price;
        let currentTierName: string | undefined = undefined;
        let nextPriceChange: { date: number; price: number; tierName: string } | undefined =
          undefined;
        let isEarlyBird = false;

        // Calculate current price based on pricing tiers
        if (tier.pricingTiers && tier.pricingTiers.length > 0) {
          // Sort pricing tiers by date
          const sortedTiers = [...tier.pricingTiers].sort(
            (a, b) => a.availableFrom - b.availableFrom
          );

          // Find current active tier
          for (let i = 0; i < sortedTiers.length; i++) {
            const pricingTier = sortedTiers[i];
            const isActive =
              now >= pricingTier.availableFrom &&
              (!pricingTier.availableUntil || now <= pricingTier.availableUntil);

            if (isActive) {
              currentPrice = pricingTier.price;
              currentTierName = pricingTier.name;
              isEarlyBird = true;

              // Check for next price change
              if (pricingTier.availableUntil && i + 1 < sortedTiers.length) {
                const nextTier = sortedTiers[i + 1];
                nextPriceChange = {
                  date: nextTier.availableFrom,
                  price: nextTier.price,
                  tierName: nextTier.name,
                };
              }
              break;
            }
          }

          // If no active tier found, check if we're before first tier or after last tier
          if (currentTierName === undefined) {
            if (now < sortedTiers[0].availableFrom) {
              // Before first tier - use base price
              currentPrice = tier.price;
              nextPriceChange = {
                date: sortedTiers[0].availableFrom,
                price: sortedTiers[0].price,
                tierName: sortedTiers[0].name,
              };
            } else {
              // After all tiers - use last tier price or base price
              const lastTier = sortedTiers[sortedTiers.length - 1];
              if (!lastTier.availableUntil || now <= lastTier.availableUntil) {
                currentPrice = lastTier.price;
                currentTierName = lastTier.name;
                isEarlyBird = true;
              }
            }
          }
        }

        return {
          ...tier,
          currentPrice,
          currentTierName,
          nextPriceChange,
          isEarlyBird,
        };
      });
    }

    // Get bundles if tickets are visible
    let bundles = null;
    if (event.ticketsVisible && paymentConfig?.isActive) {
      const activeBundles = await ctx.db
        .query("ticketBundles")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Check sale period for each bundle
      const now = Date.now();
      bundles = activeBundles
        .filter((bundle) => {
          const saleActive =
            (!bundle.saleStart || now >= bundle.saleStart) &&
            (!bundle.saleEnd || now <= bundle.saleEnd);
          const hasStock = bundle.totalQuantity - bundle.sold > 0;
          return saleActive && hasStock;
        })
        .map((bundle) => ({
          ...bundle,
          available: bundle.totalQuantity - bundle.sold,
          percentageSavings:
            bundle.regularPrice && bundle.regularPrice > 0
              ? Math.round((bundle.savings! / bundle.regularPrice) * 100)
              : 0,
        }));
    }

    // Get organizer info
    const organizer = event.organizerId ? await ctx.db.get(event.organizerId) : null;

    // Convert storage IDs to URLs for images
    let imageUrl = event.imageUrl;
    if (!imageUrl && event.images && event.images.length > 0) {
      const url = await ctx.storage.getUrl(event.images[0]);
      imageUrl = url ?? undefined;
    }

    return {
      ...event,
      imageUrl,
      tickets,
      ticketTiers,
      bundles,
      organizer: {
        name: organizer?.name,
        email: organizer?.email,
      },
      paymentConfigured: !!paymentConfig?.isActive,
    };
  },
});

/**
 * Search events by query
 */
export const searchEvents = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.query.toLowerCase();

    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    const filtered = allEvents.filter(
      (e) =>
        e.name.toLowerCase().includes(searchLower) ||
        e.description.toLowerCase().includes(searchLower) ||
        (e.location &&
          typeof e.location === "object" &&
          e.location.city &&
          e.location.city.toLowerCase().includes(searchLower)) ||
        (e.location &&
          typeof e.location === "object" &&
          e.location.state &&
          e.location.state.toLowerCase().includes(searchLower)) ||
        (e.categories && e.categories.some((c) => c.toLowerCase().includes(searchLower)))
    );

    const limited = args.limit ? filtered.slice(0, args.limit) : filtered;

    return limited;
  },
});

/**
 * Get events by category
 */
export const getEventsByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    const filtered = allEvents.filter((e) => e.categories?.includes(args.category));

    const limited = args.limit ? filtered.slice(0, args.limit) : filtered;

    return limited;
  },
});

/**
 * Get events by location (city or state)
 */
export const getEventsByLocation = query({
  args: {
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    let filtered = allEvents;

    if (args.city) {
      filtered = filtered.filter(
        (e) =>
          e.location &&
          typeof e.location === "object" &&
          e.location.city &&
          e.location.city.toLowerCase() === args.city!.toLowerCase()
      );
    }

    if (args.state) {
      filtered = filtered.filter(
        (e) =>
          e.location &&
          typeof e.location === "object" &&
          e.location.state &&
          e.location.state.toLowerCase() === args.state!.toLowerCase()
      );
    }

    const limited = args.limit ? filtered.slice(0, args.limit) : filtered;

    return limited;
  },
});

/**
 * Get featured events (for homepage carousel)
 */
export const getFeaturedEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // For now, just return upcoming events sorted by share count
    // Later, you can add a "featured" flag to events
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    const upcoming = events
      .filter((e) => e.startDate && e.startDate >= Date.now())
      .sort((a, b) => (b.socialShareCount || 0) - (a.socialShareCount || 0))
      .slice(0, args.limit || 10);

    return upcoming;
  },
});

/**
 * Get event categories with counts
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "PUBLISHED"))
      .collect();

    // Count events per category
    const categoryCounts = new Map<string, number>();

    events.forEach((event) => {
      event.categories?.forEach((category) => {
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      });
    });

    // Convert to array and sort by count
    const categories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return categories;
  },
});
