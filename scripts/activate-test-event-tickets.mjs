#!/usr/bin/env node
/**
 * ACTIVATE TICKETS FOR TEST EVENTS
 *
 * This script activates ticket sales for the 3 test events by:
 * 1. Setting ticketsVisible = true
 * 2. Setting paymentModelSelected = true
 * 3. Creating active payment configs
 *
 * Usage: node scripts/activate-test-event-tickets.mjs
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// Event IDs from EVENT-CREATION-SUCCESS-REPORT.md
const EVENT_IDS = [
  "jh71zkevp6kd3xfje5jwq8vvah7v8y0e", // Spring Steppers Workshop 2026
  "jh79t8dgtxddpg3ryfjg6ck1m97v89yw", // Valentine's Gala 2026
  "jh739sdvnybq82why6rps0edt17v8etq", // Summer Block Party 2026
];

const log = {
  header: (text) => console.log(`\n${"═".repeat(70)}\n${text}\n${"═".repeat(70)}`),
  success: (text) => console.log(`✓ ${text}`),
  error: (text) => console.log(`✗ ${text}`),
  info: (text) => console.log(`ℹ ${text}`),
};

async function activateEventTickets(eventId) {
  try {
    log.info(`Activating tickets for event: ${eventId}`);

    // Call the testing helper to activate tickets
    await client.mutation(api.testing.helpers.enableTicketsForTesting, {
      eventId,
    });

    log.success(`Tickets activated for event: ${eventId}`);
    log.info(`  URL: https://events.stepperslife.com/events/${eventId}`);

    return true;
  } catch (error) {
    log.error(`Failed to activate tickets for ${eventId}: ${error.message}`);
    return false;
  }
}

async function main() {
  log.header("🎫 ACTIVATING TICKETS FOR TEST EVENTS");

  let successCount = 0;
  let failCount = 0;

  for (const eventId of EVENT_IDS) {
    const success = await activateEventTickets(eventId);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  log.header("✅ ACTIVATION COMPLETE");
  console.log(`\n✓ Successfully activated: ${successCount} events`);
  if (failCount > 0) {
    console.log(`✗ Failed: ${failCount} events`);
  }

  console.log("\n💡 VERIFY:");
  console.log("1. Visit each event URL");
  console.log("2. Tickets should now be visible and purchasable");
  console.log("3. Payment buttons should appear");

  process.exit(failCount > 0 ? 1 : 0);
}

main();
