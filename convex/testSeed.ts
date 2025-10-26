import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed test events for comprehensive testing
 * Run with: npx convex run test-seed:seedTestEvents
 */
export const seedTestEvents = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[SEED] Starting test event creation...");

    // Get or create test organizer
    let testOrganizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
      .first();

    if (!testOrganizer) {
      console.log("[SEED] Creating test organizer...");
      const organizerId = await ctx.db.insert("users", {
        email: "test@stepperslife.com",
        name: "Test Organizer",
        role: "organizer",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      testOrganizer = await ctx.db.get(organizerId);
    }

    console.log("[SEED] Test organizer:", testOrganizer?._id);

    // Event 1: SAVE_THE_DATE
    console.log("[SEED] Creating SAVE_THE_DATE event...");
    const saveTheDateId = await ctx.db.insert("events", {
      name: "SteppersLife Spring Mixer 2026 - TEST",
      description: "Get ready for our biggest stepping event of the year! Save the date for an unforgettable night of music, dancing, and community. More details coming soon!",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "SAVE_THE_DATE",
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
      startDate: new Date("2026-03-15T19:00:00").getTime(),
      endDate: new Date("2026-03-15T23:00:00").getTime(),
      location: {
        venueName: "The Grand Ballroom",
        address: "123 Dance Street",
        city: "Chicago",
        state: "Illinois",
        zipCode: "60601",
        country: "USA",
      },
      categories: ["Set", "Social"],
      status: "PUBLISHED",
      ticketsVisible: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ SAVE_THE_DATE created:", saveTheDateId);

    // Event 2: FREE_EVENT with Door Price
    console.log("[SEED] Creating FREE_EVENT...");
    const freeEventId = await ctx.db.insert("events", {
      name: "Community Dance Night - TEST FREE",
      description: "Join us for a free community dance night! All skill levels welcome. Come learn new steps, practice your moves, and meet fellow stepping enthusiasts. Light refreshments provided.",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "FREE_EVENT",
      imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
      doorPrice: "$15 at the door",
      startDate: new Date("2025-11-10T20:00:00").getTime(),
      endDate: new Date("2025-11-10T23:00:00").getTime(),
      location: {
        venueName: "Community Center",
        address: "456 Main Street",
        city: "Atlanta",
        state: "Georgia",
        zipCode: "30303",
        country: "USA",
      },
      categories: ["Social", "Workshop"],
      status: "PUBLISHED",
      ticketsVisible: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ FREE_EVENT created:", freeEventId);

    // Event 3: TICKETED_EVENT with Multiple Tiers
    console.log("[SEED] Creating TICKETED_EVENT...");
    const ticketedEventId = await ctx.db.insert("events", {
      name: "SteppersLife Annual Gala - TEST PAID",
      description: "Black tie optional stepping gala featuring live DJ, professional performances, appetizers, and cash bar. Join us for an elegant evening of stepping at its finest. VIP packages include meet & greet with featured performers.",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "TICKETED_EVENT",
      imageUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&q=80",
      startDate: new Date("2025-12-31T21:00:00").getTime(),
      endDate: new Date("2026-01-01T02:00:00").getTime(),
      location: {
        venueName: "The Ritz Ballroom",
        address: "789 Elegance Ave",
        city: "Houston",
        state: "Texas",
        zipCode: "77002",
        country: "USA",
      },
      categories: ["Set", "Fundraiser"],
      status: "PUBLISHED",
      ticketsVisible: true,
      paymentModelSelected: true,
      maxTicketsPerOrder: 10,
      minTicketsPerOrder: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ TICKETED_EVENT created:", ticketedEventId);

    // Create Payment Config for Ticketed Event
    console.log("[SEED] Creating payment config...");
    const paymentConfigId = await ctx.db.insert("eventPaymentConfig", {
      eventId: ticketedEventId,
      organizerId: testOrganizer!._id,
      paymentModel: "PRE_PURCHASE",
      isActive: true,
      ticketsAllocated: 100,
      platformFeePercent: 5.0,
      platformFeeFixed: 179,
      processingFeePercent: 2.9,
      charityDiscount: false,
      lowPriceDiscount: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ Payment config created:", paymentConfigId);

    // Create Ticket Tiers
    console.log("[SEED] Creating ticket tiers...");

    const tier1Id = await ctx.db.insert("ticketTiers", {
      eventId: ticketedEventId,
      name: "Early Bird",
      description: "Save $20 with early registration",
      price: 4500, // $45.00 in cents
      quantity: 50,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ Tier 1 created: Early Bird");

    const tier2Id = await ctx.db.insert("ticketTiers", {
      eventId: ticketedEventId,
      name: "General Admission",
      description: "Standard ticket price",
      price: 6500, // $65.00 in cents
      quantity: 100,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ Tier 2 created: General Admission");

    const tier3Id = await ctx.db.insert("ticketTiers", {
      eventId: ticketedEventId,
      name: "VIP",
      description: "Premium seating and meet & greet",
      price: 12500, // $125.00 in cents
      quantity: 20,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ Tier 3 created: VIP");

    const tier4Id = await ctx.db.insert("ticketTiers", {
      eventId: ticketedEventId,
      name: "Student",
      description: "Valid student ID required",
      price: 2500, // $25.00 in cents
      quantity: 30,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log("[SEED] ✅ Tier 4 created: Student");

    console.log("[SEED] ========================================");
    console.log("[SEED] ✅ ALL TEST EVENTS CREATED SUCCESSFULLY!");
    console.log("[SEED] ========================================");
    console.log("[SEED] SAVE_THE_DATE ID:", saveTheDateId);
    console.log("[SEED] FREE_EVENT ID:", freeEventId);
    console.log("[SEED] TICKETED_EVENT ID:", ticketedEventId);
    console.log("[SEED]");
    console.log("[SEED] 📋 View events at:");
    console.log("[SEED] - Homepage: https://events.stepperslife.com");
    console.log("[SEED] - SAVE_THE_DATE: https://events.stepperslife.com/events/" + saveTheDateId);
    console.log("[SEED] - FREE_EVENT: https://events.stepperslife.com/events/" + freeEventId);
    console.log("[SEED] - TICKETED_EVENT: https://events.stepperslife.com/events/" + ticketedEventId);
    console.log("[SEED] ========================================");

    return {
      success: true,
      events: {
        saveTheDate: saveTheDateId,
        freeEvent: freeEventId,
        ticketedEvent: ticketedEventId,
      },
      tiers: [tier1Id, tier2Id, tier3Id, tier4Id],
      message: "Test events created successfully!",
    };
  },
});

/**
 * Create a simple $1 test event for production payment testing
 * Run with: npx convex run testSeed:createDollarTest
 */
export const createDollarTest = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[SEED] Creating $1 test event...");

    // Get or create test organizer
    let testOrganizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "test@stepperslife.com"))
      .first();

    if (!testOrganizer) {
      console.log("[SEED] Creating test organizer...");
      const organizerId = await ctx.db.insert("users", {
        email: "test@stepperslife.com",
        name: "Test Organizer",
        role: "organizer",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      testOrganizer = await ctx.db.get(organizerId);
    }

    // Create $1 Test Event
    const testEventId = await ctx.db.insert("events", {
      name: "$1 PRODUCTION TEST - DO NOT USE",
      description: "⚠️ This is a $1 test event for verifying the production payment system. Please use other events for actual ticket purchases.",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "TICKETED_EVENT",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80",
      startDate: new Date("2025-12-01T19:00:00").getTime(),
      endDate: new Date("2025-12-01T22:00:00").getTime(),
      location: {
        venueName: "Test Venue",
        address: "123 Test Street",
        city: "Test City",
        state: "Test State",
        zipCode: "12345",
        country: "USA",
      },
      categories: ["Social"],
      status: "PUBLISHED",
      ticketsVisible: true,
      paymentModelSelected: true,
      maxTicketsPerOrder: 5,
      minTicketsPerOrder: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create Payment Config
    const paymentConfigId = await ctx.db.insert("eventPaymentConfig", {
      eventId: testEventId,
      organizerId: testOrganizer!._id,
      paymentModel: "PRE_PURCHASE",
      isActive: true,
      ticketsAllocated: 10,
      platformFeePercent: 5.0,
      platformFeeFixed: 179,
      processingFeePercent: 2.9,
      charityDiscount: false,
      lowPriceDiscount: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create $1 Ticket Tier
    const tierId = await ctx.db.insert("ticketTiers", {
      eventId: testEventId,
      name: "$1 Test Ticket",
      description: "⚠️ Production payment test - $1 charge",
      price: 100, // $1.00 in cents
      quantity: 10,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("[SEED] ✅ $1 TEST EVENT CREATED!");
    console.log("[SEED] Event ID:", testEventId);
    console.log("[SEED] URL: https://events.stepperslife.com/events/" + testEventId);
    console.log("[SEED] Ticket Price: $1.00");

    return {
      success: true,
      eventId: testEventId,
      tierId: tierId,
      url: "https://events.stepperslife.com/events/" + testEventId,
      message: "$1 test event created successfully!",
    };
  },
});
