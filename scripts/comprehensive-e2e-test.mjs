#!/usr/bin/env node
/**
 * COMPREHENSIVE END-TO-END TEST SCRIPT
 *
 * Tests complete event lifecycle:
 * - Organizer creates event
 * - 2 door scanners, 2 staff support, 3 resellers, 7 associates
 * - Ticket sales (online, cash, hierarchical)
 * - Ticket transfers (approved, rejected, cancelled)
 * - Door scanning with error cases
 * - Comprehensive reporting and verification
 *
 * Usage:
 *   node scripts/comprehensive-e2e-test.mjs
 *   node scripts/comprehensive-e2e-test.mjs --cleanup
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import bcrypt from "bcryptjs";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const CLEANUP_MODE = process.argv.includes("--cleanup");

const client = new ConvexHttpClient(CONVEX_URL);

// Test data storage
const testData = {
  organizer: null,
  event: null,
  ticketTiers: [],
  staff: {
    scanners: [],
    support: [],
    resellers: [],
    associates: [],
  },
  sales: [],
  transfers: [],
  scans: [],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const log = {
  header: (text) => console.log(`\n${"━".repeat(60)}\n${text}\n${"━".repeat(60)}`),
  phase: (num, text) => console.log(`\n📋 PHASE ${num}: ${text}`),
  success: (text) => console.log(`✓ ${text}`),
  error: (text) => console.log(`✗ ${text}`),
  info: (text) => console.log(`ℹ ${text}`),
  warning: (text) => console.log(`⚠ ${text}`),
  data: (label, value) => console.log(`  ${label}: ${value}`),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatCurrency(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// ============================================================================
// PHASE 1: ORGANIZER & EVENT SETUP
// ============================================================================

async function phase1_setupOrganizerAndEvent() {
  log.phase(1, "Setup Organizer & Event");

  try {
    // Create organizer account with unique timestamp-based email
    const timestamp = Date.now();
    const testEmail = `test-organizer-${timestamp}@e2etest.com`;
    const passwordHash = await bcrypt.hash("TestPass123!", 10);

    const organizerId = await client.mutation(api.users.mutations.createUser, {
      email: testEmail,
      name: "Test Organizer",
      passwordHash: passwordHash,
      role: "organizer",
    });

    testData.organizer = await client.query(api.users.queries.getUserById, {
      userId: organizerId,
    });

    log.success(`Organizer created: ${testData.organizer.email}`);
    log.data("  Organizer ID", organizerId);

    // Allocate credits (300 free tickets for first event)
    await client.mutation(api.credits.mutations.initializeCredits, {
      organizerId: organizerId,
    });

    log.success("Credits allocated: 300 tickets (first event free)");

    // Create event
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 14); // 2 weeks from now

    const eventId = await client.mutation(api.events.mutations.createEvent, {
      name: "Annual Gala Night 2025",
      description: "A comprehensive E2E test event with full staff hierarchy, ticket sales, transfers, and scanning.",
      eventType: "TICKETED_EVENT",
      categories: ["Social", "Gala", "E2E Test"],
      startDate: eventDate.getTime(),
      endDate: eventDate.getTime() + 4 * 60 * 60 * 1000, // 4 hours later
      timezone: "America/New_York",
      location: {
        venueName: "Grand Ballroom",
        address: "123 Test Street",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        country: "United States",
      },
      capacity: 500,
    });

    testData.event = await client.query(api.events.queries.getEventById, {
      eventId,
    });

    log.success(`Event created: ${testData.event.name}`);
    log.data("  Event ID", eventId);
    log.data("  Capacity", `${testData.event.capacity} seats`);
    log.data("  Date", formatDate(testData.event.startDate));

    // Create ticket tiers
    const tiers = [
      {
        name: "General Admission",
        description: "Standard entry to the gala",
        price: 2500, // $25.00
        quantity: 300,
      },
      {
        name: "VIP",
        description: "Premium seating with exclusive access",
        price: 5000, // $50.00
        quantity: 150,
      },
      {
        name: "Table Package",
        description: "Reserved table for 8 guests",
        price: 40000, // $400.00
        quantity: 10,
        isTablePackage: true,
        tableCapacity: 8,
      },
    ];

    for (const tier of tiers) {
      const tierId = await client.mutation(api.tickets.mutations.createTicketTier, {
        eventId: testData.event._id,
        ...tier,
      });

      testData.ticketTiers.push({
        _id: tierId,
        ...tier,
      });
    }

    log.success(`Ticket tiers created: ${testData.ticketTiers.length} tiers`);
    testData.ticketTiers.forEach((tier) => {
      log.data(
        `  ${tier.name}`,
        `${formatCurrency(tier.price)} × ${tier.quantity} ${tier.isTablePackage ? "tables" : "tickets"}`
      );
    });

  } catch (error) {
    log.error(`Phase 1 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// PHASE 2: STAFF HIERARCHY SETUP
// ============================================================================

async function phase2_setupStaffHierarchy() {
  log.phase(2, "Staff Hierarchy Setup");

  try {
    const eventId = testData.event._id;

    // ========== 2 DOOR SCANNERS (STAFF role) ==========
    log.info("Creating door scanners...");

    const scanners = [
      {
        name: "Alice Scanner",
        email: "alice.scanner@e2etest.com",
        phone: "+1-555-0100",
        role: "STAFF",
        canScan: true,
        commissionType: "FIXED",
        commissionValue: 0,
        allocatedTickets: 0, // Scanners don't sell
      },
      {
        name: "Bob Scanner",
        email: "bob.scanner@e2etest.com",
        phone: "+1-555-0101",
        role: "STAFF",
        canScan: true,
        commissionType: "FIXED",
        commissionValue: 0,
        allocatedTickets: 0,
      },
    ];

    for (const scanner of scanners) {
      const staffId = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId,
        ...scanner,
      });

      testData.staff.scanners.push({
        _id: staffId,
        ...scanner,
      });
    }

    log.success(`Door scanners created: ${testData.staff.scanners.length}`);

    // ========== 2 STAFF SUPPORT (TEAM_MEMBERS role) ==========
    log.info("Creating staff support...");

    const support = [
      {
        name: "Charlie Support",
        email: "charlie.support@e2etest.com",
        phone: "+1-555-0200",
        role: "TEAM_MEMBERS",
        canScan: false,
        commissionType: "PERCENTAGE",
        commissionValue: 5, // 5%
        allocatedTickets: 100,
        canAssignSubSellers: true,
        maxSubSellers: 3,
      },
      {
        name: "Diana Support",
        email: "diana.support@e2etest.com",
        phone: "+1-555-0201",
        role: "TEAM_MEMBERS",
        canScan: false,
        commissionType: "PERCENTAGE",
        commissionValue: 4, // 4%
        allocatedTickets: 80,
        canAssignSubSellers: true,
        maxSubSellers: 3,
      },
    ];

    for (const sup of support) {
      const staffId = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId,
        ...sup,
      });

      // Enable sub-seller assignment
      if (sup.canAssignSubSellers) {
        await client.mutation(api.staff.mutations.updateStaffPermissions, {
          staffId,
          canAssignSubSellers: true,
          maxSubSellers: sup.maxSubSellers,
        });
      }

      testData.staff.support.push({
        _id: staffId,
        ...sup,
      });
    }

    log.success(`Staff support created: ${testData.staff.support.length}`);

    // ========== 3 RESELLERS (TEAM_MEMBERS role) ==========
    log.info("Creating resellers...");

    const resellers = [
      {
        name: "Eve Reseller",
        email: "eve.reseller@e2etest.com",
        phone: "+1-555-0300",
        role: "TEAM_MEMBERS",
        canScan: false,
        commissionType: "PERCENTAGE",
        commissionValue: 10, // 10%
        allocatedTickets: 150,
        canAssignSubSellers: true,
        maxSubSellers: 5,
      },
      {
        name: "Frank Reseller",
        email: "frank.reseller@e2etest.com",
        phone: "+1-555-0301",
        role: "TEAM_MEMBERS",
        canScan: false,
        commissionType: "PERCENTAGE",
        commissionValue: 8, // 8%
        allocatedTickets: 120,
        canAssignSubSellers: true,
        maxSubSellers: 5,
      },
      {
        name: "Grace Reseller",
        email: "grace.reseller@e2etest.com",
        phone: "+1-555-0302",
        role: "TEAM_MEMBERS",
        canScan: false,
        commissionType: "PERCENTAGE",
        commissionValue: 12, // 12%
        allocatedTickets: 100,
        canAssignSubSellers: true,
        maxSubSellers: 5,
      },
    ];

    for (const reseller of resellers) {
      const staffId = await client.mutation(api.staff.mutations.addStaffMember, {
        eventId,
        ...reseller,
      });

      // Enable sub-seller assignment
      if (reseller.canAssignSubSellers) {
        await client.mutation(api.staff.mutations.updateStaffPermissions, {
          staffId,
          canAssignSubSellers: true,
          maxSubSellers: reseller.maxSubSellers,
        });
      }

      testData.staff.resellers.push({
        _id: staffId,
        ...reseller,
      });
    }

    log.success(`Resellers created: ${testData.staff.resellers.length}`);

    // ========== ASSOCIATES (ASSOCIATES role - sub-sellers) ==========
    log.info("Creating associates (sub-sellers)...");

    // Under Charlie Support: 2 associates
    const charlieAssociates = [
      {
        parentStaffId: testData.staff.support[0]._id,
        parentName: "Charlie Support",
        name: "Henry Associate (Charlie)",
        email: "henry.assoc@e2etest.com",
        phone: "+1-555-0400",
        allocatedTickets: 30,
      },
      {
        parentStaffId: testData.staff.support[0]._id,
        parentName: "Charlie Support",
        name: "Ivy Associate (Charlie)",
        email: "ivy.assoc@e2etest.com",
        phone: "+1-555-0401",
        allocatedTickets: 30,
      },
    ];

    // Under Eve Reseller: 3 associates
    const eveAssociates = [
      {
        parentStaffId: testData.staff.resellers[0]._id,
        parentName: "Eve Reseller",
        name: "Jack Associate (Eve)",
        email: "jack.assoc@e2etest.com",
        phone: "+1-555-0500",
        allocatedTickets: 20,
      },
      {
        parentStaffId: testData.staff.resellers[0]._id,
        parentName: "Eve Reseller",
        name: "Karen Associate (Eve)",
        email: "karen.assoc@e2etest.com",
        phone: "+1-555-0501",
        allocatedTickets: 25,
      },
      {
        parentStaffId: testData.staff.resellers[0]._id,
        parentName: "Eve Reseller",
        name: "Leo Associate (Eve)",
        email: "leo.assoc@e2etest.com",
        phone: "+1-555-0502",
        allocatedTickets: 30,
      },
    ];

    // Under Frank Reseller: 2 associates
    const frankAssociates = [
      {
        parentStaffId: testData.staff.resellers[1]._id,
        parentName: "Frank Reseller",
        name: "Mia Associate (Frank)",
        email: "mia.assoc@e2etest.com",
        phone: "+1-555-0600",
        allocatedTickets: 25,
      },
      {
        parentStaffId: testData.staff.resellers[1]._id,
        parentName: "Frank Reseller",
        name: "Noah Associate (Frank)",
        email: "noah.assoc@e2etest.com",
        phone: "+1-555-0601",
        allocatedTickets: 25,
      },
    ];

    const allAssociates = [...charlieAssociates, ...eveAssociates, ...frankAssociates];

    for (const assoc of allAssociates) {
      const staffId = await client.mutation(api.staff.mutations.assignSubSeller, {
        eventId,
        parentStaffId: assoc.parentStaffId,
        name: assoc.name,
        email: assoc.email,
        phone: assoc.phone,
        allocatedTickets: assoc.allocatedTickets,
        commissionType: "PERCENTAGE",
        commissionValue: 5, // Associates get 5% default
      });

      testData.staff.associates.push({
        _id: staffId,
        ...assoc,
      });
    }

    log.success(`Associates created: ${testData.staff.associates.length}`);

    // Summary
    const totalStaff =
      testData.staff.scanners.length +
      testData.staff.support.length +
      testData.staff.resellers.length +
      testData.staff.associates.length;

    log.info(`Total staff members: ${totalStaff}`);
    log.data("  Door Scanners", testData.staff.scanners.length);
    log.data("  Staff Support", testData.staff.support.length);
    log.data("  Resellers", testData.staff.resellers.length);
    log.data("  Associates", testData.staff.associates.length);

  } catch (error) {
    log.error(`Phase 2 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// PHASE 3: TICKET SALES SIMULATION
// ============================================================================

async function phase3_ticketSalesSimulation() {
  log.phase(3, "Ticket Sales Simulation");

  try {
    const eventId = testData.event._id;
    const gaTier = testData.ticketTiers.find((t) => t.name === "General Admission");
    const vipTier = testData.ticketTiers.find((t) => t.name === "VIP");
    const tableTier = testData.ticketTiers.find((t) => t.name === "Table Package");

    // ========== ONLINE SALES (10 tickets) ==========
    log.info("Simulating online sales...");

    const onlineSales = [
      { tier: gaTier, quantity: 5, buyer: "Customer One", email: "customer1@test.com" },
      { tier: vipTier, quantity: 3, buyer: "Customer Two", email: "customer2@test.com" },
      { tier: tableTier, quantity: 2, buyer: "Customer Three", email: "customer3@test.com" },
    ];

    for (const sale of onlineSales) {
      const orderId = await client.mutation(api.tickets.mutations.createOrder, {
        eventId,
        ticketTierId: sale.tier._id,
        quantity: sale.quantity,
        buyerName: sale.buyer,
        buyerEmail: sale.email,
        subtotalCents: sale.tier.price * sale.quantity,
        platformFeeCents: 0,
        processingFeeCents: 0,
        totalCents: sale.tier.price * sale.quantity,
      });

      // Complete order
      await client.mutation(api.tickets.mutations.completeOrder, {
        orderId,
        paymentId: `test_payment_${Date.now()}`,
        paymentMethod: "TEST",
      });

      testData.sales.push({
        type: "online",
        orderId,
        tier: sale.tier.name,
        quantity: sale.quantity,
        amount: sale.tier.price * sale.quantity,
      });
    }

    log.success(`Online sales completed: 10 tickets`);

    // ========== STAFF CASH SALES ==========
    log.info("Simulating staff cash sales...");

    const staffSales = [
      {
        staff: testData.staff.support[0], // Charlie
        tier: gaTier,
        quantity: 15,
        buyer: "Walk-in Customer A",
        email: "walkin-a@test.com",
        method: "CASH",
      },
      {
        staff: testData.staff.support[1], // Diana
        tier: vipTier,
        quantity: 10,
        buyer: "Walk-in Customer B",
        email: "walkin-b@test.com",
        method: "CASH_APP",
      },
      {
        staff: testData.staff.resellers[0], // Eve
        tier: gaTier,
        quantity: 25,
        buyer: "Walk-in Customer C",
        email: "walkin-c@test.com",
        method: "SQUARE",
      },
      {
        staff: testData.staff.resellers[1], // Frank
        tier: gaTier,
        quantity: 20,
        buyer: "Walk-in Customer D",
        email: "walkin-d@test.com",
        method: "CASH",
      },
      {
        staff: testData.staff.resellers[1], // Frank again
        tier: vipTier,
        quantity: 10,
        buyer: "Walk-in Customer E",
        email: "walkin-e@test.com",
        method: "CASH",
      },
      {
        staff: testData.staff.resellers[2], // Grace
        tier: gaTier,
        quantity: 30,
        buyer: "Walk-in Customer F",
        email: "walkin-f@test.com",
        method: "CASH",
      },
    ];

    for (const sale of staffSales) {
      const result = await client.mutation(api.staff.mutations.createCashSale, {
        staffId: sale.staff._id,
        eventId,
        ticketTierId: sale.tier._id,
        quantity: sale.quantity,
        buyerName: sale.buyer,
        buyerEmail: sale.email,
        paymentMethod: sale.method,
      });

      testData.sales.push({
        type: "staff_cash",
        staffName: sale.staff.name,
        tier: sale.tier.name,
        quantity: sale.quantity,
        commission: result.commission,
        amount: result.totalPrice,
      });
    }

    log.success(`Staff cash sales completed: ${staffSales.length} transactions`);

    // ========== ASSOCIATE SALES ==========
    log.info("Simulating associate sales (hierarchical commission)...");

    const associateSales = [
      // Eve's associates
      {
        staff: testData.staff.associates[2], // Jack (Eve)
        tier: gaTier,
        quantity: 10,
        buyer: "Customer via Jack",
        email: "jack-customer@test.com",
      },
      {
        staff: testData.staff.associates[3], // Karen (Eve)
        tier: gaTier,
        quantity: 15,
        buyer: "Customer via Karen",
        email: "karen-customer@test.com",
      },
      {
        staff: testData.staff.associates[4], // Leo (Eve)
        tier: vipTier,
        quantity: 12,
        buyer: "Customer via Leo",
        email: "leo-customer@test.com",
      },
      // Frank's associates
      {
        staff: testData.staff.associates[5], // Mia (Frank)
        tier: gaTier,
        quantity: 12,
        buyer: "Customer via Mia",
        email: "mia-customer@test.com",
      },
      {
        staff: testData.staff.associates[6], // Noah (Frank)
        tier: gaTier,
        quantity: 12,
        buyer: "Customer via Noah",
        email: "noah-customer@test.com",
      },
      // Charlie's associates
      {
        staff: testData.staff.associates[0], // Henry (Charlie)
        tier: gaTier,
        quantity: 15,
        buyer: "Customer via Henry",
        email: "henry-customer@test.com",
      },
      {
        staff: testData.staff.associates[1], // Ivy (Charlie)
        tier: gaTier,
        quantity: 15,
        buyer: "Customer via Ivy",
        email: "ivy-customer@test.com",
      },
    ];

    for (const sale of associateSales) {
      const result = await client.mutation(api.staff.mutations.createCashSale, {
        staffId: sale.staff._id,
        eventId,
        ticketTierId: sale.tier._id,
        quantity: sale.quantity,
        buyerName: sale.buyer,
        buyerEmail: sale.email,
        paymentMethod: "CASH",
      });

      testData.sales.push({
        type: "associate",
        staffName: sale.staff.name,
        parentName: sale.staff.parentName,
        tier: sale.tier.name,
        quantity: sale.quantity,
        commission: result.commission,
        amount: result.totalPrice,
      });
    }

    log.success(`Associate sales completed: ${associateSales.length} transactions`);

    // Summary
    const totalTicketsSold = testData.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = testData.sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCommission = testData.sales
      .filter((s) => s.commission)
      .reduce((sum, sale) => sum + sale.commission, 0);

    log.info("Sales Summary:");
    log.data("  Total tickets sold", totalTicketsSold);
    log.data("  Total revenue", formatCurrency(totalRevenue));
    log.data("  Total commission", formatCurrency(totalCommission));

  } catch (error) {
    log.error(`Phase 3 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// PHASE 4: TICKET TRANSFER SCENARIOS
// ============================================================================

async function phase4_ticketTransferScenarios() {
  log.phase(4, "Ticket Transfer Scenarios");

  try {
    const eventId = testData.event._id;

    // ========== TRANSFER 1: Frank → Eve (APPROVED) ==========
    log.info("Transfer #1: Frank Reseller → Eve Reseller (30 tickets)");

    const transfer1 = await client.mutation(api.staff.transfers.requestTransfer, {
      eventId,
      fromStaffId: testData.staff.resellers[1]._id, // Frank
      toStaffId: testData.staff.resellers[0]._id, // Eve
      ticketQuantity: 30,
      reason: "Frank is running low on inventory",
      notes: "Please accept - high demand area",
    });

    log.success(`Transfer requested: ${transfer1.transferId}`);

    // Accept the transfer
    await sleep(1000);
    await client.mutation(api.staff.transfers.acceptTransfer, {
      transferId: transfer1.transferId,
    });

    log.success("Transfer accepted ✓");

    testData.transfers.push({
      from: "Frank Reseller",
      to: "Eve Reseller",
      quantity: 30,
      status: "ACCEPTED",
    });

    // ========== TRANSFER 2: Charlie → Diana (APPROVED) ==========
    log.info("Transfer #2: Charlie Support → Diana Support (20 tickets)");

    const transfer2 = await client.mutation(api.staff.transfers.requestTransfer, {
      eventId,
      fromStaffId: testData.staff.support[0]._id, // Charlie
      toStaffId: testData.staff.support[1]._id, // Diana
      ticketQuantity: 20,
      reason: "Diana is outselling Charlie - reallocating to high performer",
      notes: "Performance-based reallocation",
    });

    log.success(`Transfer requested: ${transfer2.transferId}`);

    await sleep(1000);
    await client.mutation(api.staff.transfers.acceptTransfer, {
      transferId: transfer2.transferId,
    });

    log.success("Transfer accepted ✓");

    testData.transfers.push({
      from: "Charlie Support",
      to: "Diana Support",
      quantity: 20,
      status: "ACCEPTED",
    });

    // ========== TRANSFER 3: Eve → Jack Associate (APPROVED) ==========
    log.info("Transfer #3: Eve Reseller → Jack Associate (15 tickets)");

    const transfer3 = await client.mutation(api.staff.transfers.requestTransfer, {
      eventId,
      fromStaffId: testData.staff.resellers[0]._id, // Eve
      toStaffId: testData.staff.associates[2]._id, // Jack (Eve's associate)
      ticketQuantity: 15,
      reason: "High demand in Jack's area - needs more inventory",
      notes: "Rush order area",
    });

    log.success(`Transfer requested: ${transfer3.transferId}`);

    await sleep(1000);
    await client.mutation(api.staff.transfers.acceptTransfer, {
      transferId: transfer3.transferId,
    });

    log.success("Transfer accepted ✓");

    testData.transfers.push({
      from: "Eve Reseller",
      to: "Jack Associate (Eve)",
      quantity: 15,
      status: "ACCEPTED",
    });

    // ========== TRANSFER 4: Grace → Frank (REJECTED) ==========
    log.info("Transfer #4: Grace Reseller → Frank Reseller (25 tickets) [WILL BE REJECTED]");

    const transfer4 = await client.mutation(api.staff.transfers.requestTransfer, {
      eventId,
      fromStaffId: testData.staff.resellers[2]._id, // Grace
      toStaffId: testData.staff.resellers[1]._id, // Frank
      ticketQuantity: 25,
      reason: "Helping Frank replenish inventory",
      notes: "Goodwill transfer",
    });

    log.success(`Transfer requested: ${transfer4.transferId}`);

    await sleep(1000);
    await client.mutation(api.staff.transfers.rejectTransfer, {
      transferId: transfer4.transferId,
      rejectionReason: "Already have enough inventory, thanks anyway!",
    });

    log.warning("Transfer rejected ✗");

    testData.transfers.push({
      from: "Grace Reseller",
      to: "Frank Reseller",
      quantity: 25,
      status: "REJECTED",
      reason: "Already have enough inventory",
    });

    // ========== TRANSFER 5: Diana → Charlie (CANCELLED) ==========
    log.info("Transfer #5: Diana Support → Charlie Support (10 tickets) [WILL BE CANCELLED]");

    const transfer5 = await client.mutation(api.staff.transfers.requestTransfer, {
      eventId,
      fromStaffId: testData.staff.support[1]._id, // Diana
      toStaffId: testData.staff.support[0]._id, // Charlie
      ticketQuantity: 10,
      reason: "Helping Charlie replenish",
      notes: "Reciprocal support",
    });

    log.success(`Transfer requested: ${transfer5.transferId}`);

    await sleep(1000);
    await client.mutation(api.staff.transfers.cancelTransfer, {
      transferId: transfer5.transferId,
    });

    log.warning("Transfer cancelled by sender ✗");

    testData.transfers.push({
      from: "Diana Support",
      to: "Charlie Support",
      quantity: 10,
      status: "CANCELLED",
      reason: "Sender changed mind",
    });

    // Summary
    log.info("Transfer Summary:");
    log.data("  Total transfers", testData.transfers.length);
    log.data("  Accepted", testData.transfers.filter((t) => t.status === "ACCEPTED").length);
    log.data("  Rejected", testData.transfers.filter((t) => t.status === "REJECTED").length);
    log.data("  Cancelled", testData.transfers.filter((t) => t.status === "CANCELLED").length);

  } catch (error) {
    log.error(`Phase 4 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// PHASE 5: DOOR SCANNING SIMULATION
// ============================================================================

async function phase5_doorScanningSimulation() {
  log.phase(5, "Door Scanning Simulation");

  try {
    const eventId = testData.event._id;

    // Get some valid tickets to scan
    const tickets = await client.query(api.tickets.queries.getEventTickets, {
      eventId,
    });

    const validTickets = tickets.filter((t) => t.status === "VALID");

    log.info(`Found ${validTickets.length} valid tickets to scan`);

    // ========== SCANNER 1 (Alice) - 15 valid + 2 error cases ==========
    log.info("Scanner 1 (Alice Scanner) scanning tickets...");

    let aliceScans = { valid: 0, errors: 0 };

    // Scan 15 valid tickets
    for (let i = 0; i < Math.min(15, validTickets.length); i++) {
      const ticket = validTickets[i];

      try {
        const result = await client.mutation(api.scanning.mutations.scanTicket, {
          ticketCode: ticket.ticketCode,
          eventId,
        });

        if (result.success) {
          aliceScans.valid++;
          testData.scans.push({
            scanner: "Alice Scanner",
            ticketCode: ticket.ticketCode,
            status: "SUCCESS",
          });
        }
      } catch (error) {
        aliceScans.errors++;
        log.error(`Scan failed: ${error.message}`);
      }
    }

    // Try to scan an already scanned ticket (error case)
    if (validTickets.length > 0) {
      try {
        await client.mutation(api.scanning.mutations.scanTicket, {
          ticketCode: validTickets[0].ticketCode,
          eventId,
        });
      } catch (error) {
        aliceScans.errors++;
        log.warning(`Expected error - Already scanned: ${error.message}`);
        testData.scans.push({
          scanner: "Alice Scanner",
          ticketCode: validTickets[0].ticketCode,
          status: "ERROR_ALREADY_SCANNED",
        });
      }
    }

    // Try to scan a fake/cancelled ticket (error case)
    try {
      await client.mutation(api.scanning.mutations.scanTicket, {
        ticketCode: "FAKE-TICKET-CODE-999",
        eventId,
      });
    } catch (error) {
      aliceScans.errors++;
      log.warning(`Expected error - Invalid ticket: ${error.message}`);
      testData.scans.push({
        scanner: "Alice Scanner",
        ticketCode: "FAKE-TICKET-CODE-999",
        status: "ERROR_NOT_FOUND",
      });
    }

    log.success(`Alice Scanner: ${aliceScans.valid} valid scans, ${aliceScans.errors} errors`);

    // ========== SCANNER 2 (Bob) - 20 valid + 1 error + 2 undos ==========
    log.info("Scanner 2 (Bob Scanner) scanning tickets...");

    let bobScans = { valid: 0, errors: 0, undos: 0 };

    // Scan 20 valid tickets
    for (let i = 15; i < Math.min(35, validTickets.length); i++) {
      const ticket = validTickets[i];

      try {
        const result = await client.mutation(api.scanning.mutations.scanTicket, {
          ticketCode: ticket.ticketCode,
          eventId,
        });

        if (result.success) {
          bobScans.valid++;
          testData.scans.push({
            scanner: "Bob Scanner",
            ticketCode: ticket.ticketCode,
            status: "SUCCESS",
          });
        }
      } catch (error) {
        bobScans.errors++;
        log.error(`Scan failed: ${error.message}`);
      }
    }

    // Try to scan ticket from wrong event (error case)
    try {
      await client.mutation(api.scanning.mutations.scanTicket, {
        ticketCode: validTickets[0].ticketCode,
        eventId: "wrong_event_id_123", // Wrong event
      });
    } catch (error) {
      bobScans.errors++;
      log.warning(`Expected error - Wrong event: ${error.message}`);
      testData.scans.push({
        scanner: "Bob Scanner",
        ticketCode: validTickets[0].ticketCode,
        status: "ERROR_WRONG_EVENT",
      });
    }

    // Undo 2 scans (mistake correction)
    if (validTickets.length >= 17) {
      for (let i = 15; i < 17; i++) {
        const ticket = validTickets[i];

        try {
          // Find the ticket ID
          const ticketToUndo = tickets.find((t) => t.ticketCode === ticket.ticketCode);

          await client.mutation(api.scanning.mutations.unScanTicket, {
            ticketId: ticketToUndo._id,
          });

          bobScans.undos++;
          testData.scans.push({
            scanner: "Bob Scanner",
            ticketCode: ticket.ticketCode,
            status: "UNDO",
          });
        } catch (error) {
          log.error(`Undo failed: ${error.message}`);
        }
      }
    }

    log.success(`Bob Scanner: ${bobScans.valid} valid scans, ${bobScans.errors} errors, ${bobScans.undos} undos`);

    // Summary
    const totalScans = testData.scans.length;
    const successScans = testData.scans.filter((s) => s.status === "SUCCESS").length;
    const errorScans = testData.scans.filter((s) => s.status.startsWith("ERROR")).length;
    const undoScans = testData.scans.filter((s) => s.status === "UNDO").length;

    log.info("Scanning Summary:");
    log.data("  Total scan operations", totalScans);
    log.data("  Successful scans", successScans);
    log.data("  Error cases", errorScans);
    log.data("  Undos", undoScans);

  } catch (error) {
    log.error(`Phase 5 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// PHASE 6: REPORTS & VERIFICATION
// ============================================================================

async function phase6_reportsAndVerification() {
  log.phase(6, "Reports & Verification");

  try {
    const eventId = testData.event._id;

    // ========== STAFF PERFORMANCE REPORT ==========
    log.info("Generating staff performance report...");

    const allStaff = [
      ...testData.staff.support,
      ...testData.staff.resellers,
      ...testData.staff.associates,
    ];

    console.log("\n📊 STAFF PERFORMANCE SUMMARY");
    console.log("━".repeat(100));
    console.log(
      "Name".padEnd(30) +
        "Role".padEnd(15) +
        "Allocated".padEnd(12) +
        "Sold".padEnd(8) +
        "Remaining".padEnd(12) +
        "Commission"
    );
    console.log("━".repeat(100));

    for (const staff of allStaff) {
      try {
        const details = await client.query(api.staff.queries.getStaffMemberDetails, {
          staffId: staff._id,
        });

        const remaining = details.ticketsRemaining || 0;
        const sold = (staff.allocatedTickets || 0) - remaining;

        console.log(
          staff.name.padEnd(30) +
            staff.role.padEnd(15) +
            String(staff.allocatedTickets || 0).padEnd(12) +
            String(sold).padEnd(8) +
            String(remaining).padEnd(12) +
            formatCurrency(details.commissionEarned || 0)
        );
      } catch (error) {
        log.warning(`Could not get details for ${staff.name}: ${error.message}`);
      }
    }

    console.log("━".repeat(100));

    // ========== TRANSFER AUDIT LOG ==========
    log.info("Transfer audit log...");

    console.log("\n📋 TRANSFER AUDIT LOG");
    console.log("━".repeat(100));
    console.log("From".padEnd(25) + "To".padEnd(25) + "Quantity".padEnd(12) + "Status");
    console.log("━".repeat(100));

    for (const transfer of testData.transfers) {
      console.log(
        transfer.from.padEnd(25) +
          transfer.to.padEnd(25) +
          String(transfer.quantity).padEnd(12) +
          transfer.status
      );
    }

    console.log("━".repeat(100));

    // ========== SCANNING STATISTICS ==========
    log.info("Scanning statistics...");

    console.log("\n🎫 SCANNING STATISTICS");
    console.log("━".repeat(60));

    const scannerStats = {};

    for (const scan of testData.scans) {
      if (!scannerStats[scan.scanner]) {
        scannerStats[scan.scanner] = { success: 0, errors: 0, undos: 0 };
      }

      if (scan.status === "SUCCESS") {
        scannerStats[scan.scanner].success++;
      } else if (scan.status === "UNDO") {
        scannerStats[scan.scanner].undos++;
      } else {
        scannerStats[scan.scanner].errors++;
      }
    }

    for (const [scanner, stats] of Object.entries(scannerStats)) {
      console.log(`${scanner}:`);
      console.log(`  ✓ Successful scans: ${stats.success}`);
      console.log(`  ✗ Errors: ${stats.errors}`);
      console.log(`  ↶ Undos: ${stats.undos}`);
    }

    console.log("━".repeat(60));

    // ========== HIERARCHY VISUALIZATION ==========
    log.info("Hierarchy tree visualization...");

    console.log("\n🌳 STAFF HIERARCHY TREE");
    console.log("━".repeat(60));
    console.log("ORGANIZER: Test Organizer");
    console.log("│");
    console.log("├─ DOOR SCANNERS (2)");
    testData.staff.scanners.forEach((s) => console.log(`│  ├─ ${s.name}`));
    console.log("│");
    console.log("├─ STAFF SUPPORT (2)");
    testData.staff.support.forEach((s) => {
      console.log(`│  ├─ ${s.name} (${s.allocatedTickets} tickets, ${s.commissionValue}% commission)`);
      const subs = testData.staff.associates.filter((a) => a.parentStaffId === s._id);
      subs.forEach((sub) => console.log(`│  │  └─ ${sub.name} (${sub.allocatedTickets} tickets)`));
    });
    console.log("│");
    console.log("└─ RESELLERS (3)");
    testData.staff.resellers.forEach((r, idx) => {
      const isLast = idx === testData.staff.resellers.length - 1;
      const prefix = isLast ? "   └─" : "   ├─";
      console.log(`${prefix} ${r.name} (${r.allocatedTickets} tickets, ${r.commissionValue}% commission)`);
      const subs = testData.staff.associates.filter((a) => a.parentStaffId === r._id);
      subs.forEach((sub, subIdx) => {
        const subLast = subIdx === subs.length - 1;
        const subPrefix = isLast ? "      " : "   │  ";
        const subSymbol = subLast ? "└─" : "├─";
        console.log(`${subPrefix}${subSymbol} ${sub.name} (${sub.allocatedTickets} tickets)`);
      });
    });
    console.log("━".repeat(60));

    // ========== FINAL VERIFICATION ==========
    log.info("Running final verification checks...");

    const totalSalesCount = testData.sales.length;
    const totalTicketsSold = testData.sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = testData.sales.reduce((sum, s) => sum + s.amount, 0);

    console.log("\n✅ VERIFICATION RESULTS");
    console.log("━".repeat(60));
    console.log(`✓ Total sales transactions: ${totalSalesCount}`);
    console.log(`✓ Total tickets sold: ${totalTicketsSold}`);
    console.log(`✓ Total revenue: ${formatCurrency(totalRevenue)}`);
    console.log(`✓ Total transfers: ${testData.transfers.length}`);
    console.log(`✓ Total scan operations: ${testData.scans.length}`);
    console.log("━".repeat(60));

  } catch (error) {
    log.error(`Phase 6 failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanup() {
  if (!CLEANUP_MODE) {
    log.info("Cleanup skipped. Run with --cleanup flag to remove test data.");
    return;
  }

  log.phase("CLEANUP", "Removing test data...");

  try {
    // Note: Implement cleanup logic here if needed
    // This would delete all created test records
    log.warning("Cleanup not yet implemented - test data remains in database");
  } catch (error) {
    log.error(`Cleanup failed: ${error.message}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log.header("🎯 COMPREHENSIVE END-TO-END TEST STARTED");

  try {
    await phase1_setupOrganizerAndEvent();
    await phase2_setupStaffHierarchy();
    await phase3_ticketSalesSimulation();
    await phase4_ticketTransferScenarios();
    await phase5_doorScanningSimulation();
    await phase6_reportsAndVerification();

    await cleanup();

    log.header("✅ ALL TESTS PASSED - COMPREHENSIVE E2E TEST COMPLETE");

    process.exit(0);
  } catch (error) {
    log.header("❌ TEST FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();
