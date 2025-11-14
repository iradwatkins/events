import { mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Helper function to calculate future dates
 */
function addDays(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

/**
 * Create all 5 comprehensive test events
 */
export const createAllTestEvents = mutation({
  args: {},
  handler: async (ctx) => {

    const results = {
      event1: null as any,
      event2: null as any,
      event3: null as any,
      event4: null as any,
      event5: null as any,
    };

    try {
      // EVENT 1: Single Ticket Event
      results.event1 = await ctx.runMutation(api.testEvents.createSingleTicketEvent, {});

      // EVENT 2: Multi-Day Event
      results.event2 = await ctx.runMutation(api.testEvents.createMultiDayEvent, {});

      // EVENT 3: Multi-Day Bundle Event
      results.event3 = await ctx.runMutation(api.testEvents.createBundleEvent, {});

      // EVENT 4: Early Bird Special Event
      results.event4 = await ctx.runMutation(api.testEvents.createEarlyBirdEvent, {});

      // EVENT 5: Seating Chart Event
      results.event5 = await ctx.runMutation(api.testEvents.createSeatingChartEvent, {});


      return {
        success: true,
        message: "All 5 test events created successfully",
        events: results,
      };
    } catch (error) {
      console.error("❌ Error creating test events:", error);
      throw error;
    }
  },
});

/**
 * EVENT 1: Single Ticket Event - "Summer Stepping Social"
 */
export const createSingleTicketEvent = mutation({
  args: {},
  handler: async (ctx): Promise<{ eventId: Id<"events">; name: string }> => {
    // Create event
    const eventId: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "Summer Stepping Social",
      eventType: "TICKETED_EVENT",
      description:
        "Join us for an evening of steppin' and socializing! Perfect for beginners and experienced steppers alike. Live DJ, refreshments, and great vibes guaranteed.",
      categories: ["Social", "Set"],
      startDate: addDays(14), // 2 weeks from now
      endDate: addDays(14) + 4 * 60 * 60 * 1000, // +4 hours
      timezone: "America/Chicago",
      location: {
        venueName: "Chicago Steppers Paradise",
        address: "123 Michigan Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60601",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
      eventDateLiteral: "July 15, 2025",
      eventTimeLiteral: "8:00 PM - 12:00 AM",
      eventTimezone: "CST",
    });

    // Configure payment
    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId,
      model: "PREPAY",
      platformFeePercent: 0,
      platformFeeFixed: 0,
    });

    // Create single ticket tier
    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "General Admission",
      description: "Admission to the event with full access to dance floor and refreshments",
      price: 2500, // $25.00
      quantity: 100,
    });

    return { eventId, name: "Summer Stepping Social" };
  },
});

/**
 * EVENT 2: Multi-Day Event - "Stepping Weekend Workshop"
 */
export const createMultiDayEvent = mutation({
  args: {},
  handler: async (ctx): Promise<{ eventId: Id<"events">; name: string }> => {
    // Create event
    const eventId: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "Stepping Weekend Workshop",
      eventType: "TICKETED_EVENT",
      description:
        "Three days of intensive stepping workshops with master instructors! Learn advanced techniques, classic moves, and connect with steppers from across the country. Each day features different workshop themes.",
      categories: ["Workshop", "Class"],
      startDate: addDays(30), // 1 month from now
      endDate: addDays(32) + 4 * 60 * 60 * 1000, // 3 days later
      timezone: "America/New_York",
      location: {
        venueName: "Atlanta Dance Complex",
        address: "456 Peachtree St",
        city: "Atlanta",
        state: "GA",
        zipCode: "30303",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80",
      eventDateLiteral: "August 14-16, 2025",
      eventTimeLiteral: "6:00 PM - 10:00 PM each day",
      eventTimezone: "EST",
    });

    // Configure payment
    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId,
      model: "PREPAY",
      platformFeePercent: 0,
      platformFeeFixed: 0,
    });

    // Create 3 day-specific ticket tiers
    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Friday Workshop - Foundations",
      description: "Focus on footwork fundamentals and basic stepping techniques",
      price: 3000, // $30.00
      quantity: 50,
    });

    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Saturday Workshop - Advanced",
      description: "Advanced patterns, turns, and styling for experienced steppers",
      price: 3500, // $35.00
      quantity: 50,
    });

    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Sunday Workshop - Partner Work",
      description: "Connection, leading/following, and partner communication",
      price: 3000, // $30.00
      quantity: 50,
    });

    return { eventId, name: "Stepping Weekend Workshop" };
  },
});

/**
 * EVENT 3: Multi-Day Bundle Event - "3-Day Stepping Festival"
 */
