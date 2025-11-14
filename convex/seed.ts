import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed sample events for testing
 * Run this once in Convex dashboard: `await ctx.runMutation(internal.seed.createSampleEvents, {})`
 */
export const createSampleEvents = mutation({
  args: {},
  handler: async (ctx) => {
    // Create a sample organizer user
    const organizerId = await ctx.db.insert("users", {
      email: "organizer@stepperslife.com",
      name: "SteppersLife Events",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Sample events data
    const sampleEvents = [
      {
        name: "Chicago Steppers Set - Summer Edition",
        description:
          "Join us for an unforgettable night of Chicago Stepping! This summer edition features live DJ sets, professional dancers, and an electric atmosphere. Whether you're a seasoned stepper or just starting out, everyone is welcome. Free dance lessons from 7-8pm for beginners!\n\nDress code: Semi-formal attire recommended.",
        eventType: "TICKETED_EVENT" as const,
        startDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000, // +5 hours
        location: {
          venueName: "The Grand Ballroom",
          address: "123 Michigan Avenue",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
        },
        categories: ["Set", "Weekend Event"],
        capacity: 500,
        imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
        ticketsVisible: true,
        paymentModelSelected: true,
        status: "PUBLISHED" as const,
        contactEmail: "chicago@stepperslife.com",
        additionalDetails:
          "Parking available at nearby garage. Food and drinks available for purchase.",
        socialShareCount: 45,
      },
      {
        name: "Steppin' Workshop: Mastering the Basics",
        description:
          "Perfect for beginners! Learn the fundamentals of Chicago Stepping in this comprehensive 3-hour workshop. Our experienced instructors will guide you through:\n\n• Basic footwork and rhythm\n• Partner connection and leading/following\n• Essential turns and patterns\n• Practice time with music\n\nAll levels welcome, but especially designed for those new to stepping.",
        eventType: "TICKETED_EVENT" as const,
        startDate: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
        endDate: Date.now() + 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
        location: {
          venueName: "Dance Studio 360",
          address: "456 State Street",
          city: "Atlanta",
          state: "GA",
          zipCode: "30303",
        },
        categories: ["Workshop"],
        capacity: 50,
        imageUrl: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&q=80",
        ticketsVisible: true,
        paymentModelSelected: true,
        status: "PUBLISHED" as const,
        contactEmail: "atlanta@stepperslife.com",
        additionalDetails:
          "Comfortable shoes required. Water provided. Partners not required - we rotate!",
        socialShareCount: 23,
      },
      {
        name: "Memorial Day Weekend Steppers Cruise 2025",
        description:
          "Set sail for the ultimate stepping experience! Join fellow steppers for a 4-day Caribbean cruise featuring:\n\n• Daily stepping sessions with live bands\n• Pool parties and deck sets\n• Professional performances\n• Dance workshops\n• Island excursions\n• All meals included\n\nCabin availability limited - book early!",
        eventType: "SAVE_THE_DATE" as const,
        startDate: Date.now() + 180 * 24 * 60 * 60 * 1000, // 180 days from now
        endDate: Date.now() + 184 * 24 * 60 * 60 * 1000,
        location: {
          venueName: "Port of Miami",
          address: "1015 N America Way",
          city: "Miami",
          state: "FL",
          zipCode: "33132",
        },
        categories: ["Cruise", "Holiday Event", "Weekend Event"],
        capacity: 2000,
        imageUrl: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80",
        ticketsVisible: false,
        paymentModelSelected: false,
        status: "PUBLISHED" as const,
        contactEmail: "cruise@stepperslife.com",
        additionalDetails:
          "More details coming soon! Early bird pricing will be announced in 60 days.",
        socialShareCount: 89,
      },
      {
        name: "Outdoor Steppin' in the Park - Free Community Event",
        description:
          "Bring your friends and family for a FREE afternoon of stepping in beautiful Millennium Park! This community event features:\n\n• Live DJ from 2pm-7pm\n• Free beginner lessons at 2:30pm\n• Open dancing for all skill levels\n• Food trucks on site\n• Family friendly atmosphere\n\nNo registration required - just show up and step!",
        eventType: "FREE_EVENT" as const,
        startDate: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
        endDate: Date.now() + 45 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000,
        location: {
          venueName: "Millennium Park",
          address: "201 E Randolph St",
          city: "Chicago",
          state: "IL",
          zipCode: "60602",
        },
        categories: ["Outdoors Steppin", "Set"],
        capacity: 1000,
        imageUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
        ticketsVisible: false,
        paymentModelSelected: false,
        status: "PUBLISHED" as const,
        contactEmail: "community@stepperslife.com",
        additionalDetails:
          "Bring sunscreen and comfortable shoes. Event will be moved indoors if weather is poor.",
        socialShareCount: 156,
      },
      {
        name: "New Year's Eve Steppers Ball 2025",
        description:
          "Ring in the New Year with the most elegant stepping event of the season! This formal gala includes:\n\n• Champagne reception at 9pm\n• Live band and DJ\n• Midnight countdown celebration\n• Complimentary party favors\n• Professional photography\n• Elegant ballroom setting\n\nBlack tie optional. VIP tables available.",
        eventType: "TICKETED_EVENT" as const,
        startDate: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
        endDate: Date.now() + 60 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000,
        location: {
          venueName: "Hilton Downtown",
          address: "720 S Michigan Ave",
          city: "Chicago",
          state: "IL",
          zipCode: "60605",
        },
        categories: ["Holiday Event", "Set"],
        capacity: 800,
        imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
        ticketsVisible: true,
        paymentModelSelected: true,
        status: "PUBLISHED" as const,
        contactEmail: "nye@stepperslife.com",
        additionalDetails:
          "Valet parking included. Hotel room packages available at discounted rate.",
        socialShareCount: 234,
      },
      {
        name: "Detroit Steppers Weekend Getaway",
        description:
          "Experience Motor City stepping culture! This weekend event features:\n\n• Friday night welcome party\n• Saturday afternoon workshop\n• Saturday night grand set\n• Sunday brunch and farewell session\n• Hotel block with group rates\n\nDiscover why Detroit has one of the most vibrant stepping scenes in the country!",
        eventType: "TICKETED_EVENT" as const,
        startDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
        endDate: Date.now() + 92 * 24 * 60 * 60 * 1000,
        location: {
          venueName: "MGM Grand Detroit",
          address: "1777 3rd Ave",
          city: "Detroit",
          state: "MI",
          zipCode: "48226",
        },
        categories: ["Weekend Event", "Set", "Workshop"],
        capacity: 400,
        imageUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
        ticketsVisible: true,
        paymentModelSelected: true,
        status: "PUBLISHED" as const,
        contactEmail: "detroit@stepperslife.com",
        additionalDetails: "Weekend pass includes all events. Single event tickets also available.",
        socialShareCount: 67,
      },
    ];

    // Insert all sample events
    const eventIds = [];
    for (const event of sampleEvents) {
      const eventId = await ctx.db.insert("events", {
        name: event.name,
        description: event.description,
        organizerId,
        organizerName: "SteppersLife Events",
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: "America/Chicago",
        location: {
          address: event.location.address,
          city: event.location.city,
          state: event.location.state,
          zipCode: event.location.zipCode,
          country: "US",
        },
        images: [],
        imageUrl: event.imageUrl,
        categories: event.categories,
        status: event.status,
        ticketsVisible: event.ticketsVisible,
        paymentModelSelected: event.paymentModelSelected,
        allowWaitlist: true,
        allowTransfers: true,
        maxTicketsPerOrder: 10,
        minTicketsPerOrder: 1,
        socialShareCount: event.socialShareCount,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      eventIds.push(eventId);

      // Create organizer credits for the first event (200 free tickets)
      if (eventIds.length === 1) {
        await ctx.db.insert("organizerCredits", {
          organizerId,
          creditsTotal: 200,
          creditsUsed: 0,
          creditsRemaining: 200,
          firstEventFreeUsed: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Create payment config and tickets for ticketed events
      if (event.eventType === "TICKETED_EVENT" && event.ticketsVisible) {
        await ctx.db.insert("eventPaymentConfig", {
          eventId,
          organizerId,
          paymentModel: "PREPAY",
          platformFeePercent: 0,
          platformFeeFixed: 0,
          processingFeePercent: 2.9,
          charityDiscount: false,
          lowPriceDiscount: false,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Create sample ticket tiers
        const ticketTypes = [
          { name: "General Admission", price: 3500, inventory: 300 },
          { name: "VIP", price: 7500, inventory: 100 },
        ];

        for (const ticket of ticketTypes) {
          await ctx.db.insert("tickets", {
            eventId,
            ticketType: ticket.name,
            description: `${ticket.name} ticket`,
            price: ticket.price,
            quantityTotal: ticket.inventory,
            quantitySold: Math.floor(Math.random() * 50), // Random sold count
            quantityReserved: 0,
            salesStart: Date.now(),
            salesEnd: event.startDate,
            maxPerOrder: 10,
            minPerOrder: 1,
            active: true,
            createdAt: Date.now(),
          });
        }
      }
    }

    return {
      message: "Sample events created successfully!",
      organizerId,
      eventIds,
      count: eventIds.length,
    };
  },
});

/**
 * Update existing events with Unsplash image URLs
 */
export const updateEventImages = mutation({
  args: {},
  handler: async (ctx) => {
    const imageUrls = [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
      "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&q=80",
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80",
    ];

    const events = await ctx.db.query("events").collect();
    let updated = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      await ctx.db.patch(event._id, {
        imageUrl: imageUrls[i % imageUrls.length],
      });
      updated++;
    }

    return {
      message: "Event images updated successfully!",
      updated,
    };
  },
});
