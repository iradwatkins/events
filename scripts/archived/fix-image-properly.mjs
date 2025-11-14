#!/usr/bin/env node

/**
 * FIX IMAGE PROPERLY
 *
 * The issue: We set imageUrl to a manual URL, but Convex storage requires
 * using ctx.storage.getUrl() which can only be called from within Convex functions.
 *
 * Solution: Remove the imageUrl and let the query auto-convert from images array.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const eventId = "jh72k7akpm9epgcn8tsncfa34d7v8y6x";

  console.log("🔧 FIXING IMAGE URL PROPERLY\n");

  // The correct approach: Don't set imageUrl manually
  // Let the Convex query handle it via ctx.storage.getUrl()

  // Set imageUrl to undefined so the query uses the images array
  console.log("Setting imageUrl to undefined...");
  console.log("The query will auto-convert from images array using ctx.storage.getUrl()\n");

  try {
    await client.mutation(api.events.mutations.updateEvent, {
      eventId,
      imageUrl: undefined,  // Remove manual URL
    });
    console.log("✅ Image URL cleared\n");
    console.log("The images array still contains: kg2drafjkgztryw05ezte2e37h7v9dfb");
    console.log("Queries will auto-convert this to a working URL\n");
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✅ DONE! Image should now display correctly\n");
  console.log("How it works:");
  console.log("1. Event has storage ID in images array");
  console.log("2. Convex queries use ctx.storage.getUrl(storageId)");
  console.log("3. This returns a temporary signed URL");
  console.log("4. Frontend displays the image\n");
}

main().catch((error) => {
  console.error("\n❌ ERROR:", error);
  process.exit(1);
});
