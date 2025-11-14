#!/usr/bin/env node

/**
 * CREATE 5 DIVERSE TEST EVENTS
 *
 * This script creates a test organizer and 5 complete events with:
 * - Full event details (location, date, description)
 * - 2 ticket tiers each (General + VIP)
 * - Mixed pricing strategies (early bird, flat, table packages)
 * - ~1000 seat capacity each
 * - PUBLISHED status (visible on homepage)
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// Event data definitions
const EVENTS_DATA = [
  {
    name: "Chicago Summer Steppers Gala",
    eventType: "TICKETED_EVENT",
    description: "Join us for an elegant black-tie summer gala featuring live DJ, premium cocktails, and the best steppers in the Midwest. This premier event brings together steppers from across Chicago for an unforgettable evening of dancing and celebration.",
    categories: ["Set", "Holiday Event"],
    startDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
    endDate: Date.now() + (30 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000), // +4 hours
    timezone: "America/Chicago",
    eventDateLiteral: "August 12, 2025",
    eventTimeLiteral: "8:00 PM - 12:00 AM",
    location: {
      venueName: "The Grand Ballroom",
      address: "123 Michigan Avenue",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA"
    },
    capacity: 1000,
    tickets: [
      {
        name: "General Admission",
        description: "Access to main ballroom, cash bar, dance floor",
        price: 5000, // $50.00
        quantity: 700,
        pricingTiers: [
          { name: "Early Bird", price: 3500, availableFrom: Date.now(), availableUntil: Date.now() + (14 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 5000, availableFrom: Date.now() + (14 * 24 * 60 * 60 * 1000), availableUntil: Date.now() + (28 * 24 * 60 * 60 * 1000) },
          { name: "Last Chance", price: 6500, availableFrom: Date.now() + (28 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: "VIP Table Package",
        description: "Reserved table seating for 10 guests, bottle service included",
        price: 10000, // $100.00 per seat
        quantity: 30, // 30 tables
        isTablePackage: true,
        tableCapacity: 10,
        pricingTiers: [
          { name: "Early Bird", price: 8500, availableFrom: Date.now(), availableUntil: Date.now() + (14 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 10000, availableFrom: Date.now() + (14 * 24 * 60 * 60 * 1000) }
        ]
      }
    ]
  },
  {
    name: "NYC Steppers Weekend Festival",
    eventType: "TICKETED_EVENT",
    description: "The biggest steppers festival on the East Coast! Three-day weekend extravaganza featuring workshops, competitions, and nightly sets. Special guest DJs from around the country. Food trucks, vendors, and after-parties included.",
    categories: ["Weekend Event", "Set"],
    startDate: Date.now() + (60 * 24 * 60 * 60 * 1000), // 60 days from now
    endDate: Date.now() + (60 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000),
    timezone: "America/New_York",
    eventDateLiteral: "September 11, 2025",
    eventTimeLiteral: "7:00 PM - 12:00 AM",
    location: {
      venueName: "Brooklyn Dance Center",
      address: "456 Atlantic Avenue",
      city: "New York",
      state: "NY",
      zipCode: "11201",
      country: "USA"
    },
    capacity: 1200,
    tickets: [
      {
        name: "General Admission",
        description: "Full weekend access to all events and workshops",
        price: 4500, // $45.00
        quantity: 900,
        pricingTiers: [
          { name: "Super Early Bird", price: 2500, availableFrom: Date.now(), availableUntil: Date.now() + (30 * 24 * 60 * 60 * 1000) },
          { name: "Early Bird", price: 3500, availableFrom: Date.now() + (30 * 24 * 60 * 60 * 1000), availableUntil: Date.now() + (50 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 4500, availableFrom: Date.now() + (50 * 24 * 60 * 60 * 1000), availableUntil: Date.now() + (58 * 24 * 60 * 60 * 1000) },
          { name: "Last Chance", price: 6000, availableFrom: Date.now() + (58 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: "VIP All-Access Pass",
        description: "Premium seating, exclusive lounge access, meet & greet with DJs, gift bag",
        price: 9500, // $95.00
        quantity: 300,
        pricingTiers: [
          { name: "Early Bird", price: 7500, availableFrom: Date.now(), availableUntil: Date.now() + (40 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 9500, availableFrom: Date.now() + (40 * 24 * 60 * 60 * 1000) }
        ]
      }
    ]
  },
  {
    name: "LA Outdoor Steppin' Extravaganza",
    eventType: "TICKETED_EVENT",
    description: "Outdoor steppin' under the California stars! Massive outdoor venue with multiple dance floors, live bands, and celebrity DJs. Food court, cocktail bars, and chill zones. Bring your dancing shoes for this epic summer celebration!",
    categories: ["Outdoors Steppin", "Set"],
    startDate: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now
    endDate: Date.now() + (90 * 24 * 60 * 60 * 1000) + (6 * 60 * 60 * 1000),
    timezone: "America/Los_Angeles",
    eventDateLiteral: "October 10, 2025",
    eventTimeLiteral: "6:00 PM - 12:00 AM",
    location: {
      venueName: "Sunset Park Amphitheater",
      address: "789 Pacific Coast Highway",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "USA"
    },
    capacity: 800,
    tickets: [
      {
        name: "General Standing",
        description: "Standing room access to main outdoor dance area",
        price: 4000, // $40.00
        quantity: 500
        // No early bird pricing - flat rate
      },
      {
        name: "Reserved Table Seating",
        description: "Reserved table with waiter service and seating for 10",
        price: 7500, // $75.00 per seat
        quantity: 30, // 30 tables
        isTablePackage: true,
        tableCapacity: 10
        // No early bird pricing - flat rate
      }
    ]
  },
  {
    name: "Atlanta Steppers Social Mixer",
    eventType: "TICKETED_EVENT",
    description: "Monthly social mixer for Atlanta steppers community! Relaxed vibes, great music, complimentary appetizers, and a welcoming atmosphere for dancers of all skill levels. Perfect for networking and making new friends in the scene.",
    categories: ["Weekend Event", "Set"],
    startDate: Date.now() + (45 * 24 * 60 * 60 * 1000), // 45 days from now
    endDate: Date.now() + (45 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000),
    timezone: "America/New_York",
    eventDateLiteral: "August 26, 2025",
    eventTimeLiteral: "7:00 PM - 10:00 PM",
    location: {
      venueName: "Peachtree Dance Lounge",
      address: "321 Peachtree Street NE",
      city: "Atlanta",
      state: "GA",
      zipCode: "30303",
      country: "USA"
    },
    capacity: 1000,
    tickets: [
      {
        name: "General Admission",
        description: "Entry to dance floor, appetizers included",
        price: 3500, // $35.00
        quantity: 800,
        pricingTiers: [
          { name: "Early Bird", price: 2500, availableFrom: Date.now(), availableUntil: Date.now() + (30 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 3500, availableFrom: Date.now() + (30 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: "VIP Premium",
        description: "Premium seating area, 2 drink tickets, gift bag",
        price: 8000, // $80.00
        quantity: 200,
        pricingTiers: [
          { name: "Early Bird", price: 6000, availableFrom: Date.now(), availableUntil: Date.now() + (30 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 8000, availableFrom: Date.now() + (30 * 24 * 60 * 60 * 1000) }
        ]
      }
    ]
  },
  {
    name: "Miami Beach Steppers Paradise",
    eventType: "TICKETED_EVENT",
    description: "Beachfront steppin' extravaganza! Exclusive oceanfront venue with indoor/outdoor spaces. All-inclusive table packages with bottle service. Dress code: Island elegant. This is THE premium steppers event of the season!",
    categories: ["Set", "Holiday Event"],
    startDate: Date.now() + (120 * 24 * 60 * 60 * 1000), // 120 days from now
    endDate: Date.now() + (120 * 24 * 60 * 60 * 1000) + (5 * 60 * 60 * 1000),
    timezone: "America/New_York",
    eventDateLiteral: "November 9, 2025",
    eventTimeLiteral: "8:00 PM - 1:00 AM",
    location: {
      venueName: "Ocean Drive Grand Resort",
      address: "555 Ocean Drive",
      city: "Miami Beach",
      state: "FL",
      zipCode: "33139",
      country: "USA"
    },
    capacity: 1000,
    tickets: [
      {
        name: "Standard Table Package",
        description: "Table for 10 with standard bottle service",
        price: 6000, // $60.00 per seat
        quantity: 70, // 70 tables
        isTablePackage: true,
        tableCapacity: 10,
        pricingTiers: [
          { name: "Early Bird", price: 4500, availableFrom: Date.now(), availableUntil: Date.now() + (60 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 6000, availableFrom: Date.now() + (60 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        name: "VIP Oceanfront Table",
        description: "Premium oceanfront table for 10 with top-shelf bottle service",
        price: 12000, // $120.00 per seat
        quantity: 30, // 30 tables
        isTablePackage: true,
        tableCapacity: 10,
        pricingTiers: [
          { name: "Early Bird", price: 10000, availableFrom: Date.now(), availableUntil: Date.now() + (60 * 24 * 60 * 60 * 1000) },
          { name: "Regular", price: 12000, availableFrom: Date.now() + (60 * 24 * 60 * 60 * 1000) }
        ]
      }
    ]
  }
];

async function main() {
  console.log("🎉 CREATING 5 DIVERSE TEST EVENTS\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const results = [];

  // Process each event
  for (let i = 0; i < EVENTS_DATA.length; i++) {
    const eventData = EVENTS_DATA[i];
    console.log(`\n[${i + 1}/5] Creating: ${eventData.name}`);
    console.log(`     Location: ${eventData.location.city}, ${eventData.location.state}`);
    console.log(`     Date: ${eventData.eventDateLiteral} at ${eventData.eventTimeLiteral}`);
    console.log(`     Capacity: ${eventData.capacity.toLocaleString()} seats`);

    try {
      // Create the event
      console.log(`     ⏳ Creating event...`);
      const eventId = await client.mutation(api.events.mutations.createEvent, {
        name: eventData.name,
        eventType: eventData.eventType,
        description: eventData.description,
        categories: eventData.categories,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        timezone: eventData.timezone,
        eventDateLiteral: eventData.eventDateLiteral,
        eventTimeLiteral: eventData.eventTimeLiteral,
        location: eventData.location,
        capacity: eventData.capacity
      });

      console.log(`     ✅ Event created: ${eventId}`);

      // Create ticket tiers
      const tierIds = [];
      for (const ticket of eventData.tickets) {
        console.log(`     ⏳ Creating ticket tier: ${ticket.name}...`);

        const tierCapacity = ticket.isTablePackage
          ? ticket.quantity * ticket.tableCapacity
          : ticket.quantity;

        const tierDescription = ticket.isTablePackage
          ? `${ticket.quantity} tables × ${ticket.tableCapacity} seats = ${tierCapacity} seats`
          : `${ticket.quantity} individual tickets`;

        const tierId = await client.mutation(api.tickets.mutations.createTicketTier, {
          eventId,
          name: ticket.name,
          description: ticket.description,
          price: ticket.price,
          quantity: ticket.quantity,
          isTablePackage: ticket.isTablePackage,
          tableCapacity: ticket.tableCapacity,
          pricingTiers: ticket.pricingTiers
        });

        console.log(`     ✅ ${ticket.name}: ${tierDescription} @ $${(ticket.price / 100).toFixed(2)}`);
        tierIds.push(tierId);
      }

      // Publish the event
      console.log(`     ⏳ Publishing event...`);
      await client.mutation(api.events.mutations.publishEvent, { eventId });
      console.log(`     ✅ Event PUBLISHED (will appear on homepage)`);

      results.push({
        eventId,
        name: eventData.name,
        capacity: eventData.capacity,
        tierIds,
        url: `https://events.stepperslife.com/events/${eventId}`
      });

      console.log(`     🎊 COMPLETE!\n`);

    } catch (error) {
      console.error(`     ❌ ERROR: ${error.message}\n`);
      results.push({
        name: eventData.name,
        error: error.message
      });
    }
  }

  // Print summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📊 SUMMARY REPORT\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let successCount = 0;
  let totalCapacity = 0;

  for (const result of results) {
    if (result.eventId) {
      successCount++;
      totalCapacity += result.capacity;
      console.log(`✅ ${result.name}`);
      console.log(`   Event ID: ${result.eventId}`);
      console.log(`   Capacity: ${result.capacity.toLocaleString()} seats`);
      console.log(`   URL: ${result.url}\n`);
    } else {
      console.log(`❌ ${result.name}`);
      console.log(`   Error: ${result.error}\n`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`✨ Successfully created ${successCount}/${EVENTS_DATA.length} events`);
  console.log(`🎫 Total event capacity: ${totalCapacity.toLocaleString()} seats`);
  console.log(`🌐 View all events at: https://events.stepperslife.com/\n`);

  if (successCount === EVENTS_DATA.length) {
    console.log("🎉 ALL EVENTS CREATED SUCCESSFULLY!\n");
    process.exit(0);
  } else {
    console.log("⚠️  Some events failed to create. Check errors above.\n");
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("\n❌ FATAL ERROR:", error);
  process.exit(1);
});
