#!/usr/bin/env node

/**
 * Delete All Test Events
 *
 * Removes all existing test events to start fresh
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🗑️  Deleting All Test Events\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

async function main() {
  try {
    // Get all published events (including past events)
    const events = await client.query(api.public.queries.getPublishedEvents, { includePast: true });

    if (events.length === 0) {
      console.log("✅ No events found. Database is already clean!\n");
      process.exit(0);
    }

    console.log(`Found ${events.length} events to delete\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let deleted = 0;
    let failed = 0;

    for (const event of events) {
      try {
        console.log(`🗑️  Deleting: ${event.name}`);

        // Delete event
        await client.mutation(api.admin.deleteEvent, {
          eventId: event._id,
        });

        deleted++;
        console.log(`   ✓ Deleted successfully`);
      } catch (error) {
        failed++;
        console.log(`   ✗ Failed: ${error.message}`);
        // Continue with other events even if one fails
      }
      console.log();
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`✅ Deletion complete!`);
    console.log(`   • ${deleted} events deleted`);
    console.log(`   • ${failed} events failed (likely have sold tickets)\n`);

  } catch (error) {
    console.error("\n💥 Error:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
