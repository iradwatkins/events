import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ADMIN ONLY: Publish all draft events (for testing)
 */
export const publishAllDraftEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const draftEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "DRAFT"))
      .collect();

    console.log(`[ADMIN] Found ${draftEvents.length} draft events to publish`);

    const results = [];
    for (const event of draftEvents) {
      await ctx.db.patch(event._id, {
        status: "PUBLISHED",
        updatedAt: Date.now(),
      });
      results.push({
        id: event._id,
        name: event.name,
      });
      console.log(`[ADMIN] Published: ${event.name}`);
    }

    return {
      success: true,
      published: results.length,
      events: results,
    };
  },
});

/**
 * ADMIN ONLY: Get all events regardless of status
 */
export const getAllEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").collect();

    return events.map(e => ({
      _id: e._id,
      name: e.name,
      status: e.status,
      organizerId: e.organizerId,
      organizerName: e.organizerName,
      imageUrl: e.imageUrl,
      images: e.images,
      startDate: e.startDate,
      location: e.location,
      createdAt: e.createdAt,
    }));
  },
});
