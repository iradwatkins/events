#!/usr/bin/env node
/**
 * ACTIVATE ALL ORGANIZER EVENTS
 * Finds all events for organizer1 and activates ticket sales
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const ORGANIZER_ID = "jh71c44gk1f56v26a42t9bvxmh7v8v24"; // organizer1@stepperslife.com

async function main() {
  console.log("🔍 Finding all events for organizer1@stepperslife.com...\n");

  try {
    // Get all events (no auth, returns all events)
    const events = await client.query(api.events.queries.getOrganizerEvents);

    console.log(`Found ${events.length} total events\n`);
    console.log("═".repeat(70));

    let activated = 0;
    let failed = 0;

    for (const event of events) {
      try {
        console.log(`\nActivating: ${event.name}`);
        console.log(`  ID: ${event._id}`);
        console.log(`  Type: ${event.eventType}`);

        await client.mutation(api.testing.helpers.enableTicketsForTesting, {
          eventId: event._id,
        });

        console.log(`  ✅ Tickets activated!`);
        console.log(`  URL: https://events.stepperslife.com/events/${event._id}`);
        activated++;
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        failed++;
      }
    }

    console.log("\n" + "═".repeat(70));
    console.log(`\n✅ Successfully activated: ${activated} events`);
    if (failed > 0) console.log(`❌ Failed: ${failed} events`);
    console.log("\n" + "═".repeat(70));

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
