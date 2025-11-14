#!/usr/bin/env node
/**
 * CREATE 3 COMPREHENSIVE TEST EVENTS
 *
 * This script creates 3 different test events to validate:
 * 1. Simple Ticketed Event - Full purchase cycle
 * 2. Seated Event - Interactive seating chart
 * 3. Staff Hierarchy Event - Multi-level staff with cash sales
 *
 * Usage: node scripts/create-3-test-events.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

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

// Test data storage
const testData = {
  organizer: null,
  events: [],
};

// ============================================================================
// SETUP: GET OR CREATE ORGANIZER
// ============================================================================

async function setupOrganizer() {
  log.section("Setting Up Test Organizer");

  try {
    // Try to find existing organizer
    const existingUser = await client.query(api.users.queries.getUserByEmail, {
      email: "organizer1@stepperslife.com",
    });

    if (existingUser) {
      testData.organizer = existingUser;
      log.success(`Using existing organizer: ${existingUser.email}`);
      log.data("  User ID", existingUser._id);
      log.data("  Role", existingUser.role);
      return existingUser._id;
    }

    // Create new organizer if doesn't exist
    log.info("Creating new organizer account...");
    const passwordHash = await bcrypt.hash("Bobby321!", 10);

    const organizerId = await client.mutation(api.users.mutations.createUser, {
      email: "organizer1@stepperslife.com",
      name: "Test Organizer",
      passwordHash: passwordHash,
      role: "organizer",
    });

    // Initialize credits
    await client.mutation(api.credits.mutations.initializeCredits, {
      organizerId: organizerId,
    });

    testData.organizer = await client.query(api.users.queries.getUserById, {
      userId: organizerId,
    });

    log.success(`Organizer created: ${testData.organizer.email}`);
    log.data("  User ID", organizerId);
    log.data("  Credits", "300 tickets (first event free)");

    return organizerId;
  } catch (error) {
    log.error(`Failed to setup organizer: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// TEST EVENT 1: SIMPLE TICKETED EVENT
// ============================================================================

async function createTestEvent1() {
  log.section("TEST EVENT 1: Simple Ticketed Event");

  try {
    const eventDate = new Date("2025-12-31T21:00:00");
    const endDate = new Date("2026-01-01T02:00:00");

    log.info("Creating event...");
    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "New Year's Eve Gala 2026",
      description: "Join us for an unforgettable celebration to ring in 2026! Live music, dancing, champagne toast at midnight, gourmet dining, and premium open bar. Dress code: Black tie optional.",
      eventType: "TICKETED_EVENT",
      categories: ["Party", "Celebration", "Holiday", "Formal"],
      startDate: eventDate.getTime(),
      endDate: endDate.getTime(),
      timezone: "America/Chicago",
      eventDateLiteral: "December 31, 2025",
      eventTimeLiteral: "9:00 PM - 2:00 AM",
      location: {
        venueName: "The Grand Ballroom",
        address: "456 Michigan Avenue",
        city: "Chicago",
        state: "Illinois",
        zipCode: "60611",
        country: "United States",
      },
      capacity: 300,
    });

    log.success(`Event created: ${eventId}`);

    // Create ticket tiers
    log.info("Creating ticket tiers...");

    const tiers = [
      {
        name: "Early Bird Special",
        description: "Limited time offer - save $20! Valid until November 30th.",
        price: 4500, // $45.00
        quantity: 50,
      },
      {
        name: "General Admission",
        description: "Standard entry with full access to all amenities.",
        price: 6500, // $65.00
        quantity: 150,
      },
      {
        name: "VIP Access",
        description: "Premium seating, exclusive VIP lounge, meet & greet with DJ, complimentary coat check.",
        price: 10000, // $100.00
        quantity: 50,
      },
      {
        name: "Student Discount",
        description: "Special rate for students with valid ID. Must present student ID at entry.",
        price: 3000, // $30.00
        quantity: 50,
      },
    ];

    for (const tier of tiers) {
      await client.mutation(api.tickets.mutations.createTicketTier, {
        eventId: eventId,
        ...tier,
      });
      log.success(`  Created tier: ${tier.name} ($${(tier.price / 100).toFixed(2)})`);
    }

    testData.events.push({
      id: eventId,
      name: "New Year's Eve Gala 2026",
      type: "TICKETED_EVENT",
      tiers: tiers.length,
    });

    log.success("✅ Test Event 1 Complete!");
    log.data("  Event ID", eventId);
    log.data("  Capacity", "300 seats");
    log.data("  Ticket Tiers", tiers.length);
    log.data("  URL", `https://events.stepperslife.com/events/${eventId}`);

    return eventId;
  } catch (error) {
    log.error(`Test Event 1 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// TEST EVENT 2: SEATED EVENT (If seating enabled)
// ============================================================================

async function createTestEvent2() {
  log.section("TEST EVENT 2: Seated Event with Interactive Seating");

  try {
    const eventDate = new Date("2026-02-14T19:00:00");
    const endDate = new Date("2026-02-14T23:00:00");

    log.info("Creating seated event...");
    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "Valentine's Day Dinner Dance 2026",
      description: "An elegant evening of romance, fine dining, and ballroom dancing. Enjoy a 5-course gourmet meal, live orchestra, professional dance instruction, and complimentary roses for all guests.",
      eventType: "TICKETED_EVENT", // Note: SEATED_EVENT if enabled
      categories: ["Formal", "Dining", "Romance", "Dance"],
      startDate: eventDate.getTime(),
      endDate: endDate.getTime(),
      timezone: "America/New_York",
      eventDateLiteral: "February 14, 2026",
      eventTimeLiteral: "7:00 PM - 11:00 PM",
      location: {
        venueName: "Elegant Ballroom",
        address: "789 Peachtree Street",
        city: "Atlanta",
        state: "Georgia",
        zipCode: "30308",
        country: "United States",
      },
      capacity: 240, // 30 tables × 8 seats
    });

    log.success(`Event created: ${eventId}`);

    // Create ticket tiers (simulating table sections)
    log.info("Creating ticket tiers for seating sections...");

    const tiers = [
      {
        name: "VIP Individual Seat",
        description: "Premium seating with best views, priority service, champagne upgrade.",
        price: 7500, // $75.00
        quantity: 80, // 10 tables × 8 seats
      },
      {
        name: "VIP Table Package",
        description: "Reserve an entire VIP table for 8 guests. Includes champagne service and premium location.",
        price: 50000, // $500.00 (8 seats)
        quantity: 10,
        isTablePackage: true,
        tableCapacity: 8,
      },
      {
        name: "Premium Individual Seat",
        description: "Great views and excellent service.",
        price: 6000, // $60.00
        quantity: 80,
      },
      {
        name: "General Individual Seat",
        description: "Standard seating with full access to all amenities.",
        price: 4500, // $45.00
        quantity: 80,
      },
    ];

    for (const tier of tiers) {
      await client.mutation(api.tickets.mutations.createTicketTier, {
        eventId: eventId,
        ...tier,
      });
      const displayPrice = tier.isTablePackage
        ? `$${(tier.price / 100).toFixed(2)} (table for ${tier.tableCapacity})`
        : `$${(tier.price / 100).toFixed(2)}`;
      log.success(`  Created tier: ${tier.name} (${displayPrice})`);
    }

    testData.events.push({
      id: eventId,
      name: "Valentine's Day Dinner Dance 2026",
      type: "SEATED_EVENT",
      tiers: tiers.length,
    });

    log.success("✅ Test Event 2 Complete!");
    log.data("  Event ID", eventId);
    log.data("  Capacity", "240 seats (30 tables)");
    log.data("  Ticket Tiers", tiers.length);
    log.data("  URL", `https://events.stepperslife.com/events/${eventId}`);
    log.info("  Note: Seating chart designer available at /organizer/events/" + eventId + "/seating");

    return eventId;
  } catch (error) {
    log.error(`Test Event 2 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// TEST EVENT 3: STAFF HIERARCHY EVENT
// ============================================================================

async function createTestEvent3() {
  log.section("TEST EVENT 3: Staff Hierarchy with Cash Sales");

  try {
    const eventDate = new Date("2026-07-04T14:00:00");
    const endDate = new Date("2026-07-04T22:00:00");

    log.info("Creating event...");
    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "Summer Block Party 2026",
      description: "Annual community celebration with live bands, food trucks, kids zone, beer garden, and fireworks finale! Family-friendly event celebrating our neighborhood.",
      eventType: "TICKETED_EVENT",
      categories: ["Community", "Outdoor", "Family", "Festival"],
      startDate: eventDate.getTime(),
      endDate: endDate.getTime(),
      timezone: "America/Chicago",
      eventDateLiteral: "July 4, 2026",
      eventTimeLiteral: "2:00 PM - 10:00 PM",
      location: {
        venueName: "Community Park",
        address: "321 Park Avenue",
        city: "Houston",
        state: "Texas",
        zipCode: "77002",
        country: "United States",
      },
      capacity: 500,
    });

    log.success(`Event created: ${eventId}`);

    // Create ticket tiers
    log.info("Creating ticket tiers...");

    const gaTierId = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId: eventId,
      name: "General Admission",
      description: "Full access to all activities, live music, and fireworks show.",
      price: 2500, // $25.00
      quantity: 400,
    });
    log.success(`  Created tier: General Admission ($25.00)`);

    const vipTierId = await client.mutation(api.tickets.mutations.createTicketTier, {
      eventId: eventId,
      name: "VIP Experience",
      description: "Reserved seating area, complimentary food & drinks, exclusive viewing for fireworks.",
      price: 5000, // $50.00
      quantity: 100,
    });
    log.success(`  Created tier: VIP Experience ($50.00)`);

    // Add staff members
    log.info("Adding staff members...");

    // Team Member 1: Marcus (can assign sub-sellers)
    const marcusId = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId: eventId,
      name: "Marcus Johnson",
      email: `marcus.johnson.${Date.now()}@teststafftest.com`,
      phone: "+1-555-0300",
      role: "TEAM_MEMBERS",
      canScan: false,
      commissionType: "PERCENTAGE",
      commissionValue: 10, // 10%
      allocatedTickets: 100,
    });

    await client.mutation(api.staff.mutations.updateStaffPermissions, {
      staffId: marcusId,
      canAssignSubSellers: true,
      maxSubSellers: 5,
    });
    log.success(`  Added: Marcus Johnson (Team Member, 10% commission, 100 tickets)`);

    // Team Member 2: Tanya
    const tanyaId = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId: eventId,
      name: "Tanya Williams",
      email: `tanya.williams.${Date.now()}@teststafftest.com`,
      phone: "+1-555-0301",
      role: "TEAM_MEMBERS",
      canScan: false,
      commissionType: "PERCENTAGE",
      commissionValue: 8, // 8%
      allocatedTickets: 80,
    });
    log.success(`  Added: Tanya Williams (Team Member, 8% commission, 80 tickets)`);

    // Scanner 1: Sarah
    const sarahId = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId: eventId,
      name: "Sarah Chen",
      email: `sarah.chen.${Date.now()}@teststafftest.com`,
      phone: "+1-555-0400",
      role: "STAFF",
      canScan: true,
      commissionType: "FIXED",
      commissionValue: 0,
      allocatedTickets: 0,
    });
    log.success(`  Added: Sarah Chen (Scanner only)`);

    // Scanner 2: Mike
    const mikeId = await client.mutation(api.staff.mutations.addStaffMember, {
      eventId: eventId,
      name: "Mike Rodriguez",
      email: `mike.rodriguez.${Date.now()}@teststafftest.com`,
      phone: "+1-555-0401",
      role: "STAFF",
      canScan: true,
      commissionType: "FIXED",
      commissionValue: 0,
      allocatedTickets: 0,
    });
    log.success(`  Added: Mike Rodriguez (Scanner only)`);

    // Sub-sellers under Marcus
    log.info("Adding sub-sellers under Marcus...");

    const jessicaId = await client.mutation(api.staff.mutations.assignSubSeller, {
      eventId: eventId,
      parentStaffId: marcusId,
      name: "Jessica Martinez",
      email: `jessica.martinez.${Date.now()}@teststafftest.com`,
      phone: "+1-555-0500",
      allocatedTickets: 30,
      commissionType: "PERCENTAGE",
      commissionValue: 5, // 5%
    });
    log.success(`  Added: Jessica Martinez (Sub-seller, 5% commission, 30 tickets)`);

    const kevinId = await client.mutation(api.staff.mutations.assignSubSeller, {
      eventId: eventId,
      parentStaffId: marcusId,
      name: "Kevin Lee",
      email: `kevin.lee.${Date.now()}@teststafftest.com`,
      phone: "+1-555-0501",
      allocatedTickets: 30,
      commissionType: "PERCENTAGE",
      commissionValue: 5, // 5%
    });
    log.success(`  Added: Kevin Lee (Sub-seller, 5% commission, 30 tickets)`);

    testData.events.push({
      id: eventId,
      name: "Summer Block Party 2026",
      type: "STAFF_HIERARCHY",
      tiers: 2,
      staff: 6, // 2 team members, 2 scanners, 2 sub-sellers
    });

    log.success("✅ Test Event 3 Complete!");
    log.data("  Event ID", eventId);
    log.data("  Capacity", "500 seats");
    log.data("  Ticket Tiers", "2");
    log.data("  Staff Members", "6 (2 team + 2 scanners + 2 sub-sellers)");
    log.data("  URL", `https://events.stepperslife.com/events/${eventId}`);
    log.info("  Staff dashboard: /staff/dashboard");

    return eventId;
  } catch (error) {
    log.error(`Test Event 3 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log.header("🎯 CREATING 3 COMPREHENSIVE TEST EVENTS");

  try {
    // Setup organizer
    const organizerId = await setupOrganizer();

    // Create all 3 test events
    await createTestEvent1();
    await createTestEvent2();
    await createTestEvent3();

    // Final summary
    log.header("✅ ALL TEST EVENTS CREATED SUCCESSFULLY!");

    console.log("\n📊 SUMMARY:");
    console.log("═".repeat(70));
    console.log(`Total Events Created: ${testData.events.length}`);
    console.log(`Organizer: ${testData.organizer?.email || 'organizer1@stepperslife.com'}`);
    console.log(`Password: Bobby321!`);
    console.log("\n📋 TEST EVENTS:");
    console.log("─".repeat(70));

    testData.events.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.name}`);
      console.log(`   Type: ${event.type}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   URL: https://events.stepperslife.com/events/${event.id}`);
      console.log(`   Tiers: ${event.tiers}`);
      if (event.staff) {
        console.log(`   Staff: ${event.staff} members`);
      }
    });

    console.log("\n" + "═".repeat(70));
    console.log("\n🚀 NEXT STEPS:");
    console.log("1. Login at: https://events.stepperslife.com/login");
    console.log("2. Email: organizer1@stepperslife.com");
    console.log("3. Password: Bobby321!");
    console.log("4. View events at: /organizer/events");
    console.log("5. Publish events to make them visible on homepage");
    console.log("\n💡 TIP: Follow TEST-EXECUTION-GUIDE.md for detailed testing steps");
    console.log("═".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    log.header("❌ TEST EVENT CREATION FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();
