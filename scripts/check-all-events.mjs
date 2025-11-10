#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🔍 Checking ALL Events (any status)\n");

async function main() {
  try {
    // Get events with includePast
    const published = await client.query(api.public.queries.getPublishedEvents, { includePast: true });
    console.log(`Published events (including past): ${published.length}`);

    // Try to get event by ID (one of the IDs from the script output)
    const testId = "jh7fcrk3tmtztmbtwk0bkg8v4s7tvjk2";
    console.log(`\nTrying to get event by ID: ${testId}`);

    try {
      const event = await client.query(api.public.queries.getPublicEventDetails, { eventId: testId });
      if (event) {
        console.log(`✅ Found event: ${event.name}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Start: ${new Date(event.startDate).toISOString()}`);
        console.log(`   End: ${new Date(event.endDate).toISOString()}`);
      } else {
        console.log(`❌ Event not found`);
      }
    } catch (error) {
      console.log(`❌ Error getting event: ${error.message}`);
    }

  } catch (error) {
    console.error("\n💥 Error:", error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
