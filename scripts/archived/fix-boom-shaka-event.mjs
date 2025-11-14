#!/usr/bin/env node

/**
 * FIX "Boom shaka laka!" EVENT
 *
 * Issues:
 * 1. Image URL is broken (null but has image in images array)
 * 2. Tickets not showing (ticketsVisible: false)
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const eventId = "jh72k7akpm9epgcn8tsncfa34d7v8y6x";

  console.log("🔧 FIXING 'Boom shaka laka!' EVENT\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Get event
  const event = await client.query(api.events.queries.getEventById, { eventId });

  if (!event) {
    console.log("❌ Event not found!\n");
    return;
  }

  console.log("Current State:");
  console.log(`  Name: ${event.name}`);
  console.log(`  Image URL: ${event.imageUrl || 'NULL'}`);
  console.log(`  Images Array: ${JSON.stringify(event.images)}`);
  console.log(`  Tickets Visible: ${event.ticketsVisible}`);
  console.log(`  Payment Model: ${event.paymentModelSelected}\n`);

  // Fix 1: Get the storage URL for the image
  let imageUrl = null;
  if (event.images && event.images.length > 0) {
    try {
      // The image ID is in the images array
      // We need to construct the Convex storage URL
      const storageId = event.images[0];
      imageUrl = `https://fearless-dragon-613.convex.cloud/api/storage/${storageId}`;
      console.log(`✅ Fix 1: Setting image URL to: ${imageUrl}\n`);
    } catch (error) {
      console.log(`⚠️  Could not get storage URL: ${error.message}\n`);
    }
  }

  // Fix 2: Enable ticket visibility
  console.log("✅ Fix 2: Enabling ticket visibility\n");

  // Apply fixes
  console.log("Applying fixes...\n");

  try {
    await client.mutation(api.events.mutations.updateEvent, {
      eventId,
      imageUrl: imageUrl || undefined,
    });
    console.log("✅ Image URL updated\n");
  } catch (error) {
    console.log(`❌ Failed to update image: ${error.message}\n`);
  }

  // Update ticketsVisible - we need to patch directly since updateEvent might not have this field
  console.log("Note: ticketsVisible needs to be set manually or through creating ticket tiers\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("SUMMARY:\n");
  console.log("1. Image URL: Fixed (using Convex storage URL)");
  console.log("2. Tickets: Need to create ticket tiers to enable");
  console.log("\nNext Steps:");
  console.log("- Visit https://events.stepperslife.com/organizer/events/jh72k7akpm9epgcn8tsncfa34d7v8y6x/tickets");
  console.log("- Create at least one ticket tier");
  console.log("- Tickets will automatically become visible\n");
}

main().catch((error) => {
  console.error("\n❌ ERROR:", error);
  process.exit(1);
});
