import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get waitlist for an event (organizer only)
 */
export const getEventWaitlist = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Allow access without authentication
    const TESTING_MODE = process.env.CONVEX_CLOUD_URL?.includes("fearless-dragon-613");
    if (TESTING_MODE && !identity) {
      console.warn("[getEventWaitlist] TESTING MODE - No authentication required");
      const waitlist = await ctx.db
        .query("eventWaitlist")
        .withIndex("by_event_and_status", (q) =>
          q.eq("eventId", args.eventId).eq("status", "ACTIVE")
        )
        .collect();

      // Get tier details for each entry
      const waitlistWithDetails = await Promise.all(
        waitlist.map(async (entry) => {
          let tier = null;
          if (entry.ticketTierId) {
            tier = await ctx.db.get(entry.ticketTierId);
          }
          return {
            ...entry,
            tier,
          };
        })
      );

      return waitlistWithDetails.sort((a, b) => a.joinedAt - b.joinedAt);
    }

    if (!identity) throw new Error("Not authenticated");

    // Verify user is the event organizer
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const waitlist = await ctx.db
      .query("eventWaitlist")
      .withIndex("by_event_and_status", (q) => q.eq("eventId", args.eventId).eq("status", "ACTIVE"))
      .collect();

    // Get tier details for each entry
    const waitlistWithDetails = await Promise.all(
      waitlist.map(async (entry) => {
        let tier = null;
        if (entry.ticketTierId) {
          tier = await ctx.db.get(entry.ticketTierId);
        }
        return {
          ...entry,
          tier,
        };
      })
    );

    return waitlistWithDetails.sort((a, b) => a.joinedAt - b.joinedAt);
  },
});

/**
 * Check if user is on waitlist for an event
 */
export const checkUserOnWaitlist = query({
  args: {
    eventId: v.id("events"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const waitlistEntry = await ctx.db
      .query("eventWaitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .filter((q) =>
        q.and(
          q.eq(q.field("eventId"), args.eventId),
          q.or(q.eq(q.field("status"), "ACTIVE"), q.eq(q.field("status"), "NOTIFIED"))
        )
      )
      .first();

    return waitlistEntry !== null;
  },
});

/**
 * Get waitlist count for an event
 */
export const getWaitlistCount = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const waitlist = await ctx.db
      .query("eventWaitlist")
      .withIndex("by_event_and_status", (q) => q.eq("eventId", args.eventId).eq("status", "ACTIVE"))
      .collect();

    return waitlist.length;
  },
});
