#!/usr/bin/env node

/**
 * Reset All Events - Comprehensive Cleanup
 *
 * Deletes ALL events (current and past) from the database
 * Uses admin deleteEvent action which can force deletion even with tickets sold
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🗑️  COMPREHENSIVE EVENT RESET\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);
console.log("⚠️  WARNING: This will delete ALL events including those with tickets sold!\n");

async function main() {
  try {
    // Get all events (published and unpublished, current and past)
    console.log("📋 Fetching all events...\n");

    const publishedEvents = await client.query(api.public.queries.getPublishedEvents, {
      includePast: true
    });

    console.log(`Found ${publishedEvents.length} events to delete\n`);

    if (publishedEvents.length === 0) {
      console.log("✅ No events found. Database is already clean!\n");
      process.exit(0);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("Starting deletion process...\n");

    let deleted = 0;
    let failed = 0;
    const errors = [];

    for (const event of publishedEvents) {
      try {
        console.log(`🗑️  Deleting: ${event.name}`);
        console.log(`   ID: ${event._id}`);
        console.log(`   Date: ${new Date(event.startTime).toLocaleString()}`);

        // Use admin deleteEvent action which has force deletion capability
        await client.action(api.adminPanel.mutations.deleteEvent, {
          eventId: event._id,
        });

        deleted++;
        console.log(`   ✓ Deleted successfully`);
      } catch (error) {
        failed++;
        console.log(`   ✗ Failed: ${error.message}`);
        errors.push({
          eventId: event._id,
          eventName: event.name,
          error: error.message
        });
      }
      console.log();
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`✅ Reset complete!`);
    console.log(`   • ${deleted} events deleted`);
    console.log(`   • ${failed} events failed\n`);

    if (errors.length > 0) {
      console.log("❌ Failed deletions:\n");
      errors.forEach(err => {
        console.log(`   • ${err.eventName} (${err.eventId})`);
        console.log(`     Error: ${err.error}\n`);
      });
    }

    // Verify cleanup
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("🔍 Verifying cleanup...\n");

    const remainingEvents = await client.query(api.public.queries.getPublishedEvents, {
      includePast: true
    });

    if (remainingEvents.length === 0) {
      console.log("✅ Verification passed: No events remaining in database\n");
    } else {
      console.log(`⚠️  WARNING: ${remainingEvents.length} events still remain:\n`);
      remainingEvents.forEach(evt => {
        console.log(`   • ${evt.name} (${evt._id})`);
      });
      console.log();
    }

  } catch (error) {
    console.error("\n💥 Error:", error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
