import { v } from "convex/values";
import { mutation, internalMutation, action, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { parseEventDateTime } from "../lib/timezone";

/**
 * Admin mutations - requires admin role
 */

/**
 * Update user role
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("organizer"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    // // Don't allow changing your own role
    // if (admin._id === args.userId) {
    //   throw new Error("Cannot change your own role");
    // }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete user (soft delete - keep for records)
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    // // Don't allow deleting yourself
    // if (admin._id === args.userId) {
    //   throw new Error("Cannot delete your own account");
    // }

    // Check if user has events
    const userEvents = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.userId))
      .collect();

    if (userEvents.length > 0) {
      throw new Error(
        `Cannot delete user with ${userEvents.length} events. Please delete or reassign events first.`
      );
    }

    // Actually delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

/**
 * Update event status (for moderation)
 */
export const updateEventStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("CANCELLED"),
      v.literal("COMPLETED")
    ),
  },
  handler: async (ctx, args) => {
    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // const admin = await ctx.db
    //   .query("users")
    //   .withIndex("by_email", (q) => q.eq("email", identity.email!))
    //   .first();

    // if (!admin || admin.role !== "admin") {
    //   throw new Error("Not authorized - Admin access required");
    // }

    await ctx.db.patch(args.eventId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete event and all associated data (admin override)
 * This is an ACTION so it can call the flyer deletion API
 */
export const deleteEvent = action({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    deleted: {
      event: boolean;
      tiers: number;
      bundles: number;
      contacts: number;
      flyer: boolean;
    };
  }> => {
    console.log(`🗑️ [deleteEvent] Starting deletion for event: ${args.eventId}`);

    // TEMPORARY: Authentication disabled for testing
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) throw new Error("Not authenticated");

    // Get event details first (before deletion)
    const event = await ctx.runQuery(internal.adminPanel.mutations.getEventForDeletion, {
      eventId: args.eventId,
    });

    if (!event.event) {
      throw new Error("Event not found");
    }

    // Find associated flyer
    if (event.flyer) {
      console.log(`🖼️ Found associated flyer: ${event.flyer.filename}`);

      // Delete physical flyer file first
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://events.stepperslife.com'}/api/admin/delete-flyer-file`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filepath: event.flyer.filepath,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.warn(`⚠️ Failed to delete physical flyer file: ${event.flyer.filepath}`, errorData);
        } else {
          console.log(`✅ Physical flyer file deleted: ${event.flyer.filepath}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error deleting physical flyer file:`, error);
      }
    }

    // Now delete all database records
    return await ctx.runMutation(internal.adminPanel.mutations.deleteEventInternal, {
      eventId: args.eventId,
      flyerId: event.flyer?._id,
    });
  },
});

/**
 * Get event and flyer info for deletion (internal query)
 */
export const getEventForDeletion = internalQuery({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);

    // Find associated flyer
    const flyer = event ? await ctx.db
      .query("uploadedFlyers")
      .filter((q) => q.eq(q.field("eventId"), args.eventId))
      .first() : null;

    return {
      event,
      flyer,
    };
  },
});

/**
 * Internal mutation to delete event and all associated database records
 * Called by deleteEvent action after physical files are deleted
 */