export const createBundleEvent = mutation({
  args: {},
  handler: async (ctx): Promise<{ eventId: Id<"events">; name: string }> => {
    // Create event
    const eventId: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "3-Day Stepping Festival",
      eventType: "TICKETED_EVENT",
      description:
        "The ultimate stepping experience in Las Vegas! Three incredible nights of non-stop steppin' featuring live bands, celebrity DJs, and steppers from around the world. Individual day passes or save with our Festival Pass!",
      categories: ["Festival", "Set", "Social"],
      startDate: addDays(60), // 2 months from now
      endDate: addDays(62) + 6 * 60 * 60 * 1000, // 3 days
      timezone: "America/Los_Angeles",
      location: {
        venueName: "Las Vegas Convention Center - Grand Ballroom",
        address: "3150 Paradise Rd",
        city: "Las Vegas",
        state: "NV",
        zipCode: "89109",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
      eventDateLiteral: "September 12-14, 2025",
      eventTimeLiteral: "8:00 PM - 2:00 AM each night",
      eventTimezone: "PST",
    });

    // Configure payment
    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId,
      model: "PREPAY",
      platformFeePercent: 0,
      platformFeeFixed: 0,
    });

    // Create 3 individual day passes
    const day1TierId: Id<"ticketTiers"> = await ctx.runMutation(
      api.tickets.mutations.createTicketTier,
      {
        eventId,
        name: "Friday Night Pass",
        description: "Opening night with live band and special performances",
        price: 4000, // $40.00
        quantity: 80,
      }
    );

    const day2TierId: Id<"ticketTiers"> = await ctx.runMutation(
      api.tickets.mutations.createTicketTier,
      {
        eventId,
        name: "Saturday Night Pass",
        description: "Peak night with celebrity DJ and midnight show",
        price: 4500, // $45.00
        quantity: 80,
      }
    );

    const day3TierId: Id<"ticketTiers"> = await ctx.runMutation(
      api.tickets.mutations.createTicketTier,
      {
        eventId,
        name: "Sunday Night Pass",
        description: "Closing night with awards ceremony and farewell set",
        price: 4000, // $40.00
        quantity: 80,
      }
    );

    // Create bundle - Festival Pass
    await ctx.runMutation(api.bundles.mutations.createTicketBundle, {
      eventId,
      name: "Festival Pass - All 3 Nights",
      description:
        "Save $26! Access to all three nights of the festival. Best value for the ultimate stepping experience!",
      price: 9900, // $99.00 (save $26 vs $125 total)
      totalQuantity: 60,
      includedTiers: [
        { tierId: day1TierId, tierName: "Friday Night Pass", quantity: 1 },
        { tierId: day2TierId, tierName: "Saturday Night Pass", quantity: 1 },
        { tierId: day3TierId, tierName: "Sunday Night Pass", quantity: 1 },
      ],
    });

    return { eventId, name: "3-Day Stepping Festival" };
  },
});

/**
 * EVENT 4: Early Bird Special Event - "New Year's Stepping Gala"
 */
export const createEarlyBirdEvent = mutation({
  args: {},
  handler: async (ctx): Promise<{ eventId: Id<"events">; name: string }> => {
    // Create event
    const eventId: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "New Year's Stepping Gala",
      eventType: "TICKETED_EVENT",
      description:
        "Ring in the New Year with elegance and style! Black-tie stepping gala featuring champagne toast at midnight, gourmet dinner, live orchestra, and the best steppers in NYC. Limited capacity - early bird pricing available!",
      categories: ["Gala", "Set", "Special Event"],
      startDate: addDays(90), // 3 months from now
      endDate: addDays(90) + 6 * 60 * 60 * 1000, // +6 hours
      timezone: "America/New_York",
      location: {
        venueName: "The Plaza Hotel - Grand Ballroom",
        address: "768 Fifth Ave",
        city: "New York",
        state: "NY",
        zipCode: "10019",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
      eventDateLiteral: "December 31, 2025",
      eventTimeLiteral: "9:00 PM - 3:00 AM",
      eventTimezone: "EST",
    });

    // Configure payment
    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId,
      model: "PREPAY",
      platformFeePercent: 0,
      platformFeeFixed: 0,
    });

    // Create ticket tier with early bird pricing
    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Gala Admission",
      description: "Includes dinner, champagne toast, and full access to ballroom and dance floor",
      price: 6500, // Regular price $65.00
      quantity: 150,
      pricingTiers: [
        {
          name: "Super Early Bird - $45",
          price: 4500, // $45.00
          availableFrom: Date.now(),
          availableUntil: addDays(45), // Available until 45 days before event
        },
        {
          name: "Early Bird - $55",
          price: 5500, // $55.00
          availableFrom: addDays(45),
          availableUntil: addDays(70), // 45 days until 20 days before
        },
        {
          name: "Regular Price - $65",
          price: 6500, // $65.00
          availableFrom: addDays(70),
          // No availableUntil for last tier - valid until event
        },
      ],
    });

    return { eventId, name: "New Year's Stepping Gala" };
  },
});

/**
 * EVENT 5: Seating Chart Event - "Elegant Dinner & Set"
 */
