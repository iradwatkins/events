#!/usr/bin/env node

/**
 * ADD TICKETS TO "Boom shaka laka!" EVENT
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const eventId = "jh72k7akpm9epgcn8tsncfa34d7v8y6x";

  console.log("🎫 ADDING TICKETS TO 'Boom shaka laka!' EVENT\n");

  // Create General Admission tier
  console.log("Creating General Admission tier...");
  const generalTierId = await client.mutation(api.tickets.mutations.createTicketTier, {
    eventId,
    name: "General Admission",
    description: "Standard entry to the event",
    price: 5000, // $50.00
    quantity: 800,
  });
  console.log(`✅ General Admission created: ${generalTierId}\n`);

  // Create VIP tier
  console.log("Creating VIP tier...");
  const vipTierId = await client.mutation(api.tickets.mutations.createTicketTier, {
    eventId,
    name: "VIP Premium",
    description: "Premium seating with exclusive perks",
    price: 10000, // $100.00
    quantity: 200,
  });
  console.log(`✅ VIP Premium created: ${vipTierId}\n`);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("✅ SUCCESS! Tickets created for 'Boom shaka laka!'\n");
  console.log("Event now has:");
  console.log("  - 800 General Admission tickets @ $50.00");
  console.log("  - 200 VIP Premium tickets @ $100.00");
  console.log("  - Total capacity: 1,000 seats\n");
  console.log("🌐 View event: https://events.stepperslife.com/events/jh72k7akpm9epgcn8tsncfa34d7v8y6x\n");
}

main().catch((error) => {
  console.error("\n❌ ERROR:", error);
  process.exit(1);
});
