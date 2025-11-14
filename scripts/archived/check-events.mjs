#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("Checking published events in database...\n");

  // Get published events
  const events = await client.query(api.public.queries.getPublishedEvents, { limit: 100 });

  console.log(`Found ${events.length} published events:\n`);

  for (const event of events) {
    console.log(`✅ ${event.name}`);
    console.log(`   ID: ${event._id}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Location: ${event.location.city}, ${event.location.state}`);
    console.log(`   Start Date: ${new Date(event.startDate).toLocaleString()}`);
    console.log(`   URL: https://events.stepperslife.com/events/${event._id}\n`);
  }

  if (events.length === 0) {
    console.log("❌ No published events found!\n");
  }
}

main().catch(console.error);