export const createSeatingChartEvent = mutation({
  args: {},
  handler: async (ctx): Promise<{ eventId: Id<"events">; name: string }> => {
    // Create event
    const eventId: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "Elegant Dinner & Set",
      eventType: "TICKETED_EVENT",
      description:
        "An intimate evening combining fine dining with exceptional stepping. Five-course gourmet meal followed by a premium stepping set with live music. Reserved table seating ensures you and your party sit together. VIP table includes premium champagne service.",
      categories: ["Dinner", "Set", "VIP"],
      startDate: addDays(42), // 6 weeks from now
      endDate: addDays(42) + 5 * 60 * 60 * 1000, // +5 hours
      timezone: "America/Chicago",
      location: {
        venueName: "The Ritz Ballroom",
        address: "789 Main St",
        city: "Houston",
        state: "TX",
        zipCode: "77002",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1519167758481-83f29da8c20c?w=800&q=80",
      eventDateLiteral: "August 28, 2025",
      eventTimeLiteral: "7:00 PM - 12:00 AM",
      eventTimezone: "CST",
    });

    // Configure payment
    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId,
      model: "PREPAY",
      platformFeePercent: 0,
      platformFeeFixed: 0,
    });

    // Create VIP ticket tier
    const vipTierId: Id<"ticketTiers"> = await ctx.runMutation(
      api.tickets.mutations.createTicketTier,
      {
        eventId,
        name: "VIP Table Seat",
        description: "Premium seating, champagne service, upgraded menu selections",
        price: 10000, // $100.00
        quantity: 4, // 1 VIP table × 4 seats
      }
    );

    // Create Standard ticket tier
    const standardTierId: Id<"ticketTiers"> = await ctx.runMutation(
      api.tickets.mutations.createTicketTier,
      {
        eventId,
        name: "Standard Table Seat",
        description: "Reserved seating, gourmet dinner, and access to dance floor",
        price: 6000, // $60.00
        quantity: 16, // 4 standard tables × 4 seats
      }
    );

    // Create seating chart with 5 tables
    await ctx.runMutation(api.seating.mutations.createSeatingChart, {
      eventId,
      name: "Main Ballroom",
      seatingStyle: "TABLE_BASED",
      sections: [
        {
          id: "vip-section",
          name: "VIP Section",
          color: "#FFD700", // Gold
          containerType: "TABLES",
          ticketTierId: vipTierId,
          tables: [
            {
              id: "table-vip-1",
              number: 1,
              shape: "ROUND",
              x: 250,
              y: 150,
              width: 120,
              height: 120,
              capacity: 4,
              seats: [
                { id: "vip-1-seat-1", number: "1", type: "VIP", status: "AVAILABLE" },
                { id: "vip-1-seat-2", number: "2", type: "VIP", status: "AVAILABLE" },
                { id: "vip-1-seat-3", number: "3", type: "VIP", status: "AVAILABLE" },
                { id: "vip-1-seat-4", number: "4", type: "VIP", status: "AVAILABLE" },
              ],
            },
          ],
        },
        {
          id: "standard-section",
          name: "Standard Section",
          color: "#4A90E2", // Blue
          containerType: "TABLES",
          ticketTierId: standardTierId,
          tables: [
            {
              id: "table-std-2",
              number: 2,
              shape: "ROUND",
              x: 100,
              y: 300,
              width: 100,
              height: 100,
              capacity: 4,
              seats: [
                { id: "std-2-seat-1", number: "1", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-2-seat-2", number: "2", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-2-seat-3", number: "3", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-2-seat-4", number: "4", type: "STANDARD", status: "AVAILABLE" },
              ],
            },
            {
              id: "table-std-3",
              number: 3,
              shape: "ROUND",
              x: 250,
              y: 300,
              width: 100,
              height: 100,
              capacity: 4,
              seats: [
                { id: "std-3-seat-1", number: "1", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-3-seat-2", number: "2", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-3-seat-3", number: "3", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-3-seat-4", number: "4", type: "STANDARD", status: "AVAILABLE" },
              ],
            },
            {
              id: "table-std-4",
              number: 4,
              shape: "ROUND",
              x: 400,
              y: 300,
              width: 100,
              height: 100,
              capacity: 4,
              seats: [
                { id: "std-4-seat-1", number: "1", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-4-seat-2", number: "2", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-4-seat-3", number: "3", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-4-seat-4", number: "4", type: "STANDARD", status: "AVAILABLE" },
              ],
            },
            {
              id: "table-std-5",
              number: 5,
              shape: "ROUND",
              x: 250,
              y: 450,
              width: 100,
              height: 100,
              capacity: 4,
              seats: [
                { id: "std-5-seat-1", number: "1", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-5-seat-2", number: "2", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-5-seat-3", number: "3", type: "STANDARD", status: "AVAILABLE" },
                { id: "std-5-seat-4", number: "4", type: "STANDARD", status: "AVAILABLE" },
              ],
            },
          ],
        },
      ],
    });

    return { eventId, name: "Elegant Dinner & Set" };
  },
});
