import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Create realistic stepping events for testing
 * These will have real dates, times, and look like actual events
 */
export const createRealTestEvents = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; events: any[] }> => {

    const events = [];

    // Event 1: Thanksgiving Weekend Steppin' Social - November 29, 2025
    const event1Id: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "Thanksgiving Weekend Steppin' Social",
      description:
        "Join us for a post-Thanksgiving stepping celebration! Great music, great people, and great steppin'. Bring your appetite for dancing after all that turkey! DJ Rockin' Rodney will be spinning classic stepping tracks all night long.",
      eventType: "TICKETED_EVENT",
      categories: ["Social", "Set", "Holiday"],
      startDate: new Date("2025-11-29T20:00:00").getTime(), // Nov 29, 2025 8:00 PM
      endDate: new Date("2025-11-30T01:00:00").getTime(), // Nov 30, 2025 1:00 AM
      eventDateLiteral: "Saturday, November 29, 2025",
      eventTimeLiteral: "8:00 PM - 1:00 AM",
      timezone: "America/Chicago",
      eventTimezone: "CST",
      location: {
        venueName: "The Regal Ballroom",
        address: "5214 S. Harper Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60615",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    });

    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId: event1Id,
      model: "PREPAY",
    });

    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId: event1Id,
      name: "General Admission",
      description: "Full access to the dance floor, light refreshments included",
      price: 3000, // $30
      quantity: 150,
    });

    events.push({ eventId: event1Id, name: "Thanksgiving Weekend Steppin' Social" });

    // Event 2: Holiday Steppin' Extravaganza - December 20, 2025
    const event2Id: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "Holiday Steppin' Extravaganza",
      description:
        "Get in the holiday spirit with Chicago's premier stepping event! Featuring live band performances, holiday-themed music, complimentary holiday treats, and a special midnight toast. Dress in your festive best!",
      eventType: "TICKETED_EVENT",
      categories: ["Gala", "Holiday", "Set"],
      startDate: new Date("2025-12-20T19:00:00").getTime(), // Dec 20, 2025 7:00 PM
      endDate: new Date("2025-12-21T01:00:00").getTime(), // Dec 21, 2025 1:00 AM
      eventDateLiteral: "Saturday, December 20, 2025",
      eventTimeLiteral: "7:00 PM - 1:00 AM",
      timezone: "America/Chicago",
      eventTimezone: "CST",
      location: {
        venueName: "Palmer House Hilton - Grand Ballroom",
        address: "17 E Monroe St",
        city: "Chicago",
        state: "IL",
        zipCode: "60603",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    });

    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId: event2Id,
      model: "PREPAY",
    });

    // Early Bird Pricing for Holiday Event
    const now = Date.now();
    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId: event2Id,
      name: "Holiday Gala Admission",
      description: "Includes dinner, holiday treats, champagne toast, and full dance access",
      price: 7500, // Regular $75
      quantity: 200,
      pricingTiers: [
        {
          name: "Early Bird Special",
          price: 5500, // $55
          availableFrom: now,
          availableUntil: new Date("2025-12-01T23:59:59").getTime(),
        },
        {
          name: "Advance Purchase",
          price: 6500, // $65
          availableFrom: new Date("2025-12-01T23:59:59").getTime(),
          availableUntil: new Date("2025-12-15T23:59:59").getTime(),
        },
        {
          name: "Regular Price",
          price: 7500, // $75
          availableFrom: new Date("2025-12-15T23:59:59").getTime(),
        },
      ],
    });

    events.push({ eventId: event2Id, name: "Holiday Steppin' Extravaganza" });

    // Event 3: New Year's Eve Stepping Celebration - December 31, 2025
    const event3Id: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "New Year's Eve Stepping Celebration 2026",
      description:
        "Ring in 2026 with the most elegant stepping event of the year! Black-tie optional affair featuring champagne toast at midnight, gourmet dinner, premium open bar, party favors, and the hottest DJs in Chicago. This is THE event to end 2025!",
      eventType: "TICKETED_EVENT",
      categories: ["Gala", "Special Event", "Holiday"],
      startDate: new Date("2025-12-31T21:00:00").getTime(), // Dec 31, 2025 9:00 PM
      endDate: new Date("2026-01-01T03:00:00").getTime(), // Jan 1, 2026 3:00 AM
      eventDateLiteral: "Wednesday, December 31, 2025",
      eventTimeLiteral: "9:00 PM - 3:00 AM",
      timezone: "America/Chicago",
      eventTimezone: "CST",
      location: {
        venueName: "Navy Pier - Grand Ballroom",
        address: "600 E Grand Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60611",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=800&q=80",
    });

    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId: event3Id,
      model: "PREPAY",
    });

    const vipTierId: Id<"ticketTiers"> = await ctx.runMutation(
      api.tickets.mutations.createTicketTier,
      {
        eventId: event3Id,
        name: "VIP Package",
        description:
          "Premium seating, bottle service, exclusive VIP lounge access, gourmet dinner, and champagne",
        price: 15000, // $150
        quantity: 50,
      }
    );

    const generalTierId: Id<"ticketTiers"> = await ctx.runMutation(
      api.tickets.mutations.createTicketTier,
      {
        eventId: event3Id,
        name: "General Admission",
        description: "Includes dinner, open bar, midnight champagne toast, and dance floor access",
        price: 10000, // $100
        quantity: 250,
      }
    );

    events.push({ eventId: event3Id, name: "New Year's Eve Stepping Celebration 2026" });

    // Event 4: Sunday Afternoon Steppers Set - December 7, 2025
    const event4Id: Id<"events"> = await ctx.runMutation(api.events.mutations.createEvent, {
      name: "Sunday Afternoon Steppers Set",
      description:
        "Perfect way to end your weekend! Relaxed afternoon stepping session with smooth grooves and chill vibes. Great for beginners and seasoned steppers alike. Light appetizers and cash bar available.",
      eventType: "TICKETED_EVENT",
      categories: ["Social", "Set"],
      startDate: new Date("2025-12-07T15:00:00").getTime(), // Dec 7, 2025 3:00 PM
      endDate: new Date("2025-12-07T19:00:00").getTime(), // Dec 7, 2025 7:00 PM
      eventDateLiteral: "Sunday, December 7, 2025",
      eventTimeLiteral: "3:00 PM - 7:00 PM",
      timezone: "America/Chicago",
      eventTimezone: "CST",
      location: {
        venueName: "South Shore Cultural Center",
        address: "7059 S South Shore Dr",
        city: "Chicago",
        state: "IL",
        zipCode: "60649",
        country: "USA",
      },
      imageUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
    });

    await ctx.runMutation(api.events.mutations.configurePayment, {
      eventId: event4Id,
      model: "PREPAY",
    });

    await ctx.runMutation(api.tickets.mutations.createTicketTier, {
      eventId: event4Id,
      name: "Afternoon Pass",
      description: "4 hours of stepping, light appetizers included",
      price: 2500, // $25
      quantity: 100,
    });

    events.push({ eventId: event4Id, name: "Sunday Afternoon Steppers Set" });


    return {
      success: true,
      events,
    };
  },
});
