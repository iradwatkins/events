import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get all published events (public API for stepperslife.com)
 */
export const getPublishedEvents = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let eventsQuery = ctx.db
      .query("events")
      .withIndex("by_published", (q) => q.eq("status", "PUBLISHED"))
      .order("desc");

    let events = await eventsQuery.collect();

    // Filter by category if specified
    if (args.category) {
      events = events.filter((e) => e.categories.includes(args.category!));
    }

    // Filter by search term if specified
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower) ||
          e.location.city.toLowerCase().includes(searchLower)
      );
    }

    // Limit results
    if (args.limit) {
      events = events.slice(0, args.limit);
    }

    return events;
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

    // Get organizer info
    const organizer = await ctx.db.get(event.organizerId);

    return {
      ...event,
      tickets,
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
        e.location.city.toLowerCase().includes(searchLower) ||
        e.location.state.toLowerCase().includes(searchLower) ||
        e.categories.some((c) => c.toLowerCase().includes(searchLower))
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

    const filtered = allEvents.filter((e) => e.categories.includes(args.category));

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
        (e) => e.location.city.toLowerCase() === args.city!.toLowerCase()
      );
    }

    if (args.state) {
      filtered = filtered.filter(
        (e) => e.location.state.toLowerCase() === args.state!.toLowerCase()
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
      .filter((e) => e.startDate >= Date.now())
      .sort((a, b) => b.socialShareCount - a.socialShareCount)
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
      event.categories.forEach((category) => {
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
