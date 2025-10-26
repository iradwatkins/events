import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Log uploaded flyer to database
 */
export const logUploadedFlyer = mutation({
  args: {
    filename: v.string(),
    fileHash: v.string(),
    filepath: v.string(),
    originalSize: v.number(),
    optimizedSize: v.number(),
  },
  handler: async (ctx, args) => {
    // TESTING MODE: Skip authentication check
    // In production, verify user is admin
    const userId = "temp-admin-id"; // Replace with actual user ID from auth

    const flyerId = await ctx.db.insert("uploadedFlyers", {
      filename: args.filename,
      fileHash: args.fileHash,
      filepath: args.filepath,
      originalSize: args.originalSize,
      optimizedSize: args.optimizedSize,
      uploadedBy: userId as any, // TEMP: will be real user ID
      uploadedAt: Date.now(),
      aiProcessed: false,
      eventCreated: false,
      status: "UPLOADED",
    });

    return { flyerId };
  },
});

/**
 * Create a claimable event from an uploaded flyer
 * Admin uses this after uploading flyers to create events that organizers can claim
 */
export const createClaimableEventFromFlyer = mutation({
  args: {
    flyerId: v.id("uploadedFlyers"),
    eventData: v.object({
      name: v.string(),
      description: v.string(),
      eventType: v.union(
        v.literal("SAVE_THE_DATE"),
        v.literal("FREE_EVENT"),
        v.literal("TICKETED_EVENT")
      ),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      location: v.optional(v.object({
        venueName: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.optional(v.string()),
        country: v.string(),
      })),
      isClaimable: v.boolean(),
      claimCode: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // TESTING MODE: Skip admin authentication
    console.warn("[createClaimableEventFromFlyer] TESTING MODE - No admin auth check");

    // Get the flyer
    const flyer = await ctx.db.get(args.flyerId);
    if (!flyer) {
      throw new Error("Flyer not found");
    }

    if (flyer.eventCreated) {
      throw new Error("Event already created from this flyer");
    }

    const now = Date.now();

    // Create the event
    const eventId = await ctx.db.insert("events", {
      name: args.eventData.name,
      description: args.eventData.description,
      eventType: args.eventData.eventType,
      startDate: args.eventData.startDate,
      endDate: args.eventData.endDate,
      location: args.eventData.location,

      // Use the flyer image as the event image
      imageUrl: flyer.filepath,

      // Event is claimable by organizers
      isClaimable: args.eventData.isClaimable,
      claimCode: args.eventData.claimCode,

      // No organizer yet - will be set when claimed
      organizerId: undefined,
      organizerName: undefined,

      // Status
      status: "PUBLISHED", // Make it visible to organizers

      // Settings
      ticketsVisible: false, // No tickets until claimed and set up
      paymentModelSelected: false,

      // Timestamps
      createdAt: now,
      updatedAt: now,
    });

    // Update flyer record
    await ctx.db.patch(args.flyerId, {
      eventCreated: true,
      eventId: eventId,
      eventCreatedAt: now,
      status: "EVENT_CREATED",
    });

    return {
      success: true,
      eventId,
      message: args.eventData.isClaimable
        ? "Claimable event created - organizers can now claim it"
        : "Save-the-date event created"
    };
  },
});

/**
 * Get all uploaded flyers for admin dashboard
 */
export const getUploadedFlyers = mutation({
  args: {
    status: v.optional(v.union(
      v.literal("UPLOADED"),
      v.literal("PROCESSING"),
      v.literal("EXTRACTED"),
      v.literal("EVENT_CREATED"),
      v.literal("ERROR")
    )),
  },
  handler: async (ctx, args) => {
    let flyers;

    if (args.status) {
      flyers = await ctx.db
        .query("uploadedFlyers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    } else {
      flyers = await ctx.db
        .query("uploadedFlyers")
        .order("desc")
        .take(100);
    }

    return flyers;
  },
});

/**
 * Get statistics for flyer uploads (for analytics)
 */
export const getFlyerStats = mutation({
  args: {},
  handler: async (ctx) => {
    const allFlyers = await ctx.db
      .query("uploadedFlyers")
      .collect();

    const totalUploaded = allFlyers.length;
    const eventsCreated = allFlyers.filter(f => f.eventCreated).length;
    const pendingEvents = allFlyers.filter(f => !f.eventCreated).length;
    const totalSizeSaved = allFlyers.reduce(
      (sum, f) => sum + (f.originalSize - f.optimizedSize),
      0
    );

    // Get event type breakdown
    const eventsByType = await ctx.db
      .query("events")
      .filter((q) => q.neq(q.field("organizerId"), undefined))
      .collect();

    const saveTheDateCount = eventsByType.filter(e => e.eventType === "SAVE_THE_DATE").length;
    const freeEventCount = eventsByType.filter(e => e.eventType === "FREE_EVENT").length;
    const ticketedEventCount = eventsByType.filter(e => e.eventType === "TICKETED_EVENT").length;

    // Get claimable vs claimed events
    const claimableEvents = await ctx.db
      .query("events")
      .withIndex("by_claimable", (q) => q.eq("isClaimable", true))
      .filter((q) => q.eq(q.field("organizerId"), undefined))
      .collect();

    const claimedEvents = await ctx.db
      .query("events")
      .filter((q) => q.neq(q.field("claimedAt"), undefined))
      .collect();

    return {
      flyers: {
        totalUploaded,
        eventsCreated,
        pendingEvents,
        totalSizeSaved: (totalSizeSaved / 1024 / 1024).toFixed(2) + " MB",
      },
      events: {
        saveTheDateCount,
        freeEventCount,
        ticketedEventCount,
        claimableCount: claimableEvents.length,
        claimedCount: claimedEvents.length,
      },
    };
  },
});
