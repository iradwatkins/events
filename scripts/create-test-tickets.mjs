#!/usr/bin/env node

/**
 * Create test tickets directly via Convex mutations
 * This bypasses the UI to test the backend ticket creation
 *
 * NEW TEST EVENT with email: ira@irawatkins.com
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://fearless-dragon-613.convex.cloud");

async function createTestTickets() {
  console.log("🎫 Starting FRESH ticket creation test...\n");
  console.log("📧 Using organizer email: ira@irawatkins.com\n");

  try {
    // Step 1: Find or create user with new email
    console.log("👤 Setting up organizer account...");

    const userEmail = "ira@irawatkins.com";
    const userName = "Ira Watkins";

    // Note: The createEvent mutation will automatically find or create the user
    // based on the fallback logic in events/mutations.ts

    // Step 2: Create a test event
    console.log("📅 Creating test event...");

    const eventId = await client.mutation("events/mutations:createEvent", {
      name: "Complete Ticket Testing Event",
      description: "Comprehensive test of all ticket structures: individual tickets with early bird pricing, VIP with discounts, and table packages",
      eventType: "TICKETED_EVENT",
      startDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000), // 4 hours later
      location: {
        city: "Chicago",
        state: "IL",
        country: "USA",
      },
      capacity: 500,
      categories: ["Test", "Demo"],
      images: [],
      timezone: "America/Chicago",
    });

    console.log(`✅ Event created: ${eventId}\n`);

    // Step 2: Enable tickets visibility (using testing helper)
    console.log("⚙️  Setting up event for ticket sales...");

    await client.mutation("testing/helpers:enableTicketsForTesting", {
      eventId,
    });

    console.log("✅ Tickets enabled and visible\n");

    // Step 3: Create Ticket Structure 1 - General Admission with Early Bird Pricing
    console.log("🎫 Creating Ticket 1: General Admission with Early Bird Pricing");
    console.log("   📅 Price progression: $20 (Early Bird) → $23 (Advance) → $25 (Regular)");

    const now = Date.now();
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    const twentyOneDaysFromNow = now + (21 * 24 * 60 * 60 * 1000);

    const ticket1 = await client.mutation("tickets/mutations:createTicketTier", {
      eventId,
      name: "General Admission",
      description: "Standard entry ticket",
      price: 2500, // $25.00 in cents (regular/base price)
      quantity: 200,
      isTablePackage: false,
      pricingTiers: [
        {
          name: "Early Bird Special",
          price: 2000, // $20.00 (save $5)
          availableFrom: now,
          availableUntil: sevenDaysFromNow,
        },
        {
          name: "Advance Purchase",
          price: 2300, // $23.00 (save $2)
          availableFrom: sevenDaysFromNow,
          availableUntil: twentyOneDaysFromNow,
        },
        {
          name: "Regular Price",
          price: 2500, // $25.00 (full price)
          availableFrom: twentyOneDaysFromNow,
        },
      ],
    });
    console.log(`   ✅ Created: ${ticket1}`);

    // Step 4: Create Ticket Structure 2 - VIP with Early Bird Pricing
    console.log("\n🎫 Creating Ticket 2: VIP with Early Bird Pricing");
    console.log("   📅 Price progression: $60 (Early Bird) → $75 (Regular)");

    const fourteenDaysFromNow = now + (14 * 24 * 60 * 60 * 1000);

    const ticket2 = await client.mutation("tickets/mutations:createTicketTier", {
      eventId,
      name: "VIP",
      description: "VIP access with perks",
      price: 7500, // $75.00 in cents (regular/base price)
      quantity: 100,
      isTablePackage: false,
      pricingTiers: [
        {
          name: "Early Bird Special",
          price: 6000, // $60.00 (save $15)
          availableFrom: now,
          availableUntil: fourteenDaysFromNow,
        },
        {
          name: "Regular Price",
          price: 7500, // $75.00 (full price)
          availableFrom: fourteenDaysFromNow,
        },
      ],
    });
    console.log(`   ✅ Created: ${ticket2}`);

    // Step 5: Create Ticket Structure 3 - VIP Table (4 seats)
    console.log("\n🎫 Creating Ticket 3: VIP Table (25 tables × 4 seats @ $250)");
    const ticket3 = await client.mutation("tickets/mutations:createTicketTier", {
      eventId,
      name: "VIP Table",
      description: "Reserved table for 4 people",
      price: 25000, // $250.00 in cents
      quantity: 25, // 25 tables
      isTablePackage: true,
      tableCapacity: 4, // 4 seats per table
    });
    console.log(`   ✅ Created: ${ticket3}`);
    console.log(`   📊 Total seats: 25 tables × 4 = 100 seats`);

    // Step 6: Create Ticket Structure 4 - Premium Table (8 seats)
    console.log("\n🎫 Creating Ticket 4: Premium Table (10 tables × 8 seats @ $500)");
    const ticket4 = await client.mutation("tickets/mutations:createTicketTier", {
      eventId,
      name: "Premium Table",
      description: "Premium reserved table for 8 people",
      price: 50000, // $500.00 in cents
      quantity: 10, // 10 tables
      isTablePackage: true,
      tableCapacity: 8, // 8 seats per table
    });
    console.log(`   ✅ Created: ${ticket4}`);
    console.log(`   📊 Total seats: 10 tables × 8 = 80 seats`);

    // Step 7: Verify the event and tickets
    console.log("\n📊 Fetching event details to verify...");
    const eventDetails = await client.query("public/queries:getPublicEventDetails", {
      eventId,
    });

    console.log("\n✅ EVENT CREATED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`Event ID: ${eventId}`);
    console.log(`Event Name: ${eventDetails.name}`);
    console.log(`Capacity: ${eventDetails.capacity} tickets`);
    console.log(`\nTicket Tiers Created: ${eventDetails.ticketTiers?.length || 0}`);
    console.log("=".repeat(60));

    if (eventDetails.ticketTiers && eventDetails.ticketTiers.length > 0) {
      console.log("\n📋 Ticket Breakdown:");
      let totalSeats = 0;
      let totalIndividual = 0;
      let totalTableSeats = 0;

      eventDetails.ticketTiers.forEach((tier, index) => {
        const qty = tier.quantity || 0;
        const seats = tier.isTablePackage && tier.tableCapacity
          ? qty * tier.tableCapacity
          : qty;

        totalSeats += seats;

        if (tier.isTablePackage) {
          totalTableSeats += seats;
          console.log(`\n${index + 1}. ${tier.name}`);
          console.log(`   Type: Table Package`);
          console.log(`   Price: $${(tier.price / 100).toFixed(2)} per table`);
          console.log(`   Tables: ${qty}`);
          console.log(`   Seats per table: ${tier.tableCapacity}`);
          console.log(`   Total seats: ${seats}`);
        } else {
          totalIndividual += seats;
          console.log(`\n${index + 1}. ${tier.name}`);
          console.log(`   Type: Individual Ticket`);

          // Show current price vs regular price if early bird is active
          if (tier.currentPrice && tier.currentPrice !== tier.price) {
            console.log(`   Current Price: $${(tier.currentPrice / 100).toFixed(2)} (${tier.currentTierName})`);
            console.log(`   Regular Price: $${(tier.price / 100).toFixed(2)} (save $${((tier.price - tier.currentPrice) / 100).toFixed(2)})`);
          } else {
            console.log(`   Price: $${(tier.price / 100).toFixed(2)}`);
          }

          console.log(`   Quantity: ${qty}`);
        }
      });

      console.log("\n" + "=".repeat(60));
      console.log(`TOTAL CAPACITY: ${totalSeats} tickets`);
      console.log(`  ↳ Individual tickets: ${totalIndividual}`);
      console.log(`  ↳ Table seats: ${totalTableSeats}`);
      console.log("=".repeat(60));

      console.log(`\n🌐 View event at: https://events.stepperslife.com/events/${eventId}`);
      console.log(`🎫 Manage tickets at: https://events.stepperslife.com/organizer/events/${eventId}/tickets`);
    }

    console.log("\n✅ All tickets created successfully!");
    console.log("\n💡 EARLY BIRD PRICING DEMO:");
    console.log("   • General Admission: Currently $20 (Early Bird) - Regular price $25");
    console.log("   • VIP: Currently $60 (Early Bird) - Regular price $75");
    console.log("   • Prices will automatically increase after the early bird period expires");

  } catch (error) {
    console.error("\n❌ Error creating tickets:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

createTestTickets();
