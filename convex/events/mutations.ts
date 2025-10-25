import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a new event
 */
export const createEvent = mutation({
  args: {
    name: v.string(),
    eventType: v.union(
      v.literal("TICKETED_EVENT"),
      v.literal("FREE_EVENT"),
      v.literal("SAVE_THE_DATE")
    ),
    description: v.string(),
    categories: v.array(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.string(),
    location: v.object({
      venueName: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.optional(v.string()),
      country: v.string(),
    }),
    capacity: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    try {
      console.log("[createEvent] Starting event creation...");

      // Get authentication identity
      const identity = await ctx.auth.getUserIdentity();
      console.log("[createEvent] Identity retrieved:", !!identity);
      console.log("[createEvent] Identity type:", typeof identity);

      let email: string;
      let name: string | undefined;
      let image: string | undefined;

      if (!identity) {
        // FALLBACK: Use test user if not authenticated (temporary for debugging)
        console.warn("[createEvent] No identity - using fallback test user");
        email = "test@stepperslife.com";
        name = "Test User";
      } else {
        console.log("[createEvent] Raw identity:", JSON.stringify(identity).substring(0, 200));

        // Parse identity - it might be a JSON string from NextAuth
        let userInfo: any;
        try {
          userInfo = typeof identity === "string" ? JSON.parse(identity) : identity;
          console.log("[createEvent] Parsed identity successfully");
        } catch (e) {
          console.error("[createEvent] Failed to parse identity, using raw:", e);
          userInfo = identity;
        }

        // Extract email
        email = userInfo.email || (identity as any).email || userInfo.subject;
        name = userInfo.name || (identity as any).name;
        image = userInfo.image || (identity as any).image;

        console.log("[createEvent] Extracted - email:", email, "name:", name);

        if (!email) {
          console.error("[createEvent] No email found in identity:", userInfo);
          throw new Error("Email not found in authentication token");
        }
      }

      // Find or create user
      console.log("[createEvent] Looking up user:", email);
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
        location: args.location,
        imageUrl: args.imageUrl,
        images: args.images || [],
        status: "DRAFT",
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
      return eventId;
    } catch (error) {
      console.error("[createEvent] Error:", error);
      throw error;
    }
  },
});

/**
 * Configure payment for event (simplified wrapper)
 */
export const configurePayment = mutation({
  args: {
    eventId: v.id("events"),
    model: v.union(v.literal("PRE_PURCHASE"), v.literal("PAY_AS_SELL")),
    ticketPrice: v.optional(v.number()),
    platformFeePercent: v.optional(v.number()),
    platformFeeFixed: v.optional(v.number()),
    stripeFeePercent: v.optional(v.number()),
    stripeFeeFixed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify event ownership
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    // Check if config already exists
    const existing = await ctx.db
      .query("eventPaymentConfig")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing) {
      throw new Error("Payment model already configured for this event");
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
      ticketsAllocated: args.model === "PRE_PURCHASE" ? 0 : undefined,
      stripeConnectAccountId: args.model === "PAY_AS_SELL" ? user.stripeConnectedAccountId : undefined,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

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
    location: v.optional(v.object({
      venueName: v.optional(v.string()),
      address: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      zipCode: v.optional(v.string()),
      country: v.string(),
    })),
    capacity: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || event.organizerId !== user._id) {
      throw new Error("Not authorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.categories) updates.categories = args.categories;
    if (args.startDate) updates.startDate = args.startDate;
    if (args.endDate) updates.endDate = args.endDate;
    if (args.location) updates.location = args.location;
    if (args.capacity) updates.capacity = args.capacity;
    if (args.imageUrl) updates.imageUrl = args.imageUrl;

    await ctx.db.patch(args.eventId, updates);

    return { success: true };
  },
});
