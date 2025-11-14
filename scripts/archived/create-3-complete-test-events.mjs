#!/usr/bin/env node
/**
 * CREATE 3 COMPLETE TEST EVENTS
 *
 * This script creates 3 fully configured test events with different ticket structures:
 * 1. Simple event with early bird pricing
 * 2. Seated event with table packages
 * 3. Event with staff hierarchy
 *
 * Usage: node scripts/create-3-complete-test-events.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const log = {
  header: (text) => console.log(`\n${"═".repeat(70)}\n${text}\n${"═".repeat(70)}`),
  section: (text) => console.log(`\n${"─".repeat(70)}\n📋 ${text}\n${"─".repeat(70)}`),
  success: (text) => console.log(`✓ ${text}`),
  error: (text) => console.log(`✗ ${text}`),
  info: (text) => console.log(`ℹ ${text}`),
  data: (label, value) => console.log(`  ${label}: ${value}`),
};

// Store created event IDs
const createdEvents = {
  event1: null,
  event2: null,
  event3: null,
};

/**
 * EVENT 1: Spring Steppers Workshop 2026
 * Simple ticketed event with early bird pricing
 */
async function createEvent1() {
  log.section("EVENT 1: Spring Steppers Workshop 2026");
  log.info("Creating simple ticketed event with early bird pricing...");

  try {
    // Create event
    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "Spring Steppers Workshop 2026",
      eventType: "TICKETED_EVENT",
      description: "Join us for an intensive spring steppers workshop featuring top instructors from around the country. Learn new moves, perfect your technique, and connect with the steppers community!",
      startDate: new Date("2026-04-15T18:00:00").getTime(),
      endDate: new Date("2026-04-15T22:00:00").getTime(),
      timezone: "America/Chicago",
      location: {
        venueName: "Chicago Steppers Studio",
        address: "123 Dance Avenue",
        city: "Chicago",
        state: "Illinois",
        zipCode: "60601",
        country: "United States",
      },
      capacity: 200,
      categories: ["Workshop", "Steppers Set"],
    });

    createdEvents.event1 = eventId;
    log.success(`Event created: ${eventId}`);
    log.data("Name", "Spring Steppers Workshop 2026");
    log.data("Type", "TICKETED_EVENT");
    log.data("Capacity", "200 seats");
    log.data("URL", `https://events.stepperslife.com/events/${eventId}`);

    // Create ticket tiers
    log.info("\nCreating 4 ticket tiers with early bird pricing...");

    // Tier 1: Early Bird Special (available until 30 days before event)
    const earlyBirdCutoff = new Date("2026-03-16T00:00:00").getTime();
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Early Bird Special",
      description: "Limited time discount for early registrations! Includes all workshop materials and refreshments.",
      price: 3500, // $35.00
      quantity: 50,
      saleStart: Date.now(),
      saleEnd: earlyBirdCutoff,
    });
    log.success("  Created: Early Bird Special - $35, 50 tickets (ends 30 days before event)");

    // Tier 2: General Admission
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "General Admission",
      description: "Standard workshop admission with all materials included.",
      price: 5000, // $50.00
      quantity: 100,
      saleStart: Date.now(),
    });
    log.success("  Created: General Admission - $50, 100 tickets");

    // Tier 3: VIP Premium
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "VIP Premium",
      description: "Premium experience includes workshop materials, VIP seating, meet & greet with instructors, and exclusive swag bag!",
      price: 8500, // $85.00
      quantity: 30,
      saleStart: Date.now(),
      
    });
    log.success("  Created: VIP Premium - $85, 30 tickets");

    // Tier 4: Door Price (available day of event only)
    const eventDay = new Date("2026-04-15T00:00:00").getTime();
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Door Price",
      description: "Last minute tickets available at the door on event day.",
      price: 7500, // $75.00
      quantity: 20,
      saleStart: eventDay,
      
    });
    log.success("  Created: Door Price - $75, 20 tickets (starts day of event)");

    log.data("\nTotal Capacity Allocated", "200/200 seats");
    log.success("Event 1 completed successfully!");

  } catch (error) {
    log.error(`Failed to create Event 1: ${error.message}`);
    throw error;
  }
}

/**
 * EVENT 2: Valentine's Gala 2026
 * Seated event with table packages
 */
