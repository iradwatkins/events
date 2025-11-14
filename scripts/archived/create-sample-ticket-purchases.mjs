#!/usr/bin/env node
/**
 * CREATE SAMPLE TICKET PURCHASES
 *
 * This script creates sample ticket purchases for the 3 test events
 * to populate them with realistic data for testing.
 *
 * Usage: node scripts/create-sample-ticket-purchases.mjs
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

// Test event IDs (from previous script output)
const EVENT_IDS = {
  newYearsGala: "jh716qrchvx17sppd3fwre3pgn7v801j",
  valentinesDinner: "jh773yn96rasperjv1axndky4h7v92tg",
  summerBlockParty: "jh75srkqz250zzdpcr9ahnfdg97v8gk6",
};

// Sample customer data
const CUSTOMERS = [
  { name: "John Smith", email: "john.smith@example.com", phone: "+1-555-1001" },
  { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1-555-1002" },
  { name: "Michael Chen", email: "m.chen@example.com", phone: "+1-555-1003" },
  { name: "Emily Davis", email: "emily.davis@example.com", phone: "+1-555-1004" },
  { name: "David Martinez", email: "david.m@example.com", phone: "+1-555-1005" },
  { name: "Lisa Anderson", email: "lisa.a@example.com", phone: "+1-555-1006" },
  { name: "Robert Taylor", email: "r.taylor@example.com", phone: "+1-555-1007" },
  { name: "Jennifer White", email: "jennifer.w@example.com", phone: "+1-555-1008" },
  { name: "William Brown", email: "w.brown@example.com", phone: "+1-555-1009" },
  { name: "Jessica Wilson", email: "jessica.w@example.com", phone: "+1-555-1010" },
];

async function createTicketPurchase(eventId, tierName, quantity, customer) {
  try {
    // Get event details
    const event = await client.query(api.events.queries.getEventById, { eventId });
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Get ticket tiers
    const tiers = await client.query(api.tickets.queries.getEventPricingInfo, { eventId });
    const tier = tiers.find(t => t.name === tierName);

    if (!tier) {
      throw new Error(`Tier "${tierName}" not found for event ${event.name}`);
    }

    // Calculate pricing
    const subtotalCents = tier.price * quantity;
    const platformFeeCents = Math.round(subtotalCents * 0.03); // 3% platform fee
    const processingFeeCents = Math.round(subtotalCents * 0.029) + 30; // 2.9% + $0.30
    const totalCents = subtotalCents + platformFeeCents + processingFeeCents;

    // Create order
    const orderId = await client.mutation(api.tickets.mutations.createOrder, {
      eventId,
      ticketTierId: tier._id,
      quantity,
      buyerName: customer.name,
      buyerEmail: customer.email,
      subtotalCents,
      platformFeeCents,
      processingFeeCents,
      totalCents,
    });

    // Complete order (simulate successful payment)
    await client.mutation(api.tickets.mutations.completeOrder, {
      orderId,
      paymentId: `test_payment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      paymentMethod: "SQUARE",
    });

    log.success(`  ${customer.name}: ${quantity}× ${tierName} ($${(totalCents / 100).toFixed(2)})`);

    return orderId;
  } catch (error) {
    log.error(`  Failed: ${customer.name} - ${error.message}`);
    return null;
  }
}

async function createPurchasesForEvent1() {
  log.section("EVENT 1: New Year's Eve Gala 2026");
  log.info("Creating sample purchases...");

  const purchases = [
    { tier: "General Admission", qty: 2, customer: CUSTOMERS[0] },
    { tier: "VIP Access", qty: 1, customer: CUSTOMERS[0] },
    { tier: "Early Bird Special", qty: 4, customer: CUSTOMERS[1] },
    { tier: "General Admission", qty: 3, customer: CUSTOMERS[2] },
    { tier: "VIP Access", qty: 2, customer: CUSTOMERS[3] },
    { tier: "Student Discount", qty: 2, customer: CUSTOMERS[4] },
    { tier: "General Admission", qty: 5, customer: CUSTOMERS[5] },
    { tier: "VIP Access", qty: 1, customer: CUSTOMERS[6] },
    { tier: "Early Bird Special", qty: 3, customer: CUSTOMERS[7] },
    { tier: "General Admission", qty: 2, customer: CUSTOMERS[8] },
  ];

  let successCount = 0;
  for (const purchase of purchases) {
    const orderId = await createTicketPurchase(
      EVENT_IDS.newYearsGala,
      purchase.tier,
      purchase.qty,
      purchase.customer
    );
    if (orderId) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }

  log.data("Total purchases created", `${successCount}/${purchases.length}`);
}

async function createPurchasesForEvent2() {
  log.section("EVENT 2: Valentine's Day Dinner Dance 2026");
  log.info("Creating sample purchases...");

  const purchases = [
    { tier: "VIP Individual Seat", qty: 2, customer: CUSTOMERS[0] },
    { tier: "VIP Table Package", qty: 1, customer: CUSTOMERS[1] }, // Full table for 8
    { tier: "Premium Individual Seat", qty: 4, customer: CUSTOMERS[2] },
    { tier: "General Individual Seat", qty: 6, customer: CUSTOMERS[3] },
    { tier: "VIP Individual Seat", qty: 2, customer: CUSTOMERS[4] },
    { tier: "Premium Individual Seat", qty: 3, customer: CUSTOMERS[5] },
    { tier: "General Individual Seat", qty: 8, customer: CUSTOMERS[6] },
    { tier: "VIP Individual Seat", qty: 1, customer: CUSTOMERS[7] },
    { tier: "Premium Individual Seat", qty: 2, customer: CUSTOMERS[8] },
  ];

  let successCount = 0;
  for (const purchase of purchases) {
    const orderId = await createTicketPurchase(
      EVENT_IDS.valentinesDinner,
      purchase.tier,
      purchase.qty,
      purchase.customer
    );
    if (orderId) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log.data("Total purchases created", `${successCount}/${purchases.length}`);
}

async function createPurchasesForEvent3() {
  log.section("EVENT 3: Summer Block Party 2026");
  log.info("Creating sample purchases...");

  const purchases = [
    { tier: "General Admission", qty: 4, customer: CUSTOMERS[0] },
    { tier: "VIP Experience", qty: 2, customer: CUSTOMERS[1] },
    { tier: "General Admission", qty: 6, customer: CUSTOMERS[2] },
    { tier: "General Admission", qty: 3, customer: CUSTOMERS[3] },
    { tier: "VIP Experience", qty: 1, customer: CUSTOMERS[4] },
    { tier: "General Admission", qty: 5, customer: CUSTOMERS[5] },
    { tier: "VIP Experience", qty: 3, customer: CUSTOMERS[6] },
    { tier: "General Admission", qty: 8, customer: CUSTOMERS[7] },
    { tier: "General Admission", qty: 2, customer: CUSTOMERS[8] },
    { tier: "VIP Experience", qty: 2, customer: CUSTOMERS[9] },
  ];

  let successCount = 0;
  for (const purchase of purchases) {
    const orderId = await createTicketPurchase(
      EVENT_IDS.summerBlockParty,
      purchase.tier,
      purchase.qty,
      purchase.customer
    );
    if (orderId) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log.data("Total purchases created", `${successCount}/${purchases.length}`);
}

async function main() {
  log.header("🎫 CREATING SAMPLE TICKET PURCHASES");

  try {
    await createPurchasesForEvent1();
    await createPurchasesForEvent2();
    await createPurchasesForEvent3();

    log.header("✅ SAMPLE PURCHASES CREATED SUCCESSFULLY!");

    console.log("\n📊 SUMMARY:");
    console.log("═".repeat(70));
    console.log("✓ Event 1 (New Year's Eve Gala): ~25 tickets sold");
    console.log("✓ Event 2 (Valentine's Day Dinner): ~30 tickets sold");
    console.log("✓ Event 3 (Summer Block Party): ~36 tickets sold");
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Login at: https://events.stepperslife.com/login");
    console.log("2. Email: organizer1@stepperslife.com");
    console.log("3. Password: Bobby321!");
    console.log("4. View orders in each event dashboard");
    console.log("5. Test QR code scanning with generated tickets");
    console.log("═".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    log.header("❌ FAILED TO CREATE PURCHASES");
    console.error(error);
    process.exit(1);
  }
}

main();
