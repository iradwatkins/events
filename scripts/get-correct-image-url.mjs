#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const eventId = "jh72k7akpm9epgcn8tsncfa34d7v8y6x";

  console.log("Getting event data...\n");
  const event = await client.query(api.events.queries.getEventById, { eventId });

  console.log("Event:", event.name);
  console.log("Current imageUrl:", event.imageUrl);
  console.log("Images array:", event.images);
  console.log("\nStorage IDs need to be accessed through Convex storage.getUrl()");
  console.log("The frontend should handle this automatically.");
  console.log("\nLet's check how the event page component loads images...");
}

main().catch(console.error);
