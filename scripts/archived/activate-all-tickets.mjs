#!/usr/bin/env node

/**
 * Activate All Tickets
 *
 * Sets ticketsVisible=true and creates payment configs for all events
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fearless-dragon-613.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("🎫 Activating All Tickets\n");
console.log(`📡 Convex URL: ${CONVEX_URL}\n`);

async function main() {
  try {
    // Get all published events
    const events = await client.query(api.public.queries.getPublishedEvents);

    console.log(`Found ${events.length} events\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    let updated = 0;
    let paymentConfigsCreated = 0;

    for (const event of events) {
      console.log(`📍 ${event.name}`);

      // Update event to set ticketsVisible
      await client.mutation(api.events.mutations.updateEvent, {
        eventId: event._id,
        ticketsVisible: true,
      });
      updated++;
      console.log(`   ✓ Set ticketsVisible: true`);

      // Check if payment config exists
      const paymentConfig = await client.query(api.paymentConfig.queries.getEventPaymentConfig, {
        eventId: event._id,
      });

      if (!paymentConfig) {
        // Create payment config with CREDIT_CARD model (supports cash payments)
        await client.mutation(api.paymentConfig.mutations.selectCreditCardModel, {
          eventId: event._id,
        });
        paymentConfigsCreated++;
        console.log(`   ✓ Created payment config (CREDIT_CARD model with cash support)`);
      } else if (!paymentConfig.isActive) {
        // Activate existing payment config
        await client.mutation(api.paymentConfig.mutations.selectCreditCardModel, {
          eventId: event._id,
        });
        console.log(`   ✓ Activated existing payment config`);
        paymentConfigsCreated++;
      } else {
        console.log(`   ✓ Payment config already active`);
      }

      console.log();
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`✅ Success!`);
    console.log(`   • ${updated} events updated`);
    console.log(`   • ${paymentConfigsCreated} payment configs created/activated`);
    console.log(`\n🎉 All tickets are now ACTIVE and ready for purchase!\n`);

  } catch (error) {
    console.error("\n💥 Error:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