export const deleteEventInternal = internalMutation({
  args: {
    eventId: v.id("events"),
    flyerId: v.optional(v.id("uploadedFlyers")),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    console.log(`📄 [deleteEventInternal] Event: ${event.name}`);

    // Check if event has tickets sold
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (tickets.length > 0) {
      throw new Error(
        `Cannot delete event with ${tickets.length} tickets sold. Cancel instead.`
      );
    }

    // Delete ticket tiers
    const tiers = await ctx.db
      .query("ticketTiers")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const tier of tiers) {
      await ctx.db.delete(tier._id);
    }
    console.log(`✅ Deleted ${tiers.length} ticket tiers`);

    // Delete bundles
    const bundles = await ctx.db
      .query("ticketBundles")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const bundle of bundles) {
      await ctx.db.delete(bundle._id);
    }
    console.log(`✅ Deleted ${bundles.length} bundles`);

    // Delete event contacts (CRM data from flyer extraction)
    const contacts = await ctx.db
      .query("eventContacts")
      .filter((q) => q.eq(q.field("eventId"), args.eventId))
      .collect();

    for (const contact of contacts) {
      await ctx.db.delete(contact._id);
    }
    console.log(`✅ Deleted ${contacts.length} contacts`);

    // Delete flyer database record if provided
    if (args.flyerId) {
      await ctx.db.delete(args.flyerId);
      console.log(`✅ Deleted flyer record: ${args.flyerId}`);
    }

    // Delete the event itself
    await ctx.db.delete(args.eventId);
    console.log(`✅ Deleted event: ${args.eventId}`);

    return {
      success: true,
      deleted: {
        event: true,
        tiers: tiers.length,
        bundles: bundles.length,
        contacts: contacts.length,
        flyer: !!args.flyerId,
      }
    };
  },
});

/**
 * Create admin user (system initialization)
 */
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // This mutation should be protected and only callable during setup
    // In production, add additional security checks

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Promote existing user to admin
      await ctx.db.patch(existingUser._id, {
        role: "admin",
        updatedAt: Date.now(),
      });

      return { success: true, userId: existingUser._id, action: "promoted" };
    }

    // Create new admin user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: "admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, userId, action: "created" };
  },
});

/**
 * Mark order as refunded (internal mutation - called after Square refund succeeds)
 */
export const markOrderRefunded = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    // Mark order as refunded
    await ctx.db.patch(args.orderId, {
      status: "REFUNDED",
      updatedAt: Date.now(),
    });

    // Mark all tickets as refunded
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();

    for (const ticket of tickets) {
      await ctx.db.patch(ticket._id, {
        status: "REFUNDED",
        updatedAt: Date.now(),
      });
    }

    return { success: true, ticketsRefunded: tickets.length };
  },
});

/**
 * Mark event as claimable
 * Allows admins to make an event available for organizers to claim
 */
export const markEventAsClaimable = mutation({
  args: {
    eventId: v.id("events"),
    claimCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TESTING MODE: Skip admin authentication
    console.warn("[markEventAsClaimable] TESTING MODE - No admin auth check");

    // Get the event
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // Mark as claimable
    await ctx.db.patch(args.eventId, {
      isClaimable: true,
      claimCode: args.claimCode || undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unmark event as claimable
 * Removes event from the claimable list
 */
export const unmarkEventAsClaimable = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // TESTING MODE: Skip admin authentication
    console.warn("[unmarkEventAsClaimable] TESTING MODE - No admin auth check");

    // Get the event
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // Unmark as claimable
    await ctx.db.patch(args.eventId, {
      isClaimable: false,
      claimCode: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Fix event timestamps by re-parsing literal dates
 * Used to fix events created with broken date parser
 */
export const fixEventTimestamps = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // TESTING MODE: Skip admin authentication
    console.warn("[fixEventTimestamps] TESTING MODE - No admin auth check");

    // Get the event
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // Re-parse the literal dates using the updated parser
    const startDate = parseEventDateTime(
      event.eventDateLiteral,
      event.eventTimeLiteral,
      event.timezone || "America/New_York"
    );

    const endDate = startDate; // For now, use same as start date

    console.log(`[fixEventTimestamps] Event: ${event.name}`);
    console.log(`[fixEventTimestamps] Literal date: ${event.eventDateLiteral}`);
    console.log(`[fixEventTimestamps] Parsed startDate: ${startDate} (${startDate ? new Date(startDate).toISOString() : 'undefined'})`);

    // Update the event with parsed timestamps
    await ctx.db.patch(args.eventId, {
      startDate,
      endDate,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      startDate,
      endDate,
      startDateISO: startDate ? new Date(startDate).toISOString() : undefined
    };
  },
});
