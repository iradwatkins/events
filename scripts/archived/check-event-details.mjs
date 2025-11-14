#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const eventId = "jh72k7akpm9epgcn8tsncfa34d7v8y6x";

  console.log(`Checking event: ${eventId}\n`);

  // Get event details
  const event = await client.query(api.events.queries.getEventById, { eventId });

  if (!event) {
    console.log("❌ Event not found!\n");
    return;
  }

  console.log("EVENT DETAILS:");
  console.log(`Name: ${event.name}`);
  console.log(`Status: ${event.status}`);
  console.log(`Image URL: ${event.imageUrl || 'NONE'}`);
  console.log(`Images Array: ${JSON.stringify(event.images)}`);
  console.log(`Tickets Visible: ${event.ticketsVisible}`);
  console.log(`Payment Model Selected: ${event.paymentModelSelected}\n`);

  // Get ticket tiers
  const tiers = await client.query(api.tickets.queries.getTicketTiersByEvent, { eventId });

  console.log(`TICKET TIERS: ${tiers.length} found`);

  if (tiers.length === 0) {
    console.log("❌ No ticket tiers found for this event!\n");
  } else {
    for (const tier of tiers) {
      console.log(`\n  ✅ ${tier.name}`);
      console.log(`     Price: $${(tier.price / 100).toFixed(2)}`);
      console.log(`     Quantity: ${tier.quantity}`);
      console.log(`     Sold: ${tier.sold}`);
      console.log(`     Active: ${tier.isActive}`);
    }
  }
}

main().catch(console.error);