async function createEvent2() {
  log.section("EVENT 2: Valentine's Gala 2026");
  log.info("Creating seated event with table packages...");

  try {
    // Create event
    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "Valentine's Gala 2026",
      eventType: "TICKETED_EVENT",
      description: "Celebrate Valentine's Day at our elegant gala featuring live music, gourmet dinner, and dancing all night long! Reserve your table or individual seats for an unforgettable evening.",
      startDate: new Date("2026-02-14T19:00:00").getTime(),
      endDate: new Date("2026-02-15T01:00:00").getTime(),
      timezone: "America/Chicago",
      location: {
        venueName: "Grand Ballroom at The Drake",
        address: "140 E Walton Place",
        city: "Chicago",
        state: "Illinois",
        zipCode: "60611",
        country: "United States",
      },
      capacity: 240, // 30 tables × 8 seats
      categories: ["Social", "Celebration"],
    });

    createdEvents.event2 = eventId;
    log.success(`Event created: ${eventId}`);
    log.data("Name", "Valentine's Gala 2026");
    log.data("Type", "TICKETED_EVENT (with table packages)");
    log.data("Capacity", "240 seats (30 tables × 8 seats each)");
    log.data("URL", `https://events.stepperslife.com/events/${eventId}`);

    // Create ticket tiers
    log.info("\nCreating 5 ticket tiers (3 table packages + 2 individual seats)...");

    // Tier 1: VIP Table Package
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "VIP Table Package",
      description: "Premium table for 8 with champagne service, priority seating near the stage, and complimentary valet parking.",
      price: 60000, // $600.00 per table
      quantity: 10, // 10 tables
      isTablePackage: true,
      tableCapacity: 8,
      
    });
    log.success("  Created: VIP Table Package - $600/table, 10 tables, 8 seats each (80 seats total)");

    // Tier 2: Premium Table Package
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Premium Table Package",
      description: "Great table for 8 with wine service and excellent views of the dance floor.",
      price: 40000, // $400.00 per table
      quantity: 10, // 10 tables
      isTablePackage: true,
      tableCapacity: 8,
      
    });
    log.success("  Created: Premium Table Package - $400/table, 10 tables, 8 seats each (80 seats total)");

    // Tier 3: Standard Table Package
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Standard Table Package",
      description: "Comfortable table for 8 with great atmosphere and access to all amenities.",
      price: 24000, // $240.00 per table
      quantity: 10, // 10 tables
      isTablePackage: true,
      tableCapacity: 8,
      
    });
    log.success("  Created: Standard Table Package - $240/table, 10 tables, 8 seats each (80 seats total)");

    // NOTE: Individual seats don't count toward table capacity
    // They would be additional seats not at tables
    log.info("\nNote: Individual seat tiers are for guests who don't purchase a full table");

    log.data("\nTable Capacity Allocated", "240 seats (30 tables × 8 seats)");
    log.success("Event 2 completed successfully!");

  } catch (error) {
    log.error(`Failed to create Event 2: ${error.message}`);
    throw error;
  }
}

/**
 * EVENT 3: Summer Block Party 2026
 * Event with staff hierarchy and multiple tiers
 */
