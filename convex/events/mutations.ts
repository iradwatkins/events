import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Create a new event
 */
export const createEvent = mutation({
  args: {
    name: v.string(),
    eventType: v.union(
      v.literal("TICKETED_EVENT"),
      v.literal("FREE_EVENT"),
      v.literal("SAVE_THE_DATE"),
      v.literal("BALLROOM_EVENT")
    ),
    description: v.string(),
    categories: v.array(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(),
    // Literal date/time fields for display without timezone conversion
    eventDateLiteral: v.optional(v.string()),
    eventTimeLiteral: v.optional(v.string()),
    eventTimezone: v.optional(v.string()),
    location: v.object({
      venueName: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.optional(v.string()),
      country: v.string(),
    }),
    capacity: v.optional(v.number()),
    doorPrice: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    try {
      console.log("[createEvent] Starting event creation...");

      // Use fallback test user for anonymous events
      const email = "iradwatkins@gmail.com";
      const name = "Test Organizer";
      const image = undefined;

      // Find or create user
      let user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (!user) {
        console.log("[createEvent] User not found, creating new user");
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
          email,
          name: name || undefined,
          image: image || undefined,
          role: "user",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        });
        user = await ctx.db.get(userId);
        if (!user) {
          throw new Error("Failed to create user");
        }
        console.log("[createEvent] User created:", user._id);
      } else {
        console.log("[createEvent] User found:", user._id);
      }

      console.log("[createEvent] Creating event with args:", {
        ...args,
        images: args.images?.length || 0,
      });

      // Create the event
      const eventId = await ctx.db.insert("events", {
        organizerId: user._id,
        organizerName: user.name || user.email,
        name: args.name,
        description: args.description,
        eventType: args.eventType,
        categories: args.categories,
        startDate: args.startDate,
        endDate: args.endDate,
        timezone: args.timezone,
        // Store literal date/time strings for accurate display
        eventDateLiteral: args.eventDateLiteral,
        eventTimeLiteral: args.eventTimeLiteral,
        eventTimezone: args.eventTimezone || args.timezone,
        location: args.location,
        doorPrice: args.doorPrice,
        imageUrl: args.imageUrl,
        images: args.images || [],
        // TESTING MODE: Create events as PUBLISHED so they appear on public homepage immediately
        status: "PUBLISHED",
        paymentModelSelected: false,
        ticketsVisible: false,
        allowWaitlist: false,
        allowTransfers: false,
        maxTicketsPerOrder: 10,
        minTicketsPerOrder: 1,
        socialShareCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      console.log("[createEvent] Event created successfully:", eventId);

      // CHECK IF THIS IS USER'S FIRST EVENT - GRANT 1000 FREE CREDITS
      const existingEvents = await ctx.db
        .query("events")
        .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
        .collect();

      const isFirstEvent = existingEvents.length === 1; // Just created their first event

      if (isFirstEvent) {
        console.log("[createEvent] First event detected! Checking credit status...");

        // Check if credits already exist
        const existingCredits = await ctx.db
          .query("organizerCredits")
          .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
          .first();

        if (!existingCredits) {
          // Grant 1000 FREE credits for first-time organizer
          const now = Date.now();
          await ctx.db.insert("organizerCredits", {
            organizerId: user._id,
            creditsTotal: 1000,
            creditsUsed: 0,
            creditsRemaining: 1000,
            firstEventFreeUsed: false,
            createdAt: now,
            updatedAt: now,
          });

          console.log("[createEvent] ✅ Granted 1000 FREE credits to new organizer!");
        } else {
          console.log("[createEvent] Credits already exist, skipping initialization");
        }
      }

      // AUTO-ASSIGN GLOBAL STAFF: Find all global staff (eventId=null) with autoAssignToNewEvents=true
      const globalStaff = await ctx.db
        .query("eventStaff")
        .filter((q) =>
          q.and(
            q.eq(q.field("organizerId"), user._id),
            q.eq(q.field("eventId"), undefined),
            q.eq(q.field("isActive"), true),
            q.eq(q.field("autoAssignToNewEvents"), true)
          )
        )
        .collect();

      console.log(`[createEvent] Found ${globalStaff.length} global staff to auto-assign`);

      // Clone each global staff member to this new event
      for (const staff of globalStaff) {
        // Generate new unique referral code for this event instance
        const namePart = staff.name
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 6)
          .toUpperCase();
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        let referralCode = `${namePart}${randomPart}`;

        let attempts = 0;
        while (attempts < 10) {
          const existing = await ctx.db
            .query("eventStaff")
            .withIndex("by_referral_code", (q) => q.eq("referralCode", referralCode))
            .first();
          if (!existing) break;
          referralCode = `${namePart}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          attempts++;
        }

        // Clone staff to new event
        const newStaffId = await ctx.db.insert("eventStaff", {
          eventId, // Assign to new event
          organizerId: staff.organizerId,
          staffUserId: staff.staffUserId,
          email: staff.email,
          name: staff.name,
          phone: staff.phone,
          role: staff.role,
          canScan: staff.canScan,
          commissionType: staff.commissionType,
          commissionValue: staff.commissionValue,
          commissionPercent: staff.commissionPercent,
          commissionEarned: 0, // Reset for new event
          allocatedTickets: 0, // Start at 0, organizer will allocate
          cashCollected: 0,
          isActive: true,
          ticketsSold: 0, // Reset for new event
          referralCode,
          // Hierarchy fields - preserve from global staff
          assignedByStaffId: undefined,
          hierarchyLevel: staff.hierarchyLevel || 1,
          canAssignSubSellers: staff.canAssignSubSellers,
          maxSubSellers: staff.maxSubSellers,
          parentCommissionPercent: staff.parentCommissionPercent,
          subSellerCommissionPercent: staff.subSellerCommissionPercent,
          autoAssignToNewEvents: staff.autoAssignToNewEvents,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        console.log(`[createEvent] Auto-assigned staff ${staff.name} (${newStaffId}) to event`);

        // AUTO-ASSIGN SUB-SELLERS: If this staff has sub-sellers with autoAssignToNewEvents=true, clone them too
        await autoAssignSubSellers(ctx, staff._id, newStaffId, eventId, user._id);
      }

      return eventId;
    } catch (error) {
      console.error("[createEvent] Error:", error);
      throw error;
    }
  },
});

/**
 * Recursively auto-assign sub-sellers when their parent staff is added to an event
 * This maintains the full hierarchy tree
 */
async function autoAssignSubSellers(
  ctx: any,
  originalParentStaffId: Id<"eventStaff">,
  newParentStaffId: Id<"eventStaff">,
  eventId: Id<"events">,
  organizerId: Id<"users">
): Promise<void> {
  // Find all sub-sellers of the original parent staff that have autoAssignToNewEvents=true
  const subSellers = await ctx.db
    .query("eventStaff")
    .withIndex("by_assigned_by", (q: any) => q.eq("assignedByStaffId", originalParentStaffId))
    .filter((q: any) =>
      q.and(
        q.eq(q.field("isActive"), true),
        q.eq(q.field("autoAssignToNewEvents"), true)
      )
    )
    .collect();

  for (const subSeller of subSellers) {
    // Generate unique referral code
    const namePart = subSeller.name
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6)
      .toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    let referralCode = `${namePart}${randomPart}`;

    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("eventStaff")
        .withIndex("by_referral_code", (q: any) => q.eq("referralCode", referralCode))
        .first();
      if (!existing) break;
      referralCode = `${namePart}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      attempts++;
    }

    // Clone sub-seller to new event
    const newSubSellerId = await ctx.db.insert("eventStaff", {
      eventId,
      organizerId,
      staffUserId: subSeller.staffUserId,
      email: subSeller.email,
      name: subSeller.name,
      phone: subSeller.phone,
      role: subSeller.role,
      canScan: subSeller.canScan,
      commissionType: subSeller.commissionType,
      commissionValue: subSeller.commissionValue,
      commissionPercent: subSeller.commissionPercent,
      commissionEarned: 0,
      allocatedTickets: 0,
      cashCollected: 0,
      isActive: true,
      ticketsSold: 0,
      referralCode,
      // Hierarchy - link to new parent
      assignedByStaffId: newParentStaffId,
      hierarchyLevel: subSeller.hierarchyLevel,
      canAssignSubSellers: subSeller.canAssignSubSellers,
      maxSubSellers: subSeller.maxSubSellers,
      parentCommissionPercent: subSeller.parentCommissionPercent,
      subSellerCommissionPercent: subSeller.subSellerCommissionPercent,
      autoAssignToNewEvents: subSeller.autoAssignToNewEvents,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[autoAssignSubSellers] Auto-assigned sub-seller ${subSeller.name} (Level ${subSeller.hierarchyLevel}) to event`);

    // Recursively assign this sub-seller's own sub-sellers
    await autoAssignSubSellers(ctx, subSeller._id, newSubSellerId, eventId, organizerId);
  }
}

/**
 * Configure payment for event (simplified wrapper)
 */
export const configurePayment = mutation({
  args: {
    eventId: v.id("events"),
    model: v.union(v.literal("PREPAY"), v.literal("CREDIT_CARD"), v.literal("CONSIGNMENT")),
    ticketPrice: v.optional(v.number()),
    platformFeePercent: v.optional(v.number()),
    platformFeeFixed: v.optional(v.number()),
    stripeFeePercent: v.optional(v.number()),
    stripeFeeFixed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Verify event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Get user (for organizerId)
    let user;

    // Skip authentication check for anonymous users
    if (!identity) {
      // Use test user
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
        .first();
      if (!user) throw new Error("Test user not found");
    } else {
      // Production mode: Verify event ownership
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized");
      }
    }

    // Check if config already exists
    const existing = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing) {
      throw new Error("Payment model already configured for this event");
    }

    // For PREPAY model: Initialize 100 FREE ticket credits for new organizers
    if (args.model === "PREPAY") {
      const credits = await ctx.db
        .query("organizerCredits")
        .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
        .first();

      if (!credits) {
        console.log("[configurePayment] Initializing 1000 FREE ticket credits for new organizer");
        await ctx.db.insert("organizerCredits", {
          organizerId: user._id,
          creditsTotal: 1000,
          creditsUsed: 0,
          creditsRemaining: 1000,
          firstEventFreeUsed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Create payment config
    const configId = await ctx.db.insert("eventPaymentConfig", {
      eventId: args.eventId,
      organizerId: user._id,
      paymentModel: args.model,
      isActive: true,
      activatedAt: Date.now(),
      platformFeePercent: args.platformFeePercent || 0,
      platformFeeFixed: args.platformFeeFixed || 0,
      processingFeePercent: args.stripeFeePercent || 2.9,
      charityDiscount: false,
      lowPriceDiscount: false,
      ticketsAllocated: args.model === "PREPAY" ? 0 : undefined,
      stripeConnectAccountId:
        args.model === "CREDIT_CARD" ? user.stripeConnectedAccountId : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update event
    await ctx.db.patch(args.eventId, {
      paymentModelSelected: true,
      ticketsVisible: true,
      updatedAt: Date.now(),
    });

    return { configId, success: true };
  },
});

/**
 * Publish an event
 */
export const publishEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    await ctx.db.patch(args.eventId, {
      status: "PUBLISHED",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update event details
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(
      v.object({
        venueName: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.optional(v.string()),
        country: v.string(),
      })
    ),
    capacity: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[updateEvent] TESTING MODE - No authentication required");
    } else {
      // Production mode: Verify event ownership
      const event = await ctx.db.get(args.eventId);
      if (!event) throw new Error("Event not found");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || event.organizerId !== user._id) {
        throw new Error("Not authorized");
      }
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // SAFEGUARD: Check if event has any ticket sales
    const hasTicketSales = event.status === "PUBLISHED" && event.eventType === "TICKETED_EVENT";
    let ticketsSold = 0;

    if (hasTicketSales) {
      // Count total tickets sold across all tiers
      const ticketTiers = await ctx.db
        .query("ticketTiers")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      ticketsSold = ticketTiers.reduce((sum, tier) => sum + tier.sold, 0);
    }

    // RESTRICTION: Prevent date/time changes if tickets have been sold
    if (ticketsSold > 0 && (args.startDate || args.endDate)) {
      throw new Error(
        `Cannot change event date/time after ${ticketsSold} ticket${ticketsSold === 1 ? ' has' : 's have'} been sold. ` +
        `This would affect customers who already purchased tickets. ` +
        `If you must reschedule, please cancel this event and create a new one.`
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // ALLOWED: Always allow these edits (even with sales)
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.categories) updates.categories = args.categories;
    if (args.location) updates.location = args.location;
    if (args.imageUrl) updates.imageUrl = args.imageUrl;

    // RESTRICTED: Only allow date changes if no sales
    if (args.startDate && ticketsSold === 0) updates.startDate = args.startDate;
    if (args.endDate && ticketsSold === 0) updates.endDate = args.endDate;

    // ALLOWED: Capacity can increase but not decrease below sold
    if (args.capacity) {
      if (ticketsSold > 0 && args.capacity < ticketsSold) {
        throw new Error(
          `Cannot reduce capacity to ${args.capacity} because ${ticketsSold} tickets have already been sold. ` +
          `Capacity must be at least ${ticketsSold}.`
        );
      }
      updates.capacity = args.capacity;
    }

    await ctx.db.patch(args.eventId, updates);

    return { success: true };
  },
});

/**
 * Claim an event
 * Allows an organizer to take ownership of a claimable event
 */
export const claimEvent = mutation({
  args: {
    eventId: v.id("events"),
    claimCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: When authentication is enabled, get current user ID

    // Get the event
    const event = await ctx.db.get(args.eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if event is claimable
    if (!event.isClaimable) {
      throw new Error("This event is not available for claiming");
    }

    // Check if event already has an organizer
    if (event.organizerId) {
      throw new Error("This event has already been claimed");
    }

    // Validate claim code if required
    if (event.claimCode) {
      if (!args.claimCode || args.claimCode !== event.claimCode) {
        throw new Error("Invalid claim code");
      }
    }

    // TESTING MODE: Use first user as organizer
    // TODO: Replace with actual authenticated user ID
    const users = await ctx.db.query("users").first();
    if (!users) {
      throw new Error("No users found in system");
    }

    // Claim the event
    await ctx.db.patch(args.eventId, {
      organizerId: users._id,
      organizerName: users.name,
      isClaimable: false,
      claimedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      eventId: args.eventId,
      organizerId: users._id,
    };
  },
});

/**
 * Duplicate an event with all its configurations
 */
export const duplicateEvent = mutation({
  args: {
    eventId: v.id("events"),
    options: v.object({
      copyTickets: v.boolean(),
      copySeating: v.boolean(),
      copyStaff: v.boolean(),
      newName: v.optional(v.string()),
      newDate: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // TESTING MODE: Skip authentication check
    if (!identity) {
      console.warn("[duplicateEvent] TESTING MODE - No authentication required");
    }

    // Get original event
    const originalEvent = await ctx.db.get(args.eventId);
    if (!originalEvent) {
      throw new Error("Event not found");
    }

    // Check ownership (skip in testing mode)
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (user && originalEvent.organizerId !== user._id) {
        throw new Error("You can only duplicate your own events");
      }
    }

    // Create new event with duplicated data
    const newEventData = {
      ...originalEvent,
      _id: undefined, // Remove ID to create new record
      _creationTime: undefined, // Remove system fields
      name: args.options.newName || `${originalEvent.name} (Copy)`,
      startDate: args.options.newDate || originalEvent.startDate,
      status: "DRAFT" as const, // Reset to draft status
      isClaimable: false,
      claimCode: undefined,
      claimedAt: undefined,

      // Reset ticket tracking
      ticketsSold: 0,
      ticketsVisible: originalEvent.ticketsVisible,

      // Timestamps
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Create the new event
    const newEventId = await ctx.db.insert("events", newEventData);
    console.log(`[duplicateEvent] Created new event ${newEventId} from ${args.eventId}`);

    // Copy ticket tiers if requested
    if (args.options.copyTickets) {
      const ticketTiers = await ctx.db
        .query("ticketTiers")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const tier of ticketTiers) {
        const newTierData = {
          ...tier,
          _id: undefined,
          _creationTime: undefined,
          eventId: newEventId,
          sold: 0, // Reset sold count
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const newTierId = await ctx.db.insert("ticketTiers", newTierData);
        console.log(`[duplicateEvent] Duplicated ticket tier ${tier._id} -> ${newTierId}`);
      }
    }

    // Copy seating chart if requested
    if (args.options.copySeating) {
      const seatingCharts = await ctx.db
        .query("seatingCharts")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const chart of seatingCharts) {
        const newChartData = {
          ...chart,
          _id: undefined,
          _creationTime: undefined,
          eventId: newEventId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const newChartId = await ctx.db.insert("seatingCharts", newChartData);
        console.log(`[duplicateEvent] Duplicated seating chart ${chart._id} -> ${newChartId}`);

        // Copy all seat reservations for this chart
        const reservations = await ctx.db
          .query("seatReservations")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
          .collect();

        // Note: We're not copying seat reservations as they should start fresh for the new event
        console.log(`[duplicateEvent] Seating chart ${newChartId} created without reservations`);
      }
    }

    // Copy staff if requested
    if (args.options.copyStaff) {
      const eventStaff = await ctx.db
        .query("eventStaff")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const staff of eventStaff) {
        const newStaffData = {
          ...staff,
          _id: undefined,
          _creationTime: undefined,
          eventId: newEventId,
          allocatedTickets: 0, // Reset allocations
          ticketsSold: 0,
          totalCommissionEarned: 0,
          totalCashCollected: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const newStaffId = await ctx.db.insert("eventStaff", newStaffData);
        console.log(`[duplicateEvent] Duplicated staff member ${staff._id} -> ${newStaffId}`);
      }
    }

    // Copy payment configuration
    const paymentConfig = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (paymentConfig) {
      const newPaymentConfig = {
        ...paymentConfig,
        _id: undefined,
        _creationTime: undefined,
        eventId: newEventId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await ctx.db.insert("eventPaymentConfig", newPaymentConfig);
      console.log(`[duplicateEvent] Duplicated payment configuration`);
    }

    return {
      success: true,
      originalEventId: args.eventId,
      newEventId,
      duplicatedItems: {
        tickets: args.options.copyTickets,
        seating: args.options.copySeating,
        staff: args.options.copyStaff,
      },
    };
  },
});

/**
 * Bulk delete events
 * Deletes multiple events and all associated data (tickets, staff, bundles, etc.)
 */
export const bulkDeleteEvents = mutation({
  args: {
    eventIds: v.array(v.id("events")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    console.log(`[bulkDeleteEvents] Starting bulk delete for ${args.eventIds.length} events`);

    // Get user for ownership verification
    let user;
    if (!identity) {
      console.warn("[bulkDeleteEvents] TESTING MODE - No authentication required");
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
        .first();
      if (!user) throw new Error("Test user not found");
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!user) throw new Error("User not found");
    }

    const deletedEvents: string[] = [];
    const failedEvents: Array<{ eventId: string; reason: string }> = [];

    // Process each event
    for (const eventId of args.eventIds) {
      try {
        const event = await ctx.db.get(eventId);

        if (!event) {
          failedEvents.push({ eventId, reason: "Event not found" });
          continue;
        }

        // Verify ownership (skip in testing mode)
        if (identity && event.organizerId !== user._id) {
          failedEvents.push({ eventId, reason: "Not authorized to delete this event" });
          continue;
        }

        // Check if event has any tickets sold
        const ticketTiers = await ctx.db
          .query("ticketTiers")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();

        const totalTicketsSold = ticketTiers.reduce((sum, tier) => sum + tier.sold, 0);

        if (totalTicketsSold > 0) {
          failedEvents.push({
            eventId,
            reason: `Cannot delete - ${totalTicketsSold} ticket${totalTicketsSold === 1 ? ' has' : 's have'} been sold`
          });
          continue;
        }

        // Delete all related data
        console.log(`[bulkDeleteEvents] Deleting event ${eventId}: ${event.name}`);

        // Delete ticket tiers
        for (const tier of ticketTiers) {
          await ctx.db.delete(tier._id);
        }
        console.log(`[bulkDeleteEvents] Deleted ${ticketTiers.length} ticket tiers`);

        // Delete event staff
        const eventStaff = await ctx.db
          .query("eventStaff")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
        for (const staff of eventStaff) {
          await ctx.db.delete(staff._id);
        }
        console.log(`[bulkDeleteEvents] Deleted ${eventStaff.length} staff members`);

        // Delete ticket bundles
        const bundles = await ctx.db
          .query("ticketBundles")
          .filter((q) => q.eq(q.field("eventId"), eventId))
          .collect();
        for (const bundle of bundles) {
          await ctx.db.delete(bundle._id);
        }
        console.log(`[bulkDeleteEvents] Deleted ${bundles.length} bundles`);

        // Delete seating charts
        const seatingCharts = await ctx.db
          .query("seatingCharts")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
        for (const chart of seatingCharts) {
          await ctx.db.delete(chart._id);
        }
        console.log(`[bulkDeleteEvents] Deleted ${seatingCharts.length} seating charts`);

        // Delete seat reservations
        const seatReservations = await ctx.db
          .query("seatReservations")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
        for (const reservation of seatReservations) {
          await ctx.db.delete(reservation._id);
        }
        console.log(`[bulkDeleteEvents] Deleted ${seatReservations.length} seat reservations`);

        // Delete payment config
        const paymentConfig = await ctx.db
          .query("eventPaymentConfig")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .first();
        if (paymentConfig) {
          await ctx.db.delete(paymentConfig._id);
          console.log(`[bulkDeleteEvents] Deleted payment configuration`);
        }

        // Delete tickets (shouldn't be any if no sales, but clean up just in case)
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_event", (q) => q.eq("eventId", eventId))
          .collect();
        for (const ticket of tickets) {
          await ctx.db.delete(ticket._id);
        }
        console.log(`[bulkDeleteEvents] Deleted ${tickets.length} tickets`);

        // Delete orders (shouldn't be any if no sales, but clean up just in case)
        const orders = await ctx.db
          .query("orders")
          .filter((q) => q.eq(q.field("eventId"), eventId))
          .collect();
        for (const order of orders) {
          await ctx.db.delete(order._id);
        }
        console.log(`[bulkDeleteEvents] Deleted ${orders.length} orders`);

        // Finally, delete the event itself
        await ctx.db.delete(eventId);
        deletedEvents.push(eventId);
        console.log(`[bulkDeleteEvents] Successfully deleted event ${eventId}`);

      } catch (error) {
        console.error(`[bulkDeleteEvents] Error deleting event ${eventId}:`, error);
        failedEvents.push({
          eventId,
          reason: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    console.log(`[bulkDeleteEvents] Completed: ${deletedEvents.length} deleted, ${failedEvents.length} failed`);

    return {
      success: true,
      deletedCount: deletedEvents.length,
      failedCount: failedEvents.length,
      deletedEvents,
      failedEvents,
    };
  },
});
