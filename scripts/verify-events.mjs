#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🔍 Verifying Events and Bundles\n");

async function main() {
  try {
    // Get all published events
    const events = await client.query(api.public.queries.getPublishedEvents);

    console.log(`📊 Found ${events.length} published events:\n`);

    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name}`);
      console.log(`   - ID: ${event._id}`);
      console.log(`   - Type: ${event.eventType}`);
      console.log(`   - Status: ${event.status}`);
      console.log(`   - Tickets Visible: ${event.ticketsVisible}`);
      console.log(`   - Date: ${new Date(event.startDate).toLocaleDateString()}`);
      console.log();
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`✅ Total: ${events.length} events\n`);

  } catch (error) {
    console.error("\n💥 Error:", error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
