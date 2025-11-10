#!/usr/bin/env node

/**
 * Clean up ALL test data
 * Removes all test events and test accounts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🧹 Cleaning up all test data...\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

async function cleanup() {
  try {
    // Get all events
    const events = await client.query(api.events.queries.getOrganizerEvents);

    console.log(`Found ${events.length} events to delete\n`);

    if (events.length === 0) {
      console.log("✓ No events to delete");
      return;
    }

    // Delete all events
    const eventIds = events.map(e => e._id);

    console.log("Deleting events...");
    const result = await client.mutation(api.events.mutations.bulkDeleteEvents, {
      eventIds: eventIds
    });

    console.log(`\n✅ Deleted ${result.deletedCount} events`);

    if (result.failedCount > 0) {
      console.log(`⚠️  Failed to delete ${result.failedCount} events:`);
      result.failedEvents.forEach(failed => {
        console.log(`   - ${failed.eventId}: ${failed.reason}`);
      });
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  }
}

cleanup()
  .then(() => {
    console.log("\n✅ Cleanup completed!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
