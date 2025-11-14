import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed test events for comprehensive testing
 * Run with: npx convex run test-seed:seedTestEvents
 */
export const seedTestEvents = mutation({
  args: {},
  handler: async (ctx) => {

    // Get or create test organizer
    let testOrganizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
      .first();

    if (!testOrganizer) {
      const organizerId = await ctx.db.insert("users", {
        email: "iradwatkins@gmail.com",
        name: "Test Organizer",
        role: "organizer",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      testOrganizer = await ctx.db.get(organizerId);
    }


    // Event 1: SAVE_THE_DATE
    const saveTheDateId = await ctx.db.insert("events", {
      name: "SteppersLife Spring Mixer 2026 - TEST",
      description:
        "Get ready for our biggest stepping event of the year! Save the date for an unforgettable night of music, dancing, and community. More details coming soon!",
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

    // Event 2: FREE_EVENT with Door Price
    const freeEventId = await ctx.db.insert("events", {
      name: "Community Dance Night - TEST FREE",
      description:
        "Join us for a free community dance night! All skill levels welcome. Come learn new steps, practice your moves, and meet fellow stepping enthusiasts. Light refreshments provided.",
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

    // Event 3: TICKETED_EVENT with Multiple Tiers
    const ticketedEventId = await ctx.db.insert("events", {
      name: "SteppersLife Annual Gala - TEST PAID",
      description:
        "Black tie optional stepping gala featuring live DJ, professional performances, appetizers, and cash bar. Join us for an elegant evening of stepping at its finest. VIP packages include meet & greet with featured performers.",
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

    // Create Payment Config for Ticketed Event
    const paymentConfigId = await ctx.db.insert("eventPaymentConfig", {
      eventId: ticketedEventId,
      organizerId: testOrganizer!._id,
      paymentModel: "PREPAY",
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

    // Create Ticket Tiers

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
 * Create 4 diverse test events with Unsplash images for product showcase
 * Run with: npx convex run testSeed:createShowcaseEvents
 */
export const createShowcaseEvents = mutation({
  args: {},
  handler: async (ctx) => {

    // Get or create test organizer
    let testOrganizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
      .first();

    if (!testOrganizer) {
      const organizerId = await ctx.db.insert("users", {
        email: "iradwatkins@gmail.com",
        name: "Test Organizer",
        role: "organizer",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      testOrganizer = await ctx.db.get(organizerId);
    }


    // EVENT 1: Intimate Jazz Night with Reserved Seating
    const jazzEventId = await ctx.db.insert("events", {
      name: "Intimate Jazz Night Under the Stars",
      description:
        "Experience an unforgettable evening of smooth jazz in an elegant setting. Featuring Grammy-nominated saxophonist Marcus Williams and his quartet. Includes complimentary wine and cheese reception. Reserved seating ensures the perfect view of the stage. Dress code: Smart casual.",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "TICKETED_EVENT",
      imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&q=80",
      startDate: new Date("2025-11-22T19:30:00").getTime(),
      endDate: new Date("2025-11-22T22:30:00").getTime(),
      location: {
        venueName: "The Blue Note Lounge",
        address: "567 Melody Lane",
        city: "New Orleans",
        state: "Louisiana",
        zipCode: "70112",
        country: "USA",
      },
      categories: ["Social", "Concert"],
      status: "PUBLISHED",
      ticketsVisible: true,
      paymentModelSelected: true,
      maxTicketsPerOrder: 6,
      minTicketsPerOrder: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Jazz event payment config
    await ctx.db.insert("eventPaymentConfig", {
      eventId: jazzEventId,
      organizerId: testOrganizer!._id,
      paymentModel: "PREPAY",
      isActive: true,
      ticketsAllocated: 120,
      platformFeePercent: 5.0,
      platformFeeFixed: 179,
      processingFeePercent: 2.9,
      charityDiscount: false,
      lowPriceDiscount: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Jazz event tiers
    const jazzTier1 = await ctx.db.insert("ticketTiers", {
      eventId: jazzEventId,
      name: "Front Row Premium",
      description: "Best seats in the house, first 3 rows",
      price: 7500, // $75.00
      quantity: 24,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const jazzTier2 = await ctx.db.insert("ticketTiers", {
      eventId: jazzEventId,
      name: "General Seating",
      description: "Great views, rows 4-8",
      price: 5500, // $55.00
      quantity: 60,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });


    // EVENT 2: Tech Innovation Summit
    const techEventId = await ctx.db.insert("events", {
      name: "Tech Innovation Summit 2025",
      description:
        "Join 500+ tech leaders, entrepreneurs, and innovators for a full day of keynotes, workshops, and networking. Topics include AI, Web3, Cybersecurity, and SaaS growth strategies. Includes lunch, networking mixer, and exclusive access to startup pitch competition. Early bird pricing ends Nov 1st!",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "TICKETED_EVENT",
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
      startDate: new Date("2026-02-15T08:00:00").getTime(),
      endDate: new Date("2026-02-15T18:00:00").getTime(),
      location: {
        venueName: "Convention Center West",
        address: "1200 Innovation Drive",
        city: "San Francisco",
        state: "California",
        zipCode: "94102",
        country: "USA",
      },
      categories: ["Conference", "Workshop"],
      status: "PUBLISHED",
      ticketsVisible: true,
      paymentModelSelected: true,
      maxTicketsPerOrder: 10,
      minTicketsPerOrder: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Tech event payment config
    await ctx.db.insert("eventPaymentConfig", {
      eventId: techEventId,
      organizerId: testOrganizer!._id,
      paymentModel: "PREPAY",
      isActive: true,
      ticketsAllocated: 500,
      platformFeePercent: 5.0,
      platformFeeFixed: 179,
      processingFeePercent: 2.9,
      charityDiscount: false,
      lowPriceDiscount: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Tech event tiers
    await ctx.db.insert("ticketTiers", {
      eventId: techEventId,
      name: "Early Bird",
      description: "Limited time - save $150! Ends Nov 1st",
      price: 19900, // $199.00
      quantity: 100,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("ticketTiers", {
      eventId: techEventId,
      name: "Standard Admission",
      description: "Full conference access",
      price: 34900, // $349.00
      quantity: 300,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("ticketTiers", {
      eventId: techEventId,
      name: "VIP All-Access",
      description: "Speaker dinner, premium seating, swag bag",
      price: 59900, // $599.00
      quantity: 50,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });


    // EVENT 3: Summer Music Festival
    const festivalEventId = await ctx.db.insert("events", {
      name: "Sunset Music Festival 2026",
      description:
        "3 days of non-stop music featuring 40+ artists across 5 stages! Headliners include The Electric Dreams, Luna Sky, and Basswave. General admission, VIP, and camping passes available. Food trucks, art installations, yoga sessions, and more. Rain or shine event. Ages 18+. ID required.",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "TICKETED_EVENT",
      imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80",
      startDate: new Date("2026-07-10T14:00:00").getTime(),
      endDate: new Date("2026-07-12T23:00:00").getTime(),
      location: {
        venueName: "Riverside Festival Grounds",
        address: "2500 Festival Way",
        city: "Austin",
        state: "Texas",
        zipCode: "78701",
        country: "USA",
      },
      categories: ["Concert", "Festival"],
      status: "PUBLISHED",
      ticketsVisible: true,
      paymentModelSelected: true,
      maxTicketsPerOrder: 8,
      minTicketsPerOrder: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Festival event payment config
    await ctx.db.insert("eventPaymentConfig", {
      eventId: festivalEventId,
      organizerId: testOrganizer!._id,
      paymentModel: "PREPAY",
      isActive: true,
      ticketsAllocated: 10000,
      platformFeePercent: 5.0,
      platformFeeFixed: 179,
      processingFeePercent: 2.9,
      charityDiscount: false,
      lowPriceDiscount: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Festival event tiers
    await ctx.db.insert("ticketTiers", {
      eventId: festivalEventId,
      name: "3-Day GA Pass",
      description: "General admission to all stages",
      price: 27900, // $279.00
      quantity: 8000,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("ticketTiers", {
      eventId: festivalEventId,
      name: "VIP Experience",
      description: "Premium viewing areas, lounge access, express entry",
      price: 54900, // $549.00
      quantity: 1500,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("ticketTiers", {
      eventId: festivalEventId,
      name: "Camping + GA Pass",
      description: "3-day pass + tent camping spot",
      price: 39900, // $399.00
      quantity: 500,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });


    // EVENT 4: Wine Tasting & Networking
    const wineEventId = await ctx.db.insert("events", {
      name: "Executive Wine Tasting & Networking",
      description:
        "An exclusive evening for professionals to connect over premium wines from Napa Valley and Sonoma. Guided tasting of 8 wines paired with artisan cheeses and charcuterie. Sommelier-led discussion on wine regions, tasting notes, and pairing principles. Perfect for wine enthusiasts and business networking. Limited to 60 guests for intimate atmosphere.",
      organizerId: testOrganizer!._id,
      organizerName: testOrganizer!.name,
      eventType: "TICKETED_EVENT",
      imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80",
      startDate: new Date("2025-12-05T18:00:00").getTime(),
      endDate: new Date("2025-12-05T21:00:00").getTime(),
      location: {
        venueName: "The Vineyard Room",
        address: "890 Sommelier Street",
        city: "Seattle",
        state: "Washington",
        zipCode: "98101",
        country: "USA",
      },
      categories: ["Social", "Workshop"],
      status: "PUBLISHED",
      ticketsVisible: true,
      paymentModelSelected: true,
      maxTicketsPerOrder: 4,
      minTicketsPerOrder: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Wine event payment config
    await ctx.db.insert("eventPaymentConfig", {
      eventId: wineEventId,
      organizerId: testOrganizer!._id,
      paymentModel: "PREPAY",
      isActive: true,
      ticketsAllocated: 60,
      platformFeePercent: 5.0,
      platformFeeFixed: 179,
      processingFeePercent: 2.9,
      charityDiscount: false,
      lowPriceDiscount: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Wine event tiers
    await ctx.db.insert("ticketTiers", {
      eventId: wineEventId,
      name: "Individual Ticket",
      description: "One guest admission with full tasting experience",
      price: 8500, // $85.00
      quantity: 40,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("ticketTiers", {
      eventId: wineEventId,
      name: "Couple's Package",
      description: "Two guests - save $20!",
      price: 15000, // $150.00
      quantity: 10,
      sold: 0,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });



    return {
      success: true,
      events: {
        jazzNight: jazzEventId,
        techSummit: techEventId,
        musicFestival: festivalEventId,
        wineTasting: wineEventId,
      },
      message: "4 showcase events created successfully!",
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

    // Get or create test organizer
    let testOrganizer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "iradwatkins@gmail.com"))
      .first();

    if (!testOrganizer) {
      const organizerId = await ctx.db.insert("users", {
        email: "iradwatkins@gmail.com",
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
      description:
        "⚠️ This is a $1 test event for verifying the production payment system. Please use other events for actual ticket purchases.",
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
      paymentModel: "PREPAY",
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


    return {
      success: true,
      eventId: testEventId,
      tierId: tierId,
      url: "https://events.stepperslife.com/events/" + testEventId,
      message: "$1 test event created successfully!",
    };
  },
});