async function createEvent3() {
  log.section("EVENT 3: Summer Block Party 2026");
  log.info("Creating event with staff hierarchy...");

  try {
    // Create event
    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "Summer Block Party 2026",
      eventType: "TICKETED_EVENT",
      description: "The biggest outdoor steppers celebration of the summer! Live DJs, food trucks, games, and non-stop dancing from afternoon till late night. Bring the whole family!",
      startDate: new Date("2026-07-04T14:00:00").getTime(),
      endDate: new Date("2026-07-04T22:00:00").getTime(),
      timezone: "America/Chicago",
      location: {
        venueName: "Millennium Park",
        address: "201 E Randolph St",
        city: "Chicago",
        state: "Illinois",
        zipCode: "60602",
        country: "United States",
      },
      capacity: 500,
      categories: ["Festival", "Social", "Celebration"],
    });

    createdEvents.event3 = eventId;
    log.success(`Event created: ${eventId}`);
    log.data("Name", "Summer Block Party 2026");
    log.data("Type", "TICKETED_EVENT");
    log.data("Capacity", "500 seats");
    log.data("URL", `https://events.stepperslife.com/events/${eventId}`);

    // Create ticket tiers
    log.info("\nCreating 3 ticket tiers...");

    // Tier 1: General Admission
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "General Admission",
      description: "Full access to the block party with all entertainment, games, and activities included!",
      price: 2500, // $25.00
      quantity: 400,
      
    });
    log.success("  Created: General Admission - $25, 400 tickets");

    // Tier 2: VIP Experience
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "VIP Experience",
      description: "VIP area with exclusive lounge, complimentary drinks, meet & greet with DJs, and premium viewing area!",
      price: 6000, // $60.00
      quantity: 80,
      
    });
    log.success("  Created: VIP Experience - $60, 80 tickets");

    // Tier 3: Family Pack (simulated as regular tier)
    await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId,
      name: "Family Pack (4 tickets)",
      description: "Save $20! Perfect for families - includes 4 general admission tickets at a discounted rate.",
      price: 8000, // $80.00 (normally $100 for 4 tickets)
      quantity: 20,
      
    });
    log.success("  Created: Family Pack (4 tickets) - $80, 20 packs");

    log.data("\nTotal Capacity Allocated", "500/500 seats");

    // Create staff members
    log.info("\nCreating staff hierarchy (7 members total)...");

    // Scanners (2)
    log.info("Adding 2 scanners (door staff):");
    await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Scanner One",
      email: "scanner1@test.com",
      role: "STAFF",
      phone: "+1-555-2001",
      canScan: true,
      
    });
    log.success("  Created: Scanner One (scanner1@test.com) - Can scan tickets");

    await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Scanner Two",
      email: "scanner2@test.com",
      role: "STAFF",
      phone: "+1-555-2002",
      canScan: true,
      
    });
    log.success("  Created: Scanner Two (scanner2@test.com) - Can scan tickets");

    // Team Members (2 sellers with commission)
    log.info("\nAdding 2 team members (sellers with commission):");

    const seller1Id = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Seller One",
      email: "seller1@test.com",
      role: "TEAM_MEMBER",
      phone: "+1-555-3001",
      canScan: false,
      
      commissionType: "PERCENTAGE",
      commissionValue: 10, // 10%
    });
    log.success("  Created: Seller One (seller1@test.com) - 10% commission, can assign sub-sellers");

    const seller2Id = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Seller Two",
      email: "seller2@test.com",
      role: "TEAM_MEMBER",
      phone: "+1-555-3002",
      canScan: false,
      
      commissionType: "FIXED",
      commissionValue: 500, // $5.00 per ticket
    });
    log.success("  Created: Seller Two (seller2@test.com) - $5 fixed commission per ticket, can assign sub-sellers");

    // Associates (3 sub-sellers)
    log.info("\nAdding 3 associates (sub-sellers):");

    await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Associate One",
      email: "associate1@test.com",
      role: "ASSOCIATE",
      phone: "+1-555-4001",
      parentStaffId: seller1Id,
      canScan: false,
      
      commissionType: "PERCENTAGE",
      commissionValue: 5, // 5%
    });
    log.success("  Created: Associate One (associate1@test.com) - Under Seller One, 5% commission");

    await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Associate Two",
      email: "associate2@test.com",
      role: "ASSOCIATE",
      phone: "+1-555-4002",
      parentStaffId: seller1Id,
      canScan: false,
      
      commissionType: "PERCENTAGE",
      commissionValue: 5, // 5%
    });
    log.success("  Created: Associate Two (associate2@test.com) - Under Seller One, 5% commission");

    await client.mutation(api.staff.mutations.addStaffMember, {
      eventId,
      name: "Associate Three",
      email: "associate3@test.com",
      role: "ASSOCIATE",
      phone: "+1-555-4003",
      parentStaffId: seller2Id,
      canScan: false,
      
      commissionType: "FIXED",
      commissionValue: 200, // $2.00 per ticket
    });
    log.success("  Created: Associate Three (associate3@test.com) - Under Seller Two, $2 fixed commission");

    log.data("\nStaff Hierarchy Summary", "");
    log.data("  Scanners", "2");
    log.data("  Team Members (Sellers)", "2");
    log.data("  Associates (Sub-sellers)", "3");
    log.data("  Total Staff", "7");

    log.success("\nEvent 3 completed successfully!");

  } catch (error) {
    log.error(`Failed to create Event 3: ${error.message}`);
    throw error;
  }
}

async function main() {
  log.header("🎫 CREATING 3 COMPLETE TEST EVENTS");

  try {
    await createEvent1();
    await createEvent2();
    await createEvent3();

    log.header("✅ ALL EVENTS CREATED SUCCESSFULLY!");

    console.log("\n📊 SUMMARY:");
    console.log("═".repeat(70));
    console.log("\n✅ Event 1: Spring Steppers Workshop 2026");
    console.log(`   ID: ${createdEvents.event1}`);
    console.log(`   URL: https://events.stepperslife.com/events/${createdEvents.event1}`);
    console.log("   Ticket Tiers: 4 (Early Bird, General, VIP, Door Price)");
    console.log("   Capacity: 200 seats");

    console.log("\n✅ Event 2: Valentine's Gala 2026");
    console.log(`   ID: ${createdEvents.event2}`);
    console.log(`   URL: https://events.stepperslife.com/events/${createdEvents.event2}`);
    console.log("   Ticket Tiers: 3 table packages (VIP, Premium, Standard)");
    console.log("   Capacity: 240 seats (30 tables × 8 seats)");

    console.log("\n✅ Event 3: Summer Block Party 2026");
    console.log(`   ID: ${createdEvents.event3}`);
    console.log(`   URL: https://events.stepperslife.com/events/${createdEvents.event3}`);
    console.log("   Ticket Tiers: 3 (General, VIP, Family Pack)");
    console.log("   Capacity: 500 seats");
    console.log("   Staff: 7 members (2 scanners, 2 sellers, 3 associates)");

    console.log("\n💡 NEXT STEPS:");
    console.log("1. Login at: https://events.stepperslife.com/login");
    console.log("2. Email: organizer1@stepperslife.com");
    console.log("3. Password: Bobby321!");
    console.log("4. View events in organizer dashboard");
    console.log("5. Verify ticket tiers for each event");
    console.log("6. For Event 3: Check staff hierarchy");
    console.log("═".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    log.header("❌ FAILED TO CREATE EVENTS");
    console.error(error);
    process.exit(1);
  }
}

main();
